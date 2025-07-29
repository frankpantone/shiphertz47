'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { Card, Button, Badge } from '@/components/ui'
import { toast } from 'react-hot-toast'

interface TransportationRequest {
  id: string
  order_number: string
  pickup_company_name: string
  pickup_company_address: string
  pickup_contact_name: string
  pickup_contact_phone: string
  delivery_company_name: string
  delivery_company_address: string
  delivery_contact_name: string
  delivery_contact_phone: string
  status: string
  created_at: string
  pickup_date?: string
  delivery_date?: string
  carrier_name?: string
  carrier_phone?: string
  tracking_updates?: TrackingUpdate[]
}

interface TrackingUpdate {
  id: string
  message: string
  status: string
  created_at: string
  location?: string
}

const statusSteps = [
  { status: 'pending', label: 'Order Submitted', icon: DocumentTextIcon },
  { status: 'quoted', label: 'Quote Provided', icon: ClockIcon },
  { status: 'accepted', label: 'Quote Accepted', icon: CheckCircleIcon },
  { status: 'in_transit', label: 'In Transit', icon: TruckIcon },
  { status: 'completed', label: 'Delivered', icon: CheckCircleIcon },
]

export default function TrackOrderPage() {
  const params = useParams()
  const router = useRouter()
  const orderNumber = params.orderNumber as string
  
  const [order, setOrder] = useState<TransportationRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrder()
    
    // Set up real-time subscription
    const channel = supabase
      .channel(`order-tracking-${orderNumber}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transportation_requests',
          filter: `order_number=eq.${orderNumber}`
        },
        (payload: any) => {
          console.log('Real-time update received:', payload)
          fetchOrder() // Refresh order data
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderNumber])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('transportation_requests')
        .select('*')
        .eq('order_number', orderNumber)
        .single()

      if (error) {
        setError('Order not found')
        return
      }

      // Simulate tracking updates (in a real app, these would come from a tracking_updates table)
      const mockTrackingUpdates: TrackingUpdate[] = []
      
      if (data.status !== 'pending') {
        mockTrackingUpdates.push({
          id: '1',
          message: 'Order submitted and received',
          status: 'pending',
          created_at: data.created_at,
        })
      }
      
      if (['quoted', 'accepted', 'in_transit', 'completed'].includes(data.status)) {
        mockTrackingUpdates.push({
          id: '2',
          message: 'Quote prepared and sent to customer',
          status: 'quoted',
          created_at: new Date(Date.parse(data.created_at) + 3600000).toISOString(),
        })
      }
      
      if (['accepted', 'in_transit', 'completed'].includes(data.status)) {
        mockTrackingUpdates.push({
          id: '3',
          message: 'Quote accepted, carrier assigned',
          status: 'accepted',
          created_at: new Date(Date.parse(data.created_at) + 7200000).toISOString(),
        })
      }
      
      if (['in_transit', 'completed'].includes(data.status)) {
        mockTrackingUpdates.push({
          id: '4',
          message: 'Vehicle picked up from origin',
          status: 'in_transit',
          created_at: new Date(Date.parse(data.created_at) + 86400000).toISOString(),
          location: 'Los Angeles, CA'
        })
      }
      
      if (data.status === 'completed') {
        mockTrackingUpdates.push({
          id: '5',
          message: 'Vehicle delivered successfully',
          status: 'completed',
          created_at: new Date(Date.parse(data.created_at) + 172800000).toISOString(),
          location: 'New York, NY'
        })
      }

      setOrder({
        ...data,
        tracking_updates: mockTrackingUpdates.reverse(), // Show newest first
        carrier_name: data.status === 'in_transit' || data.status === 'completed' ? 'Express Auto Carriers' : undefined,
        carrier_phone: data.status === 'in_transit' || data.status === 'completed' ? '1-800-555-0123' : undefined,
      })
      
    } catch (err) {
      console.error('Error fetching order:', err)
      setError('Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  const getCurrentStep = () => {
    const index = statusSteps.findIndex(step => step.status === order?.status)
    return index >= 0 ? index : 0
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn't find an order with number <strong>{orderNumber}</strong>
            </p>
            <Button onClick={() => router.push('/')}>
              Return Home
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const currentStep = getCurrentStep()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Track Your Order</h1>
            <p className="text-gray-600 mt-1">Order #{order.order_number}</p>
          </div>
          <Badge 
            variant={order.status === 'completed' ? 'completed' : 
                    order.status === 'in_transit' ? 'accepted' : 
                    order.status === 'cancelled' ? 'cancelled' : 'pending'}
            size="lg"
          >
            {order.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        {/* Progress Tracker */}
        <Card className="mb-8 p-8">
          <div className="relative">
            <div className="absolute top-8 left-8 right-8 h-1 bg-gray-200">
              <div 
                className="h-full bg-primary-600 transition-all duration-500"
                style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
              />
            </div>
            
            <div className="relative flex justify-between">
              {statusSteps.map((step, index) => {
                const isActive = index <= currentStep
                const Icon = step.icon
                
                return (
                  <div key={step.status} className="text-center">
                    <div className={`
                      w-16 h-16 rounded-full flex items-center justify-center
                      ${isActive ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'}
                      transition-all duration-300 relative z-10
                    `}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className={`mt-3 text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tracking Updates */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Tracking Updates</h2>
                
                {order.tracking_updates && order.tracking_updates.length > 0 ? (
                  <div className="space-y-4">
                    {order.tracking_updates.map((update, index) => (
                      <div key={update.id} className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center
                            ${index === 0 ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}
                          `}>
                            <CheckCircleIcon className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="font-medium text-gray-900">{update.message}</p>
                          {update.location && (
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <MapPinIcon className="h-4 w-4 mr-1" />
                              {update.location}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(update.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No tracking updates available yet.</p>
                )}
              </div>
            </Card>

            {/* Route Information */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Route Information</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-start mb-4">
                      <MapPinIcon className="h-5 w-5 text-primary-600 mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-gray-900">Pickup Location</h3>
                        <p className="text-gray-600">{order.pickup_company_name}</p>
                        <p className="text-sm text-gray-500">{order.pickup_company_address}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Contact: {order.pickup_contact_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.pickup_contact_phone}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-start mb-4">
                      <MapPinIcon className="h-5 w-5 text-success-600 mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-gray-900">Delivery Location</h3>
                        <p className="text-gray-600">{order.delivery_company_name}</p>
                        <p className="text-sm text-gray-500">{order.delivery_company_address}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Contact: {order.delivery_contact_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.delivery_contact_phone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Order Date</span>
                    <span className="font-medium text-gray-900">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {order.pickup_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pickup Date</span>
                      <span className="font-medium text-gray-900">
                        {new Date(order.pickup_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {order.delivery_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Est. Delivery</span>
                      <span className="font-medium text-gray-900">
                        {new Date(order.delivery_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Carrier Information */}
            {order.carrier_name && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Carrier Information</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Carrier Name</p>
                      <p className="font-medium text-gray-900">{order.carrier_name}</p>
                    </div>
                    
                    {order.carrier_phone && (
                      <div>
                        <p className="text-sm text-gray-600">Contact</p>
                        <a 
                          href={`tel:${order.carrier_phone}`}
                          className="font-medium text-primary-600 hover:text-primary-700"
                        >
                          {order.carrier_phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Need Help? */}
            <Card className="bg-primary-50 border-primary-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Our customer support team is here to assist you with your order.
                </p>
                
                <div className="space-y-3">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open('tel:1-800-SHIP-CAR', '_self')}
                  >
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    Call Support
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.location.href = 'mailto:support@shiphertz.com'}
                  >
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    Email Support
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}