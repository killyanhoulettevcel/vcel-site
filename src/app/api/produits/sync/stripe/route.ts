// src/app/api/produits/sync/stripe/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id

  const body = await req.json().catch(() => ({}))

  // Récupérer la clé Stripe : body en priorité, sinon base
  let stripeKey = body.stripe_key?.trim()
  if (!stripeKey) {
    const { data: user } = await supabaseAdmin
      .from('users').select('stripe_secret_key').eq('id', userId).single()
    stripeKey = user?.stripe_secret_key
  }

  if (!stripeKey) {
    return NextResponse.json({ error: 'Aucune clé Stripe configurée.' }, { status: 400 })
  }
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
    // ── Produits + Prix ──────────────────────────────────────────────────────
    const [prodRes, pricesRes] = await Promise.all([
      fetch('https://api.stripe.com/v1/products?limit=100&active=true', { headers }),
      fetch('https://api.stripe.com/v1/prices?limit=100&active=true&expand[]=data.recurring', { headers }),
    ])
    const { data: stripeProducts = [] } = await prodRes.json()
    const { data: stripePrices = [] }   = await pricesRes.json()

    // Map produit_id → infos prix
    const priceMap: Record<string, { amount: number; type: string; interval?: string }> = {}
    for (const price of stripePrices) {
      if (!priceMap[price.product]) {
        const amount   = (price.unit_amount || 0) / 100
        const isRecurring = !!price.recurring
        const interval = price.recurring?.interval // 'month', 'year', 'week'
        priceMap[price.product] = {
          amount,
          type: isRecurring
            ? interval === 'year' ? 'abonnement_annuel'
            : interval === 'month' ? 'abonnement_mensuel'
            : 'abonnement'
            : 'one_shot',
          interval,
        }
      }
    }

    let produitsSynced = 0
    const stripeIdToDbId: Record<string, string> = {}

    for (const p of stripeProducts) {
      const prixInfo = priceMap[p.id] || { amount: 0, type: 'one_shot' }

      // Chercher si le produit existe déjà
      const { data: existing } = await supabaseAdmin
        .from('produits')
        .select('id')
        .eq('user_id', userId)
        .eq('source', 'stripe')
        .eq('stripe_product_id', p.id)
        .single()

      const payload = {
        user_id:          userId,
        nom:              p.name,
        description:      p.description || '',
        prix_vente:       prixInfo.amount,
        cout_revient:     0,
        stock:            0,
        source:           'stripe',
        stripe_product_id: p.id,
        type_produit:     prixInfo.type,
        actif:            p.active,
        updated_at:       new Date().toISOString(),
      }

      let dbId: string
      if (existing?.id) {
        await supabaseAdmin.from('produits').update(payload).eq('id', existing.id)
        dbId = existing.id
      } else {
        const { data: inserted } = await supabaseAdmin.from('produits').insert(payload).select('id').single()
        dbId = inserted?.id
      }

      if (dbId) stripeIdToDbId[p.id] = dbId
      produitsSynced++
    }

    // ── Ventes depuis PaymentIntents ─────────────────────────────────────────
    const since = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
    const chargesRes = await fetch(
      `https://api.stripe.com/v1/payment_intents?limit=100&created[gte]=${since}&expand[]=data.latest_charge`,
      { headers }
    )
    const { data: charges = [] } = await chargesRes.json()

    // Récupérer aussi les subscriptions pour lier aux produits
    const subsRes = await fetch(
      `https://api.stripe.com/v1/subscriptions?limit=100&status=active&expand[]=data.items.data.price.product`,
      { headers }
    )
    const { data: subscriptions = [] } = await subsRes.json()

    // Map customer → produit Stripe ID via subscriptions
    const customerProductMap: Record<string, string> = {}
    for (const sub of subscriptions) {
      const customerId = sub.customer
      const productId  = sub.items?.data?.[0]?.price?.product?.id || sub.items?.data?.[0]?.price?.product
      if (customerId && productId) customerProductMap[customerId] = productId
    }

    let ventesSynced = 0
    for (const charge of charges) {
      if (charge.status !== 'succeeded') continue

      // Trouver le produit DB associé
      const stripeProductId = customerProductMap[charge.customer] || null
      const produitId       = stripeProductId ? stripeIdToDbId[stripeProductId] : null

      // Vérifier si déjà importé
      const { data: existingVente } = await supabaseAdmin
        .from('ventes')
        .select('id')
        .eq('user_id', userId)
        .eq('stripe_payment_id', charge.id)
        .single()

      if (existingVente) continue

      await supabaseAdmin.from('ventes').insert({
        user_id:          userId,
        produit_id:       produitId || null,
        produit_nom:      charge.description || (stripeProductId ? stripeProducts.find((p: any) => p.id === stripeProductId)?.name : null) || 'Paiement Stripe',
        quantite:         1,
        prix_unitaire:    (charge.amount || 0) / 100,
        source:           'stripe',
        stripe_payment_id: charge.id,
        date_vente:       new Date(charge.created * 1000).toISOString().split('T')[0],
      })
      ventesSynced++
    }

    // ── Connecteur ───────────────────────────────────────────────────────────
    const { data: existingConn } = await supabaseAdmin
      .from('connecteurs').select('id').eq('user_id', userId).eq('type', 'stripe').single()

    if (existingConn) {
      await supabaseAdmin.from('connecteurs')
        .update({ actif: true, derniere_sync: new Date().toISOString() })
        .eq('id', existingConn.id)
    } else {
      await supabaseAdmin.from('connecteurs')
        .insert({ user_id: userId, type: 'stripe', actif: true, derniere_sync: new Date().toISOString() })
    }

    return NextResponse.json({ success: true, produitsSynced, ventesSynced })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}