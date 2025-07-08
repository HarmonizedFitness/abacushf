
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
}) : null

// POST /api/credits/purchase - Create Stripe payment intent for credit purchase
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }
  
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { credits, packageName } = body

    // Validate input
    if (!credits || !packageName || credits <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid credit package' },
        { status: 400 }
      )
    }

    // Define pricing tiers
    const pricingTiers = [
      { min: 1, max: 4, price: 85, name: 'Starter' },
      { min: 5, max: 10, price: 80, name: 'Regular' },
      { min: 11, max: 19, price: 75, name: 'Committed' },
      { min: 20, max: 999, price: 65, name: 'Champion' },
    ]

    // Find matching tier
    const tier = pricingTiers.find(t => credits >= t.min && credits <= t.max)
    if (!tier) {
      return NextResponse.json(
        { success: false, error: 'Invalid credit amount' },
        { status: 400 }
      )
    }

    const amount = credits * tier.price
    const pricePerCredit = tier.price

    // Create pending credit purchase record
    const creditPurchase = await prisma.creditPurchase.create({
      data: {
        userId: user.id,
        credits,
        amount,
        packageName,
        pricePerCredit,
        status: 'PENDING',
      },
    })

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: user.id,
        creditPurchaseId: creditPurchase.id,
        credits: credits.toString(),
        packageName,
      },
    })

    // Update credit purchase with Stripe payment intent ID
    await prisma.creditPurchase.update({
      where: { id: creditPurchase.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    })

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        creditPurchaseId: creditPurchase.id,
        amount,
        credits,
        pricePerCredit,
      },
    })
  } catch (error) {
    console.error('Create payment intent error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
