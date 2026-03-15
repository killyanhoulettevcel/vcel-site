// src/app/api/stripe/confirm/route.ts
// Après SetupIntent réussi → créer l'abonnement mensuel
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
  const { setupIntentId, customerId, email, coupon } = await req.json()

  try {
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
    if (setupIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 400 })
    }

    const paymentMethodId = setupIntent.payment_method as string

    // Attacher la méthode de paiement au customer
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId }
    })

    // Créer l'abonnement
    const subParams: any = {
      customer: customerId,
      items: [{ price: 'price_1T1QK42fhxDJntt9VCBc77Gs' }],
      default_payment_method: paymentMethodId,
      metadata: { source: 'vcel_site' },
      expand: ['latest_invoice.payment_intent'],
    }
    if (coupon) subParams.coupon = coupon

    const subscription = await stripe.subscriptions.create(subParams)

    // Mettre à jour Supabase si l'email existe
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