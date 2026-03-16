// src/app/api/stripe/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

const SOLOFREE_PROMOTION_ID = 'promo_1TBZgJ2fhxDJntt9XdwyvgaH'

export async function POST(req: NextRequest) {
  const { setupIntentId, customerId, email, coupon } = await req.json()

  try {
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
    if (setupIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 400 })
    }

    const paymentMethodId = setupIntent.payment_method as string
    const isSolofree = coupon?.toUpperCase() === 'SOLOFREE'

    // Lire le priceId depuis les metadata (mensuel ou annuel)
    const priceId = setupIntent.metadata?.priceId || 'price_1T1QK42fhxDJntt9VCBc77Gs'

    // Attacher la méthode de paiement au customer
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId }
    })

    // Créer la subscription (mensuelle ou annuelle selon priceId)
    const subParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      metadata: { source: 'vcel_site', coupon: coupon || '' },
      expand: ['latest_invoice.payment_intent'],
    }

    // Appliquer SOLOFREE → 1er mois/an offert
    if (isSolofree) {
      subParams.discounts = [{ promotion_code: SOLOFREE_PROMOTION_ID }]
    }

    const subscription = await stripe.subscriptions.create(subParams)

    // Mettre à jour Supabase
    if (email) {
      await supabaseAdmin.from('users')
        .update({ stripe_customer_id: customerId, statut: 'actif' })
        .eq('email', email.toLowerCase())
    }

    return NextResponse.json({ success: true, subscriptionId: subscription.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}