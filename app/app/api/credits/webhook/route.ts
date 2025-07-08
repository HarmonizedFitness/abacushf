
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
}) : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// POST /api/credits/webhook - Handle Stripe webhooks
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }
  
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ success: true, received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { success: false, error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { userId, creditPurchaseId, credits } = paymentIntent.metadata

    if (!userId || !creditPurchaseId) {
      console.error('Missing metadata in payment intent:', paymentIntent.id)
      return
    }

    // Update credit purchase status
    const creditPurchase = await prisma.creditPurchase.update({
      where: { id: creditPurchaseId },
      data: {
        status: 'COMPLETED',
        stripePaymentIntentId: paymentIntent.id,
      },
    })

    // Create notification for successful purchase
    await prisma.notification.create({
      data: {
        userId,
        type: 'CREDIT_PURCHASED',
        title: 'Credits Added! 💳',
        message: `Successfully purchased ${credits} training credits. Your new balance is available now.`,
        isRead: false,
        metadata: {
          creditPurchaseId,
          creditsAdded: parseInt(credits),
          amount: creditPurchase.amount.toString(),
        },
      },
    })

    console.log(`Payment succeeded for user ${userId}: ${credits} credits`)
  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { userId, creditPurchaseId } = paymentIntent.metadata

    if (!userId || !creditPurchaseId) {
      console.error('Missing metadata in payment intent:', paymentIntent.id)
      return
    }

    // Update credit purchase status
    await prisma.creditPurchase.update({
      where: { id: creditPurchaseId },
      data: {
        status: 'FAILED',
        stripePaymentIntentId: paymentIntent.id,
      },
    })

    console.log(`Payment failed for user ${userId}, purchase ${creditPurchaseId}`)
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}
