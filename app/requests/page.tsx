'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { 
  TruckIcon,
  MapPinIcon,
  CalendarIcon,
  EyeIcon,
  ClipboardDocumentListIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

interface TransportationRequest {
  id: string
  order_number: string
  pickup_company_name: string
  pickup_company_address: string
  delivery_company_name: string
  delivery_company_address: string
  status: string
  created_at: string
  updated_at: string
}

interface Quote {
  id: string
  total_amount: number
  is_active: boolean
  created_at: string
}

export default function CustomerRequestsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<TransportationRequest[]>([])
  const [quotes, setQuotes] = useState<Record<string, Quote[]>>({})
  const [requestsLoading, setRequestsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }
    
    if (user) {
      fetchCustomerRequests()
    }
  }, [user, loading, router])

  const fetchCustomerRequests = async () => {
    try {
      setRequestsLoading(true)
      console.log('🔍 Fetching customer requests for user:', user?.id)

      // Fetch user's transportation requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('transportation_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (requestsError) {
        console.error('❌ Failed to fetch requests:', requestsError)
        throw requestsError
      }

      console.log('✅ Requests fetched:', requestsData?.length || 0)
      setRequests(requestsData || [])

      // Fetch quotes for all requests
      if (requestsData && requestsData.length > 0) {
        const requestIds = requestsData.map(r => r.id)
        const { data: quotesData, error: quotesError } = await supabase
          .from('quotes')
          .select('id, transportation_request_id, total_amount, is_active, created_at')
          .in('transportation_request_id', requestIds)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (quotesError) {
          console.warn('⚠️ Failed to fetch quotes:', quotesError)
        } else {
          // Group quotes by request ID
          const quotesByRequest: Record<string, Quote[]> = {}
          quotesData?.forEach(quote => {
            if (!quotesByRequest[quote.transportation_request_id]) {
              quotesByRequest[quote.transportation_request_id] = []
            }
            quotesByRequest[quote.transportation_request_id].push(quote)
          })
          setQuotes(quotesByRequest)
          console.log('✅ Quotes fetched for requests:', Object.keys(quotesByRequest).length)
        }
      }

    } catch (err: any) {
      console.error('💥 Error fetching customer requests:', err)
      toast.error('Failed to load your requests')
    } finally {
      setRequestsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      quoted: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
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

  if (loading || requestsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Transportation Requests</h1>
          <p className="text-gray-600 mt-1">View and manage your transportation requests and quotes</p>
        </div>
        <Link
          href="/request"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Request
        </Link>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No requests yet</h3>
          <p className="mt-2 text-gray-500">Get started by creating your first transportation request.</p>
          <div className="mt-6">
            <Link
              href="/request"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Request
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((request) => {
            const requestQuotes = quotes[request.id] || []
            const hasActiveQuote = requestQuotes.length > 0
            const latestQuote = requestQuotes[0]

            return (
              <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.order_number}
                      </h3>
                      {getStatusBadge(request.status)}
                      {hasActiveQuote && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Quote Available
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/requests/${request.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                    {/* Pickup Location */}
                    <div className="flex items-start space-x-3">
                      <MapPinIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Pickup</p>
                        <p className="text-sm text-gray-700">{request.pickup_company_name}</p>
                        <p className="text-xs text-gray-500">{request.pickup_company_address}</p>
                      </div>
                    </div>

                    {/* Delivery Location */}
                    <div className="flex items-start space-x-3">
                      <MapPinIcon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Delivery</p>
                        <p className="text-sm text-gray-700">{request.delivery_company_name}</p>
                        <p className="text-xs text-gray-500">{request.delivery_company_address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Quote Information */}
                  {hasActiveQuote && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800">Quote Available</p>
                          <p className="text-2xl font-bold text-green-600">${latestQuote.total_amount.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-green-600">
                            Quoted {formatDate(latestQuote.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Request Info */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Created {formatDate(request.created_at)}
                      </div>
                      <div className="flex items-center">
                        <TruckIcon className="h-4 w-4 mr-1" />
                        Transportation Request
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
} 