'use client'

import { useState, useEffect } from 'react'
import { 
  PaymentElement, 
  useStripe, 
  useElements,
  Elements
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { toast } from 'react-hot-toast'
import { 
  CreditCardIcon,
  LockClosedIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  clientSecret: string
  quoteAmount: number
  orderNumber: string
  onSuccess: () => void
  onError: (error: string) => void
}

function PaymentForm({ clientSecret, quoteAmount, orderNumber, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'succeeded' | 'failed'>('idle')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setPaymentStatus('processing')

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: typeof window !== 'undefined' ? `${window.location.origin}/requests` : 'http://localhost:3000/requests',
      },
      redirect: 'if_required',
    })

    if (error) {
      console.error('❌ Payment failed:', error)
      setPaymentStatus('failed')
      onError(error.message || 'Payment failed')
      toast.error(error.message || 'Payment failed')
    } else {
      console.log('✅ Payment succeeded')
      setPaymentStatus('succeeded')
      toast.success('Payment successful!')
      onSuccess()
    }

    setIsProcessing(false)
  }

  if (paymentStatus === 'succeeded') {
    return (
      <div className="text-center py-8">
        <CheckCircleIcon className="mx-auto h-16 w-16 text-green-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
        <p className="text-gray-600 mb-4">
          Your payment of ${quoteAmount.toFixed(2)} for order {orderNumber} has been processed.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            You will receive a confirmation email shortly. We'll begin processing your transportation request.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <LockClosedIcon className="h-5 w-5 text-blue-600 mr-2" />
          <span className="text-sm font-medium text-blue-800">Secure Payment</span>
        </div>
        <p className="text-sm text-blue-600 mt-1">
          Your payment information is encrypted and secure.
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium text-gray-900">Total Amount:</span>
          <span className="text-2xl font-bold text-green-600">${quoteAmount.toFixed(2)}</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">Order: {orderNumber}</p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Payment Information
        </label>
        <div className="p-4 border border-gray-300 rounded-lg">
          <PaymentElement 
            options={{
              layout: 'tabs'
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className={`w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${
          isProcessing 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700'
        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors`}
      >
        <CreditCardIcon className="h-5 w-5 mr-2" />
        {isProcessing ? 'Processing Payment...' : `Pay $${quoteAmount.toFixed(2)}`}
      </button>

      {paymentStatus === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            Payment failed. Please check your payment information and try again.
          </p>
        </div>
      )}
    </form>
  )
}

interface StripePaymentFormProps {
  quoteId: string
  quoteAmount: number
  orderNumber: string
  onSuccess: () => void
  onError: (error: string) => void
  onCancel: () => void
}

export default function StripePaymentForm({ 
  quoteId, 
  quoteAmount, 
  orderNumber, 
  onSuccess, 
  onError,
  onCancel 
}: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    createPaymentIntent()
  }, [quoteId, quoteAmount])

  const createPaymentIntent = async () => {
    try {
      setLoading(true)
      // console.log('💳 Creating payment intent for quote:', quoteId)

      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteId,
          amount: Math.round(quoteAmount * 100), // Convert to cents
          metadata: {
            orderNumber,
          }
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent')
      }

      setClientSecret(data.clientSecret)
      console.log('✅ Payment intent created successfully')

    } catch (error: any) {
      console.error('💥 Error creating payment intent:', error)
      onError(error.message || 'Failed to initialize payment')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Initializing secure payment...</p>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to initialize payment. Please try again.</p>
        <button
          onClick={onCancel}
          className="mt-4 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    )
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#059669',
    },
  }

  const options = {
    clientSecret,
    appearance,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Complete Payment</h3>
        <button
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>

      <Elements options={options} stripe={stripePromise}>
        <PaymentForm
          clientSecret={clientSecret}
          quoteAmount={quoteAmount}
          orderNumber={orderNumber}
          onSuccess={onSuccess}
          onError={onError}
        />
      </Elements>
    </div>
  )
} 