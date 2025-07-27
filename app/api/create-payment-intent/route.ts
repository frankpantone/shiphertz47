import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { quoteId, amount, metadata } = await req.json()

    // Validate required fields
    if (!quoteId || !amount) {
      return NextResponse.json(
        { error: 'Quote ID and amount are required' },
        { status: 400 }
      )
    }

    // Create admin Supabase client to bypass RLS
    const supabase = createAdminSupabase()

    // Fetch quote details from database to verify amount
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        id,
        total_amount,
        transportation_request_id
      `)
      .eq('id', quoteId)
      .eq('is_active', true)
      .single()

    if (quoteError || !quote) {
      console.error('❌ Quote not found:', quoteError)
      return NextResponse.json(
        { error: 'Quote not found or inactive' },
        { status: 404 }
      )
    }

    // Fetch transportation request details
    const { data: transportRequest, error: requestError } = await supabase
      .from('transportation_requests')
      .select(`
        id,
        order_number,
        user_id
      `)
      .eq('id', quote.transportation_request_id)
      .single()

    if (requestError || !transportRequest) {
      console.error('❌ Transportation request not found:', requestError)
      return NextResponse.json(
        { error: 'Transportation request not found' },
        { status: 404 }
      )
    }

    // Verify amount matches quote total (in cents)
    const expectedAmount = Math.round(quote.total_amount * 100)
    if (amount !== expectedAmount) {
      console.error('❌ Amount mismatch:', { received: amount, expected: expectedAmount })
      return NextResponse.json(
        { error: 'Payment amount does not match quote total' },
        { status: 400 }
      )
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: expectedAmount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        quoteId,
        transportationRequestId: quote.transportation_request_id,
        orderNumber: transportRequest.order_number,
        userId: transportRequest.user_id,
        ...metadata,
      },
      description: `Payment for Transportation Quote - Order ${transportRequest.order_number}`,
      // receipt_email will be handled by Stripe customer settings
    })

    console.log('✅ Payment intent created:', paymentIntent.id)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })

  } catch (error) {
    console.error('💥 Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
} 