'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  TruckIcon, 
  DocumentCheckIcon, 
  CreditCardIcon, 
  ShieldCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'
import { Button, Card } from '@/components/ui'

export default function HomePage() {
  const router = useRouter()
  
  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="hero-gradient py-20 lg:py-28 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23f59e0b%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Trust Badge */}
            <div className="inline-flex items-center bg-white rounded-full px-4 py-2 shadow-soft mb-8">
              <ShieldCheckIcon className="h-5 w-5 text-success-600 mr-2" />
              <span className="text-sm font-semibold text-gray-700">Trusted by 10,000+ customers</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-bold text-gray-900 mb-6 leading-tight">
              Ship Your Vehicle
              <span className="text-gradient block">Safely & Securely</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Get instant quotes from verified auto transport companies. 
              <strong className="text-gray-900">Licensed, insured, and trusted nationwide.</strong>
            </p>

            {/* Key Benefits */}
            <div className="flex flex-wrap justify-center gap-6 mb-10">
              <div className="flex items-center text-gray-700">
                <CheckCircleIcon className="h-5 w-5 text-success-600 mr-2" />
                <span className="font-medium">Free Quotes</span>
              </div>
              <div className="flex items-center text-gray-700">
                <CheckCircleIcon className="h-5 w-5 text-success-600 mr-2" />
                <span className="font-medium">Nationwide Coverage</span>
              </div>
              <div className="flex items-center text-gray-700">
                <CheckCircleIcon className="h-5 w-5 text-success-600 mr-2" />
                <span className="font-medium">$1M+ Insurance</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                className="shadow-glow"
                onClick={() => router.push('/auth/signup')}
                icon={<TruckIcon className="h-5 w-5" />}
              >
                Get Free Quote Now
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                onClick={() => typeof window !== 'undefined' && window.open('tel:1-800-SHIP-CAR', '_self')}
                icon={<PhoneIcon className="h-5 w-5" />}
              >
                Call: 1-800-SHIP-CAR
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary-600">50K+</div>
                <div className="text-sm text-gray-600">Vehicles Shipped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary-600">4.9★</div>
                <div className="text-sm text-gray-600">Customer Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary-600">24h</div>
                <div className="text-sm text-gray-600">Average Response</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              Why Choose Our Auto Transport Service?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're not just another shipping company. We're your trusted partner in vehicle transportation.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-16">
            <Card variant="feature">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Fully Licensed & Insured
              </h3>
              <p className="text-gray-600">
                DOT certified carriers with $1M+ cargo insurance for complete peace of mind.
              </p>
            </Card>

            <Card variant="feature">
              <div className="w-16 h-16 bg-trust-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ClockIcon className="h-8 w-8 text-trust-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Fast Response Time
              </h3>
              <p className="text-gray-600">
                Get your quote within 24 hours. No waiting weeks for responses.
              </p>
            </Card>

            <Card variant="feature">
              <div className="w-16 h-16 bg-success-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <StarIcon className="h-8 w-8 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                5-Star Service
              </h3>
              <p className="text-gray-600">
                Rated #1 by customers for reliability, communication, and care.
              </p>
            </Card>

            <Card variant="feature">
              <div className="w-16 h-16 bg-warning-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TruckIcon className="h-8 w-8 text-warning-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Nationwide Network
              </h3>
              <p className="text-gray-600">
                Ship anywhere in the continental US with our verified carrier network.
              </p>
            </Card>
          </div>

          {/* Customer Testimonial */}
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary-50 to-trust-50 border-primary-200">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5 text-warning-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-lg md:text-xl text-gray-700 font-medium mb-4">
                "Shipped my Tesla from California to New York. Perfect condition, on time, 
                and great communication throughout. Will definitely use again!"
              </blockquote>
              <div className="text-gray-600">
                <strong>Sarah M.</strong> - Verified Customer
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Service Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              The Smart Choice for Auto Transport
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              While others focus on volume, we focus on your peace of mind. 
              Here's what sets us apart from the competition.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mr-4">
                    <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Zero Hidden Fees
                    </h3>
                    <p className="text-gray-600">
                      Unlike other companies that add surprise charges, our quotes are final. 
                      What you see is what you pay - guaranteed.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-trust-100 rounded-xl flex items-center justify-center mr-4">
                    <ClockIcon className="h-6 w-6 text-trust-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Real-Time Tracking
                    </h3>
                    <p className="text-gray-600">
                      Know exactly where your vehicle is at all times. No more wondering 
                      or waiting for updates from unresponsive carriers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mr-4">
                    <DocumentCheckIcon className="h-6 w-6 text-success-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      White-Glove Service
                    </h3>
                    <p className="text-gray-600">
                      Personal account manager, pickup reminders, delivery coordination, 
                      and 24/7 customer support throughout your shipment.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:pl-8">
              <Card className="p-8 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
                <h3 className="text-2xl font-bold mb-6">Why Customers Choose Us</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-100 mb-1">98%</div>
                    <div className="text-sm text-primary-200">On-Time Delivery</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-100 mb-1">$2M</div>
                    <div className="text-sm text-primary-200">Insurance Coverage</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-100 mb-1">15+</div>
                    <div className="text-sm text-primary-200">Years Experience</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-100 mb-1">24/7</div>
                    <div className="text-sm text-primary-200">Support Available</div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-primary-500">
                  <div className="text-center">
                    <p className="text-primary-100 text-sm mb-3">
                      <strong>Price Match Guarantee:</strong> Find a lower quote? We'll beat it by 5%
                    </p>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="bg-white text-primary-600 hover:bg-gray-50"
                      onClick={() => router.push('/pricing')}
                    >
                      View Pricing
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              Trusted by Leading Companies
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              From individual car enthusiasts to Fortune 500 companies, 
              we've earned the trust of customers nationwide.
            </p>
          </div>

          {/* Customer Logos */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center mb-16 opacity-60">
            {['Tesla', 'BMW', 'Mercedes', 'Audi', 'Porsche', 'Ford'].map((brand) => (
              <div key={brand} className="text-2xl font-bold text-gray-400">
                {brand}
              </div>
            ))}
          </div>

          {/* Success Stories Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5 text-warning-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-4">
                "Shipped my classic Mustang from Texas to California. 
                Arrived in perfect condition, exactly on schedule."
              </blockquote>
              <div className="text-sm text-gray-600">
                <strong>Mike R.</strong> - Classic Car Collector
              </div>
            </Card>

            <Card className="text-center">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5 text-warning-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-4">
                "Professional service for our corporate fleet. 
                Handled 50+ vehicles without a single issue."
              </blockquote>
              <div className="text-sm text-gray-600">
                <strong>Jennifer L.</strong> - Fleet Manager
              </div>
            </Card>

            <Card className="text-center">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5 text-warning-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-4">
                "Moving across country was stressful enough. 
                These guys made the car transport the easy part."
              </blockquote>
              <div className="text-sm text-gray-600">
                <strong>David & Amy K.</strong> - Military Family
              </div>
            </Card>
          </div>

          {/* Process Section */}
          <div className="bg-gradient-to-r from-primary-50 to-trust-50 rounded-2xl p-8 lg:p-12">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-4">
                How It Works - Simple & Transparent
              </h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                From quote to delivery in three easy steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="relative">
                  <div className="bg-primary-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                    1
                  </div>
                  {/* Connection line */}
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-primary-200 transform translate-x-8"></div>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">
                  Get Instant Quote
                </h4>
                <p className="text-gray-600">
                  Enter your pickup and delivery locations. Receive a detailed quote in under 60 seconds.
                </p>
              </div>

              <div className="text-center">
                <div className="relative">
                  <div className="bg-primary-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                    2
                  </div>
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-primary-200 transform translate-x-8"></div>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">
                  Book & Schedule
                </h4>
                <p className="text-gray-600">
                  Choose your dates, confirm details, and secure booking with a small deposit.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-primary-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                  3
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">
                  Track & Receive
                </h4>
                <p className="text-gray-600">
                  Monitor your shipment in real-time and receive your vehicle in perfect condition.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Ready to Ship Your Vehicle?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
            Join over 50,000 satisfied customers who chose the smarter way to transport their vehicles. 
            Get your free quote in 60 seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              size="lg" 
              className="bg-white text-primary-600 hover:bg-gray-50 shadow-xl"
              onClick={() => router.push('/auth/signup')}
              icon={<TruckIcon className="h-5 w-5" />}
            >
              Get Free Quote Now
            </Button>
            <Button 
              variant="secondary" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-primary-600"
              onClick={() => typeof window !== 'undefined' && window.open('tel:1-800-SHIP-CAR', '_self')}
              icon={<PhoneIcon className="h-5 w-5" />}
            >
              Call: 1-800-SHIP-CAR
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-sm text-primary-200">
            <div className="flex items-center">
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              No obligations
            </div>
            <div className="flex items-center">
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Instant pricing
            </div>
            <div className="flex items-center">
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Same-day response
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 