import Link from 'next/link'
import { 
  TruckIcon, 
  DocumentCheckIcon, 
  CreditCardIcon, 
  ShieldCheckIcon 
} from '@heroicons/react/24/outline'

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Streamline Your Auto Logistics
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Professional transportation request system designed for auto logistics companies. 
          Submit requests, get quotes, and manage payments all in one platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/signup" className="btn-primary text-lg px-8 py-4">
            Get Started
          </Link>
          <Link href="/auth/login" className="btn-secondary text-lg px-8 py-4">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive features designed to simplify your transportation workflow
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <TruckIcon className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Transportation Requests
            </h3>
            <p className="text-gray-600">
              Easy-to-use forms with address validation and VIN verification
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <DocumentCheckIcon className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Quote Management
            </h3>
            <p className="text-gray-600">
              Professional quoting system with admin approval workflow
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <CreditCardIcon className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Secure Payments
            </h3>
            <p className="text-gray-600">
              Integrated payment processing with Stripe and ACH support
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <ShieldCheckIcon className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Admin Dashboard
            </h3>
            <p className="text-gray-600">
              Powerful admin tools for order management and customer service
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-primary-50 rounded-lg">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Simple three-step process to get your vehicle transported
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="bg-primary-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Submit Request
            </h3>
            <p className="text-gray-600">
              Fill out the transportation form with pickup and delivery details
            </p>
          </div>

          <div>
            <div className="bg-primary-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Receive Quote
            </h3>
            <p className="text-gray-600">
              Our team reviews your request and provides a competitive quote
            </p>
          </div>

          <div>
            <div className="bg-primary-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Schedule & Pay
            </h3>
            <p className="text-gray-600">
              Accept the quote, make payment, and schedule your transportation
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Join thousands of satisfied customers who trust us with their auto logistics needs.
        </p>
        <Link href="/auth/signup" className="btn-primary text-lg px-8 py-4">
          Create Your Account
        </Link>
      </section>
    </div>
  )
} 