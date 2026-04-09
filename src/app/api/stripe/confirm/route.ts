// src/app/api/stripe/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
  const { setupIntentId, customerId, email } = await req.json()

  try {
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
    if (setupIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 400 })
    }

    const paymentMethodId = setupIntent.payment_method as string
    const priceId         = setupIntent.metadata?.priceId
    const trialDays       = parseInt(setupIntent.metadata?.trial || '0')
    const plan            = setupIntent.metadata?.plan || 'pro'
    const billing         = setupIntent.metadata?.billing || 'monthly'

    if (!priceId) {
      return NextResponse.json({ error: 'priceId manquant dans le setupIntent' }, { status: 400 })
    }

    // Attacher la CB au customer
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    // Créer la subscription — avec ou sans trial
    const subParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      metadata: { source: 'vcel_site', plan, billing },
      expand: ['latest_invoice.payment_intent'],
    }

    if (trialDays > 0) {
      subParams.trial_period_days = trialDays
    }

    const subscription = await stripe.subscriptions.create(subParams)

    // Mettre à jour Supabase
    if (email) {
      await supabaseAdmin
        .from('users')
        .update({
          stripe_customer_id: customerId,
          statut: trialDays > 0 ? 'trial' : 'actif',
          plan,
          trial_end: trialDays > 0
            ? new Date((subscription.trial_end! * 1000)).toISOString()
            : null,
        })
        .eq('email', email.toLowerCase())
    }

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status, // 'trialing' ou 'active'
      trialEnd: subscription.trial_end,
    })
  } catch (e: any) {
    console.error('[stripe/confirm]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}