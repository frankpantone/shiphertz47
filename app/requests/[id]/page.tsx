'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  TruckIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  CalendarIcon,
  DocumentTextIcon,
  PaperClipIcon,
  CheckCircleIcon,
  XCircleIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import StripePaymentForm from '@/components/StripePaymentForm'

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
  notes?: string
  created_at: string
  updated_at: string
}

interface Vehicle {
  id: string
  vin_number: string
  vehicle_make?: string
  vehicle_model?: string
  vehicle_year?: number
  vehicle_type?: string
  vehicle_engine?: string
}

interface Quote {
  id: string
  admin_id: string
  base_price: number
  fuel_surcharge: number
  additional_fees: number
  total_amount: number
  estimated_pickup_date?: string
  estimated_delivery_date?: string
  terms_and_conditions?: string
  notes?: string
  is_active: boolean
  expires_at?: string
  created_at: string
}

interface DocumentAttachment {
  id: string
  file_name: string
  file_size: number
  file_type: string
  created_at: string
}

export default function CustomerRequestDetailPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [request, setRequest] = useState<TransportationRequest | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [attachments, setAttachments] = useState<DocumentAttachment[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [processingQuote, setProcessingQuote] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }
    
    if (user && params.id) {
      fetchRequestDetails()
    }
  }, [user, loading, router, params.id])

  const fetchRequestDetails = async () => {
    try {
      setPageLoading(true)
      setError('')
      
      const requestId = params.id as string
      console.log('🔍 Fetching request details for:', requestId)

      // Fetch the transportation request
      const { data: requestData, error: requestError } = await supabase
        .from('transportation_requests')
        .select('*')
        .eq('id', requestId)
        .eq('user_id', user?.id) // Ensure user can only view their own requests
        .single()

      if (requestError) {
        console.error('❌ Failed to fetch request:', requestError)
        if (requestError.code === 'PGRST116') {
          setError('Request not found or you do not have permission to view it.')
        } else {
          setError('Failed to load request details')
        }
        return
      }

      setRequest(requestData)

      // Fetch vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('transportation_request_id', requestId)
        .order('created_at', { ascending: true })

      if (vehiclesError) {
        console.warn('⚠️ Failed to fetch vehicles:', vehiclesError)
      } else {
        setVehicles(vehiclesData || [])
      }

      // Fetch quotes
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .eq('transportation_request_id', requestId)
        .order('created_at', { ascending: false })

      if (quotesError) {
        console.warn('⚠️ Failed to fetch quotes:', quotesError)
      } else {
        setQuotes(quotesData || [])
      }

      // Fetch attachments
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('document_attachments')
        .select('id, file_name, file_size, file_type, created_at')
        .eq('transportation_request_id', requestId)
        .order('created_at', { ascending: false })

      if (attachmentsError) {
        console.warn('⚠️ Failed to fetch attachments:', attachmentsError)
      } else {
        setAttachments(attachmentsData || [])
      }

      console.log('✅ Request details loaded successfully')

    } catch (err: any) {
      console.error('💥 Error fetching request details:', err)
      setError('Failed to load request details')
    } finally {
      setPageLoading(false)
    }
  }

  const handleQuoteAction = async (quoteId: string, action: 'accept' | 'decline') => {
    if (!request) return

    if (action === 'accept') {
      // For acceptance, show payment modal
      const quote = quotes.find(q => q.id === quoteId)
      if (quote) {
        setSelectedQuote(quote)
        setShowPaymentModal(true)
      }
      return
    }

    try {
      setProcessingQuote(quoteId)
      console.log(`❌ Declining quote:`, quoteId)

      // Update the order status to declined
      const { error: updateError } = await supabase
        .from('transportation_requests')
        .update({ status: 'declined' })
        .eq('id', request.id)

      if (updateError) {
        console.error('❌ Failed to update request status:', updateError)
        throw updateError
      }

      // Deactivate the quote
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({ is_active: false })
        .eq('id', quoteId)

      if (quoteError) {
        console.warn('⚠️ Failed to deactivate quote:', quoteError)
      }

      // Refresh the data
      await fetchRequestDetails()
      
      toast.success('Quote declined successfully!')
      
    } catch (err: any) {
      console.error('💥 Error declining quote:', err)
      toast.error('Failed to decline quote')
    } finally {
      setProcessingQuote(null)
    }
  }

  const handlePaymentSuccess = async () => {
    console.log('✅ Payment completed successfully')
    setShowPaymentModal(false)
    setSelectedQuote(null)
    
    // Refresh the request details to show updated status
    await fetchRequestDetails()
    
    toast.success('Payment completed! Your order is now being processed.')
  }

  const handlePaymentError = (error: string) => {
    console.error('❌ Payment error:', error)
    toast.error(`Payment failed: ${error}`)
  }

  const handlePaymentCancel = () => {
    setShowPaymentModal(false)
    setSelectedQuote(null)
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      quoted: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'
      }`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading || pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Request Not Found</h3>
        <p className="mt-2 text-gray-600">{error || 'The requested transportation request could not be found.'}</p>
        <Link
          href="/requests"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to My Requests
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/requests"
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to My Requests
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Request Details</h1>
            <p className="text-gray-600">Order {request.order_number}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(request.status)}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Request Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Summary</h2>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Order Number</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{request.order_number}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">{getStatusBadge(request.status)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Submitted</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                  {formatDate(request.created_at)}
                </dd>
              </div>
              {request.updated_at !== request.created_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                    {formatDate(request.updated_at)}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Vehicles */}
          {vehicles.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TruckIcon className="h-5 w-5 mr-2 text-blue-600" />
                Vehicles ({vehicles.length})
              </h2>
              <div className="space-y-4">
                {vehicles.map((vehicle, index) => (
                  <div key={vehicle.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Vehicle {index + 1}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <dt className="text-xs font-medium text-gray-500">VIN</dt>
                        <dd className="text-sm font-mono text-gray-900">{vehicle.vin_number}</dd>
                      </div>
                      {vehicle.vehicle_make && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500">Make</dt>
                          <dd className="text-sm text-gray-900">{vehicle.vehicle_make}</dd>
                        </div>
                      )}
                      {vehicle.vehicle_model && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500">Model</dt>
                          <dd className="text-sm text-gray-900">{vehicle.vehicle_model}</dd>
                        </div>
                      )}
                      {vehicle.vehicle_year && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500">Year</dt>
                          <dd className="text-sm text-gray-900">{vehicle.vehicle_year}</dd>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special Notes */}
          {request.notes && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                Special Notes
              </h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">{request.notes}</p>
              </div>
            </div>
          )}

          {/* Document Attachments */}
          {attachments.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PaperClipIcon className="h-5 w-5 mr-2 text-blue-600" />
                Documents ({attachments.length})
              </h2>
              <div className="space-y-3">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <PaperClipIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{attachment.file_name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(attachment.file_size)} • Uploaded {formatDate(attachment.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Pickup Location */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2 text-green-600" />
              Pickup Location
            </h2>
            <div className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Company</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{request.pickup_company_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-700">{request.pickup_company_address}</dd>
              </div>
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-900">{request.pickup_contact_name}</span>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-900">{request.pickup_contact_phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Location */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2 text-red-600" />
              Delivery Location
            </h2>
            <div className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Company</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{request.delivery_company_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-700">{request.delivery_company_address}</dd>
              </div>
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-900">{request.delivery_contact_name}</span>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-900">{request.delivery_contact_phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quotes Section - Full Width */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          Quotes ({quotes.length})
        </h2>

        {quotes.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No quotes available</h3>
            <p className="mt-2 text-gray-500">We'll notify you when a quote is ready for your request.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {quotes.map((quote, index) => (
              <div key={quote.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Quote #{index + 1}</h3>
                  <div className="flex items-center space-x-2">
                    {quote.is_active ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      {formatDate(quote.created_at)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Pricing Breakdown */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Pricing Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Base Price:</span>
                        <span className="text-sm font-mono text-gray-900">${quote.base_price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Fuel Surcharge:</span>
                        <span className="text-sm font-mono text-gray-900">${quote.fuel_surcharge.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Additional Fees:</span>
                        <span className="text-sm font-mono text-gray-900">${quote.additional_fees.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between">
                        <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                        <span className="text-lg font-bold text-green-600">${quote.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  {(quote.estimated_pickup_date || quote.estimated_delivery_date) && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Estimated Timeline</h4>
                      <div className="space-y-2">
                        {quote.estimated_pickup_date && (
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-2 text-green-600" />
                            <span className="text-sm text-gray-600">Pickup:</span>
                            <span className="text-sm text-gray-900 ml-2">
                              {new Date(quote.estimated_pickup_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {quote.estimated_delivery_date && (
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-2 text-red-600" />
                            <span className="text-sm text-gray-600">Delivery:</span>
                            <span className="text-sm text-gray-900 ml-2">
                              {new Date(quote.estimated_delivery_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Terms and Conditions */}
                {quote.terms_and_conditions && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Terms and Conditions</h4>
                    <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
                      <p className="text-sm text-gray-700">{quote.terms_and_conditions}</p>
                    </div>
                  </div>
                )}

                {/* Quote Expiration */}
                {quote.expires_at && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600">
                      This quote expires on {formatDate(quote.expires_at)}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {quote.is_active && request.status !== 'accepted' && request.status !== 'declined' && request.status !== 'paid' && (
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleQuoteAction(quote.id, 'accept')}
                      disabled={processingQuote === quote.id}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      <CreditCardIcon className="h-4 w-4 mr-2" />
                      {processingQuote === quote.id ? 'Processing...' : 'Accept & Pay'}
                    </button>
                    <button
                      onClick={() => handleQuoteAction(quote.id, 'decline')}
                      disabled={processingQuote === quote.id}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      {processingQuote === quote.id ? 'Declining...' : 'Decline Quote'}
                    </button>
                  </div>
                )}

                {/* Quote Status Message */}
                {request.status === 'paid' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-800">Payment Completed</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Payment has been processed successfully. Your transportation request is now being handled.
                    </p>
                  </div>
                )}

                {request.status === 'accepted' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-800">Quote Accepted</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      You have accepted this quote. We'll be in touch about next steps.
                    </p>
                  </div>
                )}

                {request.status === 'declined' && !quote.is_active && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
                      <span className="text-sm font-medium text-red-800">Quote Declined</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">
                      You have declined this quote.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedQuote && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <StripePaymentForm
              quoteId={selectedQuote.id}
              quoteAmount={selectedQuote.total_amount}
              orderNumber={request.order_number}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handlePaymentCancel}
            />
          </div>
        </div>
      )}
    </div>
  )
} 