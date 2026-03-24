// src/app/api/produits/sync/stripe/route.ts
// Synchronise les produits et paiements Stripe de l'UTILISATEUR
// La clé Stripe est stockée dans users.stripe_secret_key (propre à chaque user)

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id

  const body = await req.json().catch(() => ({}))

  // Récupérer la clé Stripe : priorité à la clé envoyée dans le body (première config)
  // sinon on lit celle sauvegardée en base pour cet utilisateur
  let stripeKey = body.stripe_key?.trim()

  if (!stripeKey) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('stripe_secret_key')
      .eq('id', userId)
      .single()
    stripeKey = user?.stripe_secret_key
  }

  if (!stripeKey) {
    return NextResponse.json({ error: 'Aucune clé Stripe configurée. Renseignez votre clé dans le modal.' }, { status: 400 })
  }

  // Valider le format de la clé (sk_live_ ou sk_test_)
  if (!stripeKey.startsWith('sk_live_') && !stripeKey.startsWith('sk_test_')) {
    return NextResponse.json({ error: 'Clé Stripe invalide. Elle doit commencer par sk_live_ ou sk_test_' }, { status: 400 })
  }

  // Sauvegarder la clé en base pour les prochaines syncs
  await supabaseAdmin
    .from('users')
    .update({ stripe_secret_key: stripeKey })
    .eq('id', userId)

  const headers = { Authorization: `Bearer ${stripeKey}` }

  try {
    // Vérifier que la clé est valide avant de continuer
    const testRes = await fetch('https://api.stripe.com/v1/account', { headers })
    if (!testRes.ok) {
      const err = await testRes.json()
      return NextResponse.json({ error: `Clé Stripe invalide : ${err.error?.message || 'Accès refusé'}` }, { status: 400 })
    }

    // Récupérer les produits Stripe
    const prodRes = await fetch('https://api.stripe.com/v1/products?limit=100&active=true', { headers })
    const { data: stripeProducts } = await prodRes.json()

    // Récupérer les prix associés
    const pricesRes = await fetch('https://api.stripe.com/v1/prices?limit=100&active=true', { headers })
    const { data: stripePrices } = await pricesRes.json()

    // Récupérer les paiements récents (30 jours)
    const since = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
    const chargesRes = await fetch(
      `https://api.stripe.com/v1/payment_intents?limit=100&created[gte]=${since}`,
      { headers }
    )
    const { data: charges } = await chargesRes.json()

    const priceMap = Object.fromEntries(
      (stripePrices || []).map((p: any) => [p.product, p.unit_amount / 100])
    )

    let produitsSynced = 0
    let ventesSynced   = 0

    for (const p of stripeProducts || []) {
      await supabaseAdmin.from('produits').upsert({
        user_id:     userId,
        nom:         p.name,
        description: p.description || '',
        prix_vente:  priceMap[p.id] || 0,
        source:      'stripe',
        source_id:   `stripe-${p.id}`,
        actif:       p.active,
      }, { onConflict: 'user_id,source_id' })
      produitsSynced++
    }

    for (const charge of charges || []) {
      if (charge.status !== 'succeeded') continue
      await supabaseAdmin.from('ventes').upsert({
        user_id:       userId,
        produit_nom:   charge.description || 'Paiement Stripe',
        quantite:      1,
        prix_unitaire: (charge.amount || 0) / 100,
        source:        'stripe',
        source_id:     `stripe-${charge.id}`,
        date_vente:    new Date(charge.created * 1000).toISOString().split('T')[0],
      }, { onConflict: 'user_id,source_id' })
      ventesSynced++
    }

    await supabaseAdmin.from('connecteurs').upsert({
      user_id:       userId,
      type:          'stripe',
      actif:         true,
      derniere_sync: new Date().toISOString(),
    }, { onConflict: 'user_id,type' })

    return NextResponse.json({ success: true, produitsSynced, ventesSynced })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}