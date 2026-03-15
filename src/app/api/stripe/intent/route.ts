// src/app/api/stripe/intent/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

const PRICES = {
  monthly: { priceId: 'price_1T1QK42fhxDJntt9VCBc77Gs', amount: 4900, label: 'Mensuel 49€/mois' },
  annual:  { priceId: 'price_1TABiy2fhxDJntt99715Z9e4', amount: 46800, label: 'Annuel 468€' },
}

export async function POST(req: NextRequest) {
  const { plan, email, coupon } = await req.json()
  const planData = PRICES[plan as keyof typeof PRICES] || PRICES.monthly

  try {
    // Créer ou récupérer le customer
    let customerId: string | undefined
    if (email) {
      const existing = await stripe.customers.list({ email, limit: 1 })
      if (existing.data.length > 0) {
        customerId = existing.data[0].id
      } else {
        const customer = await stripe.customers.create({ email })
        customerId = customer.id
      }
    }

    if (plan === 'annual') {
      // Paiement unique 468€ → PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount:   planData.amount,
        currency: 'eur',
        customer: customerId,
        metadata: { plan: 'annual', source: 'vcel_site' },
        automatic_payment_methods: { enabled: true },
        description: planData.label,
      })
      return NextResponse.json({ clientSecret: paymentIntent.client_secret, type: 'payment' })
    } else {
      // Abonnement mensuel → SetupIntent puis subscription
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        usage: 'off_session',
        metadata: { plan: 'monthly', priceId: planData.priceId, coupon: coupon || '', source: 'vcel_site' },
        automatic_payment_methods: { enabled: true },
      })
      return NextResponse.json({ clientSecret: setupIntent.client_secret, type: 'setup', customerId })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}