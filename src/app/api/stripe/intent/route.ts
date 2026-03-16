// src/app/api/stripe/intent/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

const PRICES = {
  monthly: { priceId: 'price_1T1QK42fhxDJntt9VCBc77Gs', label: 'Mensuel 49€/mois' },
  annual:  { priceId: 'price_1TABiy2fhxDJntt99715Z9e4', label: 'Annuel 468€/an' },
}

const SOLOFREE_PROMOTION_ID = 'promo_1TBZgJ2fhxDJntt9XdwyvgaH'

export async function POST(req: NextRequest) {
  const { plan, email, coupon } = await req.json()
  const planData = PRICES[plan as keyof typeof PRICES] || PRICES.monthly
  const isSolofree = coupon?.toUpperCase() === 'SOLOFREE'

  try {
    // Créer ou récupérer le customer
    let customerId: string | undefined
    if (email) {
      const existing = await stripe.customers.list({ email, limit: 1 })
      customerId = existing.data.length > 0
        ? existing.data[0].id
        : (await stripe.customers.create({ email })).id
    }

    // Même flow pour mensuel ET annuel : SetupIntent → confirm → subscription
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session',
      metadata: {
        plan,
        priceId: planData.priceId,
        coupon: coupon || '',
        promotionId: isSolofree ? SOLOFREE_PROMOTION_ID : '',
        source: 'vcel_site',
      },
      automatic_payment_methods: { enabled: true },
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      type: 'setup',
      customerId,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}