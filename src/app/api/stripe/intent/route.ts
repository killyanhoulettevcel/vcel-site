// src/app/api/stripe/intent/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

const PRICES: Record<string, Record<string, string>> = {
  starter: {
    monthly: 'price_1TKDU32fhxDJntt9gQReMoQ0',
    annual:  'price_1TKDUd2fhxDJntt9TasRT1qZ',
  },
  pro: {
    monthly: 'price_1TKDVC2fhxDJntt9syXt9Eml',
    annual:  'price_1TKDVb2fhxDJntt95GeQqJaA',
  },
  business: {
    monthly: 'price_1TKDZ02fhxDJntt9s85YSysI',
    annual:  'price_1TKDZS2fhxDJntt92RhD0X8s',
  },
}

// Trial 14j sur Starter et Pro mensuel uniquement
const TRIAL_PLANS = ['starter_monthly', 'pro_monthly']

export async function POST(req: NextRequest) {
  const { plan, billing, email } = await req.json()
  // plan    : 'starter' | 'pro' | 'business'
  // billing : 'monthly' | 'annual'

  const priceId = PRICES[plan]?.[billing]
  if (!priceId) {
    return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
  }

  const hasTrial = TRIAL_PLANS.includes(`${plan}_${billing}`)

  try {
    // Créer ou récupérer le customer
    let customerId: string | undefined
    if (email) {
      const existing = await stripe.customers.list({ email, limit: 1 })
      customerId = existing.data.length > 0
        ? existing.data[0].id
        : (await stripe.customers.create({ email, metadata: { source: 'vcel_site' } })).id
    }

    // SetupIntent — la CB est enregistrée, la subscription sera créée dans /confirm
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session',
      metadata: {
        plan,
        billing,
        priceId,
        trial: hasTrial ? '14' : '0',
        source: 'vcel_site',
      },
      automatic_payment_methods: { enabled: true },
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      type: 'setup',
      customerId,
      hasTrial,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}