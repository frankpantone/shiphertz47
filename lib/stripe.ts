import { loadStripe, Stripe } from '@stripe/stripe-js'

// Client-side Stripe
let stripePromise: Promise<Stripe | null>

const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

export default getStripe

// Server-side Stripe (for API routes)
import StripeServer from 'stripe'

export const stripe = new StripeServer(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
}) 