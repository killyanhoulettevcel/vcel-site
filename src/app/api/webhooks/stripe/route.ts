// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

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

      // ── Paiement facture (abonnement mensuel/annuel) ──────────────────────
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        if (!invoice.customer) break

        // Trouver l'utilisateur
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id, nom, email')
          .eq('stripe_customer_id', invoice.customer as string)
          .single()

        if (!user) {
          console.warn('[WEBHOOK] invoice.paid — aucun user trouvé pour customer', invoice.customer)
          break
        }

        const amountPaid = invoice.amount_paid / 100
        const mois       = new Date(invoice.created * 1000).toISOString().slice(0, 7) // YYYY-MM

        // ── 1. Écrire dans ca_data si amount_paid > 0 ────────────────────
        if (amountPaid > 0) {
          const { data: existingCa } = await supabaseAdmin
            .from('ca_data')
            .select('id, ca_ht, nb_factures')
            .eq('user_id', user.id)
            .eq('mois', mois)
            .single()

          if (existingCa) {
            // Incrémenter le CA du mois existant
            await supabaseAdmin
              .from('ca_data')
              .update({
                ca_ht:       (existingCa.ca_ht || 0) + amountPaid,
                nb_factures: (existingCa.nb_factures || 0) + 1,
              })
              .eq('id', existingCa.id)
            console.log(`[WEBHOOK] ca_data mis à jour — ${user.email} — ${mois} +${amountPaid}€`)
          } else {
            // Créer la ligne du mois
            await supabaseAdmin
              .from('ca_data')
              .insert({
                user_id:     user.id,
                mois,
                ca_ht:       amountPaid,
                charges:     0,
                nb_factures: 1,
              })
            console.log(`[WEBHOOK] ca_data créé — ${user.email} — ${mois} ${amountPaid}€`)
          }

          // ── 2. Écrire dans ventes (éviter doublons) ───────────────────
          const paymentId = (invoice.payment_intent as string) || invoice.id
          const { data: existingVente } = await supabaseAdmin
            .from('ventes')
            .select('id')
            .eq('user_id', user.id)
            .eq('stripe_payment_id', paymentId)
            .single()

          if (!existingVente) {
            const lineItem  = invoice.lines?.data?.[0]
            const priceId   = lineItem?.price?.id
            let dbProduitId: string | null = null
            let produitNom  = lineItem?.description || 'Abonnement VCEL'

            if (priceId) {
              const { data: produit } = await supabaseAdmin
                .from('produits')
                .select('id, nom')
                .eq('user_id', user.id)
                .eq('stripe_price_id', priceId)
                .single()
              if (produit) { dbProduitId = produit.id; produitNom = produit.nom }
            }

            await supabaseAdmin.from('ventes').insert({
              user_id:           user.id,
              produit_id:        dbProduitId,
              produit_nom:       produitNom,
              quantite:          1,
              prix_unitaire:     amountPaid,
              source:            'stripe',
              stripe_payment_id: paymentId,
              date_vente:        new Date(invoice.created * 1000).toISOString().split('T')[0],
            })
          }
        }

        // ── 3. Mettre à jour le statut user → actif (fin de trial ou paiement normal) ──
        await supabaseAdmin
          .from('users')
          .update({ statut: 'actif' })
          .eq('id', user.id)

        console.log(`[WEBHOOK] invoice.paid OK — ${user.email} — ${amountPaid}€`)
        break
      }

      // ── Trial démarré ─────────────────────────────────────────────────────
      case 'customer.subscription.trial_will_end': {
        // Stripe envoie cet event 3 jours avant la fin du trial
        // Utile pour envoyer un email de rappel (à brancher sur n8n/email)
        const sub = event.data.object as Stripe.Subscription
        console.log(`[WEBHOOK] Trial se termine bientôt — customer ${sub.customer}, trial_end ${sub.trial_end}`)
        // TODO: déclencher workflow n8n d'email de rappel
        break
      }

      // ── Paiement one-shot (sans invoice) ─────────────────────────────────
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent
        if (!intent.customer || !intent.amount) break
        // Si lié à une invoice, déjà traité dans invoice.paid
        if (intent.invoice) break

        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id, nom, email')
          .eq('stripe_customer_id', intent.customer as string)
          .single()

        if (!user) break

        const { data: existing } = await supabaseAdmin
          .from('ventes')
          .select('id')
          .eq('user_id', user.id)
          .eq('stripe_payment_id', intent.id)
          .single()

        if (existing) break

        const amountPaid = intent.amount / 100
        const mois       = new Date(intent.created * 1000).toISOString().slice(0, 7)

        // Écrire dans ca_data
        const { data: existingCa } = await supabaseAdmin
          .from('ca_data')
          .select('id, ca_ht, nb_factures')
          .eq('user_id', user.id)
          .eq('mois', mois)
          .single()

        if (existingCa) {
          await supabaseAdmin
            .from('ca_data')
            .update({
              ca_ht:       (existingCa.ca_ht || 0) + amountPaid,
              nb_factures: (existingCa.nb_factures || 0) + 1,
            })
            .eq('id', existingCa.id)
        } else {
          await supabaseAdmin.from('ca_data').insert({
            user_id: user.id, mois, ca_ht: amountPaid, charges: 0, nb_factures: 1,
          })
        }

        await supabaseAdmin.from('ventes').insert({
          user_id:           user.id,
          produit_id:        null,
          produit_nom:       intent.description || 'Paiement Stripe',
          quantite:          1,
          prix_unitaire:     amountPaid,
          source:            'stripe',
          stripe_payment_id: intent.id,
          date_vente:        new Date(intent.created * 1000).toISOString().split('T')[0],
        })

        console.log(`[WEBHOOK] Paiement one-shot — ${user.email} — ${amountPaid}€`)
        break
      }

      // ── Abonnement annulé ─────────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id, email')
          .eq('stripe_customer_id', sub.customer as string)
          .single()

        if (!user) break

        await supabaseAdmin
          .from('users')
          .update({ statut: 'inactif', plan: null, trial_end: null })
          .eq('id', user.id)

        console.log(`[WEBHOOK] Abonnement annulé — ${user.email}`)
        break
      }

      // ── Trial expiré sans CB → subscription annulée automatiquement ──────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        if (sub.status === 'canceled' || sub.status === 'incomplete_expired') {
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('id, email')
            .eq('stripe_customer_id', sub.customer as string)
            .single()
          if (!user) break
          await supabaseAdmin
            .from('users')
            .update({ statut: 'inactif', plan: null, trial_end: null })
            .eq('id', user.id)
          console.log(`[WEBHOOK] Subscription ${sub.status} — ${user.email}`)
        }
        break
      }

      // ── Remboursement Stripe → soustraire du ca_data ────────────────────
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        if (!charge.customer || !charge.amount_refunded) break

        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id, email')
          .eq('stripe_customer_id', charge.customer as string)
          .single()

        if (!user) break

        const montantRembourse = charge.amount_refunded / 100
        const mois = new Date(charge.created * 1000).toISOString().slice(0, 7)

        const { data: existingCa } = await supabaseAdmin
          .from('ca_data')
          .select('id, ca_ht')
          .eq('user_id', user.id)
          .eq('mois', mois)
          .single()

        if (existingCa) {
          await supabaseAdmin
            .from('ca_data')
            .update({ ca_ht: Math.max(0, (existingCa.ca_ht || 0) - montantRembourse) })
            .eq('id', existingCa.id)
          console.log(`[WEBHOOK] Remboursement ${montantRembourse}€ déduit du ca_data — ${user.email} — ${mois}`)
        }
        break
      }

      default:
        console.log(`[WEBHOOK] Event ignoré: ${event.type}`)
    }
  } catch (e: any) {
    console.error('[WEBHOOK] Erreur traitement:', e.message)
    // 200 pour éviter les retry Stripe en boucle
    return NextResponse.json({ received: true, error: e.message })
  }

  return NextResponse.json({ received: true })
}