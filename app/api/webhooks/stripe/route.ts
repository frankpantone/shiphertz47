import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminSupabase } from '@/lib/supabase'
import { headers } from 'next/headers'

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    // Create admin Supabase client to bypass RLS
    const supabase = createAdminSupabase()
    
    const body = await req.text()
    const headersList = headers()
    const sig = headersList.get('stripe-signature')

    if (!sig) {
      console.error('❌ No stripe signature found')
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('🎯 Stripe webhook event:', event.type)

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
      default:
        console.log(`🤷 Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('💥 Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    console.log('✅ Payment succeeded:', paymentIntent.id)

    const { quoteId, transportationRequestId, orderNumber, userId } = paymentIntent.metadata

    // Record the payment in the database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        transportation_request_id: transportationRequestId,
        quote_id: quoteId,
        user_id: userId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        status: 'completed',
        payment_method: 'card', // Will be enhanced later
        metadata: {
          stripe_charges: paymentIntent.charges?.data || [],
          receipt_email: paymentIntent.receipt_email,
        }
      })
      .select()
      .single()

    if (paymentError) {
      console.error('❌ Failed to record payment:', paymentError)
      throw paymentError
    }

    console.log('💾 Payment recorded in database:', payment.id)

    // Update transportation request status to 'paid'
    const { error: statusError } = await supabase
      .from('transportation_requests')
      .update({ 
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', transportationRequestId)

    if (statusError) {
      console.error('❌ Failed to update request status:', statusError)
      throw statusError
    }

    console.log('📝 Transportation request status updated to paid')

    // Optionally, deactivate other quotes for this request
    const { error: quoteError } = await supabase
      .from('quotes')
      .update({ is_active: false })
      .eq('transportation_request_id', transportationRequestId)
      .neq('id', quoteId)

    if (quoteError) {
      console.warn('⚠️ Failed to deactivate other quotes:', quoteError)
    }

    console.log('✅ Payment processing completed successfully')

  } catch (error) {
    console.error('💥 Error handling payment success:', error)
    throw error
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  try {
    console.log('❌ Payment failed:', paymentIntent.id)

    const { quoteId, transportationRequestId, userId } = paymentIntent.metadata

    // Record the failed payment attempt
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        transportation_request_id: transportationRequestId,
        quote_id: quoteId,
        user_id: userId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: 'failed',
        payment_method: 'card',
        metadata: {
          failure_reason: paymentIntent.last_payment_error?.message || 'Unknown error',
          charges: paymentIntent.charges?.data || [],
        }
      })

    if (paymentError) {
      console.error('❌ Failed to record failed payment:', paymentError)
    }

    console.log('📝 Failed payment recorded in database')

  } catch (error) {
    console.error('💥 Error handling payment failure:', error)
  }
} 