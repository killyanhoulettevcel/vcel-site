// src/app/api/produits/sync/stripe/route.ts
// Un produit Stripe avec N tarifs → N lignes dans la table produits

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

function getPrixLabel(price: any): string {
  const amount   = (price.unit_amount || 0) / 100
  const currency = (price.currency || 'eur').toUpperCase()
  if (price.recurring) {
    const interval = price.recurring.interval
    const count    = price.recurring.interval_count || 1
    const libelle  = count > 1
      ? `${count} ${interval === 'month' ? 'mois' : interval === 'year' ? 'ans' : interval}s`
      : interval === 'month' ? 'mois' : interval === 'year' ? 'an' : interval
    return `${amount}€/${libelle}`
  }
  return `${amount}€ (achat unique)`
}

function getTypeProduit(price: any): string {
  if (!price.recurring) return 'one_shot'
  const interval = price.recurring.interval
  if (interval === 'year')  return 'abonnement_annuel'
  if (interval === 'month') return 'abonnement_mensuel'
  if (interval === 'week')  return 'abonnement_hebdo'
  return 'abonnement'
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id

  const body = await req.json().catch(() => ({}))

  // Clé Stripe : body en priorité, sinon base
  let stripeKey = body.stripe_key?.trim()
  if (!stripeKey) {
    const { data: user } = await supabaseAdmin
      .from('users').select('stripe_secret_key').eq('id', userId).single()
    stripeKey = user?.stripe_secret_key
  }

  if (!stripeKey) return NextResponse.json({ error: 'Aucune clé Stripe configurée.' }, { status: 400 })
  if (!stripeKey.startsWith('sk_live_') && !stripeKey.startsWith('sk_test_')) {
    return NextResponse.json({ error: 'Clé Stripe invalide (sk_live_... ou sk_test_...)' }, { status: 400 })
  }

  // Sauvegarder la clé
  await supabaseAdmin.from('users').update({ stripe_secret_key: stripeKey }).eq('id', userId)

  const headers = { Authorization: `Bearer ${stripeKey}` }

  // Vérifier la clé
  const testRes = await fetch('https://api.stripe.com/v1/account', { headers })
  if (!testRes.ok) {
    const err = await testRes.json()
    return NextResponse.json({ error: `Clé invalide : ${err.error?.message || 'Accès refusé'}` }, { status: 400 })
  }

  try {
    // ── Récupérer produits + TOUS les prix ───────────────────────────────────
    const [prodRes, pricesRes] = await Promise.all([
      fetch('https://api.stripe.com/v1/products?limit=100&active=true', { headers }),
      fetch('https://api.stripe.com/v1/prices?limit=100&active=true', { headers }),
    ])
    const { data: stripeProducts = [] } = await prodRes.json()
    const { data: stripePrices = [] }   = await pricesRes.json()

    // Grouper les prix par produit_id — TOUS les prix, pas juste le premier
    const pricesByProduct: Record<string, any[]> = {}
    for (const price of stripePrices) {
      if (!pricesByProduct[price.product]) pricesByProduct[price.product] = []
      pricesByProduct[price.product].push(price)
    }

    let produitsSynced = 0
    // Map stripe_price_id → db product id (pour lier les ventes)
    const stripePriceToDbId: Record<string, string> = {}

    for (const p of stripeProducts) {
      const prices = pricesByProduct[p.id] || []

      if (prices.length === 0) {
        // Produit sans prix — on crée quand même une ligne
        prices.push({ id: null, unit_amount: 0, recurring: null, currency: 'eur' })
      }

      for (const price of prices) {
        const typeProduit = getTypeProduit(price)
        const prixLabel   = price.id ? getPrixLabel(price) : ''
        // Nom = nom produit + label prix si plusieurs tarifs
        const nomComplet  = prices.length > 1 && price.id
          ? `${p.name} · ${prixLabel}`
          : p.name

        // Chercher si cette combinaison produit+prix existe déjà
        const { data: existing } = await supabaseAdmin
          .from('produits')
          .select('id')
          .eq('user_id', userId)
          .eq('stripe_product_id', p.id)
          .eq('stripe_price_id', price.id || '')
          .single()

        const payload: any = {
          user_id:          userId,
          nom:              nomComplet,
          description:      p.description || '',
          prix_vente:       (price.unit_amount || 0) / 100,
          cout_revient:     0,
          stock:            0,
          source:           'stripe',
          stripe_product_id: p.id,
          stripe_price_id:  price.id || '',
          type_produit:     typeProduit,
          actif:            p.active,
          updated_at:       new Date().toISOString(),
        }

        let dbId: string | undefined
        if (existing?.id) {
          await supabaseAdmin.from('produits').update(payload).eq('id', existing.id)
          dbId = existing.id
        } else {
          const { data: inserted } = await supabaseAdmin
            .from('produits').insert(payload).select('id').single()
          dbId = inserted?.id
        }

        if (dbId && price.id) stripePriceToDbId[price.id] = dbId
        produitsSynced++
      }
    }

    // ── Ventes depuis PaymentIntents ─────────────────────────────────────────
    const since = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
    const chargesRes = await fetch(
      `https://api.stripe.com/v1/payment_intents?limit=100&created[gte]=${since}`,
      { headers }
    )
    const { data: charges = [] } = await chargesRes.json()

    // Récupérer les line items des invoices pour lier au bon price_id
    const invoicesRes = await fetch(
      `https://api.stripe.com/v1/invoices?limit=100&created[gte]=${since}&expand[]=data.lines.data.price`,
      { headers }
    )
    const { data: invoices = [] } = await invoicesRes.json()

    // Map payment_intent_id → price_id (via invoice)
    const intentToPriceId: Record<string, string> = {}
    for (const inv of invoices) {
      if (inv.payment_intent && inv.lines?.data?.[0]?.price?.id) {
        intentToPriceId[inv.payment_intent] = inv.lines.data[0].price.id
      }
    }

    let ventesSynced = 0
    for (const charge of charges) {
      if (charge.status !== 'succeeded') continue

      // Vérifier doublon
      const { data: existingVente } = await supabaseAdmin
        .from('ventes').select('id')
        .eq('user_id', userId).eq('stripe_payment_id', charge.id).single()
      if (existingVente) continue

      const priceId   = intentToPriceId[charge.id]
      const produitId = priceId ? stripePriceToDbId[priceId] : null

      // Nom du produit depuis le price_id si possible
      const matchingPrice   = stripePrices.find((pr: any) => pr.id === priceId)
      const matchingProduct = matchingPrice
        ? stripeProducts.find((p: any) => p.id === matchingPrice.product)
        : null

      await supabaseAdmin.from('ventes').insert({
        user_id:           userId,
        produit_id:        produitId || null,
        produit_nom:       matchingProduct?.name || charge.description || 'Paiement Stripe',
        quantite:          1,
        prix_unitaire:     (charge.amount || 0) / 100,
        source:            'stripe',
        stripe_payment_id: charge.id,
        date_vente:        new Date(charge.created * 1000).toISOString().split('T')[0],
      })
      ventesSynced++
    }

    // ── Connecteur ───────────────────────────────────────────────────────────
    const { data: existingConn } = await supabaseAdmin
      .from('connecteurs').select('id').eq('user_id', userId).eq('type', 'stripe').single()

    if (existingConn) {
      await supabaseAdmin.from('connecteurs')
        .update({ actif: true, derniere_sync: new Date().toISOString() }).eq('id', existingConn.id)
    } else {
      await supabaseAdmin.from('connecteurs')
        .insert({ user_id: userId, type: 'stripe', actif: true, derniere_sync: new Date().toISOString() })
    }

    return NextResponse.json({ success: true, produitsSynced, ventesSynced })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}