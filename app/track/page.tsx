'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  TruckIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { Card, Button, Input } from '@/components/ui'

export default function TrackPage() {
  const router = useRouter()
  const [orderNumber, setOrderNumber] = useState('')
  const [error, setError] = useState('')

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!orderNumber.trim()) {
      setError('Please enter an order number')
      return
    }
    
    // Navigate to the tracking page
    router.push(`/track/${orderNumber.trim()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
              <TruckIcon className="h-10 w-10 text-primary-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Track Your Shipment
            </h1>
            <p className="text-lg text-gray-600">
              Enter your order number to get real-time updates on your vehicle transport
            </p>
          </div>

          {/* Tracking Form */}
          <Card className="p-8 shadow-lg">
            <form onSubmit={handleTrack} className="space-y-6">
              <div>
                <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Order Number
                </label>
                <div className="relative">
                  <Input
                    id="orderNumber"
                    type="text"
                    placeholder="e.g., REQ-001234"
                    value={orderNumber}
                    onChange={(e) => {
                      setOrderNumber(e.target.value)
                      setError('')
                    }}
                    className={`pl-10 ${error ? 'border-red-500' : ''}`}
                    icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                  />
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg">
                Track Order
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <p>Your order number was sent to you via email when you submitted your request.</p>
                  <p className="mt-1">Can't find your order number? 
                    <a href="mailto:support@shiphertz.com" className="text-primary-600 hover:text-primary-700 font-medium ml-1">
                      Contact support
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Real-Time Updates</h3>
              <p className="text-sm text-gray-600">
                Get instant notifications when your vehicle status changes
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TruckIcon className="h-6 w-6 text-success-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Live GPS Tracking</h3>
              <p className="text-sm text-gray-600">
                Know exactly where your vehicle is during transit
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-trust-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <InformationCircleIcon className="h-6 w-6 text-trust-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Detailed History</h3>
              <p className="text-sm text-gray-600">
                View complete timeline of your shipment journey
              </p>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-16 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Need Help Tracking Your Order?
            </h3>
            <p className="text-gray-600 mb-6">
              Our customer support team is available 24/7 to assist you
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => typeof window !== 'undefined' && window.open('tel:1-800-SHIP-CAR', '_self')}
              >
                Call: 1-800-SHIP-CAR
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => typeof window !== 'undefined' && (window.location.href = 'mailto:support@shiphertz.com')}
              >
                Email Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}