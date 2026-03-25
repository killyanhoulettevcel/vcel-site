// src/app/api/webhooks/stripe/route.ts
// Webhook Stripe — mise à jour automatique des ventes à chaque paiement
// Events écoutés : payment_intent.succeeded, invoice.paid, customer.subscription.deleted

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

// Important : ne pas parser le body en JSON, Stripe a besoin du raw body pour la signature
export const config = { api: { bodyParser: false } }

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  // Vérifier la signature Stripe
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (e: any) {
    console.error('[WEBHOOK] Signature invalide:', e.message)
    return NextResponse.json({ error: `Webhook signature invalide: ${e.message}` }, { status: 400 })
  }

  console.log('[WEBHOOK] Event reçu:', event.type)

  try {
    switch (event.type) {

      // ── Paiement réussi (abonnement ou one-shot) ──────────────────────────
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        if (!invoice.customer || invoice.amount_paid === 0) break

        // Trouver l'utilisateur par son stripe_customer_id
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id, nom')
          .eq('stripe_customer_id', invoice.customer as string)
          .single()

        if (!user) break

        // Récupérer le price_id depuis les line items
        const lineItem = invoice.lines?.data?.[0]
        const priceId  = lineItem?.price?.id
        const productId = (lineItem?.price?.product as string) || null

        // Trouver le produit en base via stripe_price_id
        let dbProduitId: string | null = null
        let produitNom = lineItem?.description || 'Abonnement VCEL'

        if (priceId) {
          const { data: produit } = await supabaseAdmin
            .from('produits')
            .select('id, nom')
            .eq('user_id', user.id)
            .eq('stripe_price_id', priceId)
            .single()

          if (produit) {
            dbProduitId = produit.id
            produitNom  = produit.nom
          }
        }

        // Éviter les doublons
        const { data: existing } = await supabaseAdmin
          .from('ventes')
          .select('id')
          .eq('user_id', user.id)
          .eq('stripe_payment_id', invoice.payment_intent as string || invoice.id)
          .single()

        if (existing) break

        await supabaseAdmin.from('ventes').insert({
          user_id:           user.id,
          produit_id:        dbProduitId,
          produit_nom:       produitNom,
          quantite:          1,
          prix_unitaire:     invoice.amount_paid / 100,
          source:            'stripe',
          stripe_payment_id: (invoice.payment_intent as string) || invoice.id,
          date_vente:        new Date(invoice.created * 1000).toISOString().split('T')[0],
        })

        console.log(`[WEBHOOK] Vente ajoutée pour ${user.nom}: ${produitNom} — ${invoice.amount_paid / 100}€`)
        break
      }

      // ── Paiement one-shot (sans invoice) ─────────────────────────────────
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent
        if (!intent.customer || !intent.amount) break

        // Trouver l'utilisateur
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id, nom')
          .eq('stripe_customer_id', intent.customer as string)
          .single()

        if (!user) break

        // Éviter les doublons (déjà traité via invoice.paid)
        const { data: existing } = await supabaseAdmin
          .from('ventes')
          .select('id')
          .eq('user_id', user.id)
          .eq('stripe_payment_id', intent.id)
          .single()

        if (existing) break

        // Chercher si ce paiement vient d'une invoice (pour éviter doublon avec invoice.paid)
        if (intent.invoice) break

        await supabaseAdmin.from('ventes').insert({
          user_id:           user.id,
          produit_id:        null,
          produit_nom:       intent.description || 'Paiement Stripe',
          quantite:          1,
          prix_unitaire:     intent.amount / 100,
          source:            'stripe',
          stripe_payment_id: intent.id,
          date_vente:        new Date(intent.created * 1000).toISOString().split('T')[0],
        })

        console.log(`[WEBHOOK] Paiement one-shot pour ${user.nom}: ${intent.amount / 100}€`)
        break
      }

      // ── Abonnement annulé ────────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('stripe_customer_id', sub.customer as string)
          .single()

        if (!user) break

        // Passer le statut à inactif
        await supabaseAdmin
          .from('users')
          .update({ statut: 'inactif' })
          .eq('id', user.id)

        console.log(`[WEBHOOK] Abonnement annulé pour customer ${sub.customer}`)
        break
      }

      default:
        console.log(`[WEBHOOK] Event ignoré: ${event.type}`)
    }
  } catch (e: any) {
    console.error('[WEBHOOK] Erreur traitement:', e.message)
    // On retourne 200 quand même pour éviter que Stripe réessaie en boucle
    return NextResponse.json({ received: true, error: e.message })
  }

  return NextResponse.json({ received: true })
}
