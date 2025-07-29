'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckIcon,
  XMarkIcon,
  TruckIcon,
  ShieldCheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline'
import { Card, Button } from '@/components/ui'

interface PricingTier {
  name: string
  description: string
  basePrice: string
  pricePerMile: string
  features: string[]
  notIncluded: string[]
  popular?: boolean
  icon: any
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Open Transport',
    description: 'Standard shipping on open carrier trucks',
    basePrice: '$200',
    pricePerMile: '$0.60',
    icon: TruckIcon,
    features: [
      'Most economical option',
      'Ships with 7-8 other vehicles',
      'Door-to-door service',
      'Full insurance coverage',
      'Real-time tracking',
      'Professional drivers',
      'Suitable for all weather'
    ],
    notIncluded: [
      'Protection from weather elements',
      'Suitable for luxury/classic cars'
    ]
  },
  {
    name: 'Enclosed Transport',
    description: 'Premium protection in enclosed trailers',
    basePrice: '$400',
    pricePerMile: '$1.20',
    icon: ShieldCheckIcon,
    popular: true,
    features: [
      'Complete weather protection',
      'Ideal for luxury & classic cars',
      'Ships with 2-6 vehicles max',
      'White-glove service',
      'Enhanced security',
      'Climate-controlled available',
      'Soft-tie securing',
      'Hydraulic lift gates'
    ],
    notIncluded: []
  },
  {
    name: 'Expedited Shipping',
    description: 'Fastest delivery with priority routing',
    basePrice: '$500',
    pricePerMile: '$1.50',
    icon: ClockIcon,
    features: [
      'Guaranteed pickup dates',
      'Direct routes (no stops)',
      'Dedicated customer service',
      'Priority dispatching',
      '30-50% faster delivery',
      'First pickup, first delivery',
      'Available for both open/enclosed',
      '24/7 support hotline'
    ],
    notIncluded: []
  }
]

const distanceExamples = [
  { route: 'Los Angeles to Las Vegas', miles: 270, days: '1-2' },
  { route: 'New York to Miami', miles: 1280, days: '3-5' },
  { route: 'Chicago to Denver', miles: 1000, days: '2-4' },
  { route: 'Seattle to San Francisco', miles: 810, days: '2-3' },
  { route: 'Boston to Los Angeles', miles: 3000, days: '7-10' },
  { route: 'Dallas to Phoenix', miles: 1060, days: '2-4' }
]

export default function PricingPage() {
  const router = useRouter()
  const [selectedTier, setSelectedTier] = useState<string>('Enclosed Transport')
  const [distance, setDistance] = useState(1000)

  const calculatePrice = (tier: PricingTier, miles: number) => {
    const base = parseInt(tier.basePrice.replace('$', ''))
    const perMile = parseFloat(tier.pricePerMile.replace('$', ''))
    return base + (miles * perMile)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Transparent Pricing
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            No hidden fees, no surprises. Get an accurate estimate for your auto transport needs.
            All prices include insurance, fuel, and door-to-door service.
          </p>
        </div>

        {/* Pricing Calculator */}
        <Card className="max-w-4xl mx-auto mb-12 p-8">
          <div className="flex items-center mb-6">
            <CalculatorIcon className="h-6 w-6 text-primary-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Pricing Calculator</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Distance (miles)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="100"
                  max="3500"
                  value={distance}
                  onChange={(e) => setDistance(parseInt(e.target.value))}
                  className="flex-1"
                />
                <div className="w-24 text-center">
                  <span className="text-2xl font-bold text-primary-600">{distance}</span>
                  <span className="text-sm text-gray-600 block">miles</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {pricingTiers.map((tier) => {
                const price = calculatePrice(tier, distance)
                const isSelected = selectedTier === tier.name
                
                return (
                  <button
                    key={tier.name}
                    onClick={() => setSelectedTier(tier.name)}
                    className={`
                      p-4 rounded-lg border-2 transition-all text-left
                      ${isSelected 
                        ? 'border-primary-600 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">{tier.name}</h3>
                    <div className="text-3xl font-bold text-primary-600">
                      ${price.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Estimated total
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-2">Estimate includes:</p>
              <ul className="space-y-1">
                <li>• Base fee + mileage ({selectedTier} rate)</li>
                <li>• Full insurance coverage</li>
                <li>• Door-to-door service</li>
                <li>• All taxes and fees</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Pricing Tiers */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {pricingTiers.map((tier) => {
            const Icon = tier.icon
            return (
              <Card 
                key={tier.name}
                className={`relative ${tier.popular ? 'ring-2 ring-primary-600' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="h-8 w-8 text-primary-600" />
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Base + per mile</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {tier.basePrice} + {tier.pricePerMile}/mi
                      </p>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                  <p className="text-gray-600 mb-6">{tier.description}</p>
                  
                  <div className="space-y-3 mb-6">
                    {tier.features.map((feature) => (
                      <div key={feature} className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-success-600 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                    
                    {tier.notIncluded.map((feature) => (
                      <div key={feature} className="flex items-start">
                        <XMarkIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-500">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    variant={tier.popular ? 'primary' : 'secondary'}
                    className="w-full"
                    onClick={() => router.push('/auth/signup')}
                  >
                    Get Quote
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Distance Examples */}
        <Card className="mb-12">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Routes & Pricing</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {distanceExamples.map((example) => (
                <div key={example.route} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start mb-3">
                    <MapPinIcon className="h-5 w-5 text-primary-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">{example.route}</h4>
                      <p className="text-sm text-gray-600">
                        {example.miles} miles • {example.days} days
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {pricingTiers.map((tier) => {
                      const price = calculatePrice(tier, example.miles)
                      return (
                        <div key={tier.name} className="text-center">
                          <p className="text-xs text-gray-500">{tier.name.split(' ')[0]}</p>
                          <p className="font-semibold text-gray-900">${price.toLocaleString()}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Additional Fees */}
        <Card className="max-w-4xl mx-auto mb-12">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Services & Fees</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Optional Services</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Top-load placement</span>
                    <span className="font-medium text-gray-900">+$75-150</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guaranteed pickup date</span>
                    <span className="font-medium text-gray-900">+$100-200</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Extra insurance (per $10k)</span>
                    <span className="font-medium text-gray-900">+$50</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Possible Additional Fees</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Inoperable vehicle</span>
                    <span className="font-medium text-gray-900">+$100-200</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Oversized vehicle</span>
                    <span className="font-medium text-gray-900">+$75-150</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remote area pickup/delivery</span>
                    <span className="font-medium text-gray-900">+$50-100</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-primary-50 rounded-lg">
              <p className="text-sm text-primary-900">
                <strong>Note:</strong> These are estimated additional fees. Your final quote will include 
                all applicable charges based on your specific requirements.
              </p>
            </div>
          </div>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Ship Your Vehicle?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Get an exact quote for your specific route and vehicle. 
            Our quotes are valid for 14 days with no obligation to book.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => router.push('/auth/signup')}
              icon={<CurrencyDollarIcon className="h-5 w-5" />}
            >
              Get Your Free Quote
            </Button>
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => router.push('/faq')}
            >
              View FAQs
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}