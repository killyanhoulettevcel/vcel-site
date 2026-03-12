import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
  const { priceId, annual } = await req.json()
  if (!priceId) return NextResponse.json({ error: 'priceId requis' }, { status: 400 })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true, // le client saisit SOLO19 lui-même
    success_url: `${process.env.NEXTAUTH_URL}/activate?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/#tarifs`,
    subscription_data: {
      metadata: { source: 'vcel_site' }
    },
  })

  return NextResponse.json({ url: session.url })
}
