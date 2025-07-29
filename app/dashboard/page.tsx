'use client'

import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  PlusIcon, 
  ClipboardDocumentListIcon, 
  CreditCardIcon,
  TruckIcon,
  MapPinIcon,
  CalendarIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface RecentRequest {
  id: string
  order_number: string
  pickup_company_name: string
  delivery_company_name: string
  status: string
  created_at: string
  updated_at: string
}

interface RecentQuote {
  id: string
  transportation_request_id: string
  total_amount: number
  is_active: boolean
  created_at: string
}

export default function Dashboard() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([])
  const [quotes, setQuotes] = useState<Record<string, RecentQuote[]>>({})
  const [activityLoading, setActivityLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }
    
    if (user) {
      fetchRecentActivity()
    }
  }, [user, loading, router])

  const fetchRecentActivity = async () => {
    try {
      setActivityLoading(true)
      console.log('🔍 Fetching recent activity for user:', user?.id)

      // Fetch recent transportation requests (last 5)
      const { data: requestsData, error: requestsError } = await supabase
        .from('transportation_requests')
        .select('id, order_number, pickup_company_name, delivery_company_name, status, created_at, updated_at')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(5)

      if (requestsError) {
        console.warn('⚠️ Failed to fetch recent requests:', requestsError)
      } else {
        setRecentRequests(requestsData || [])
        console.log('✅ Recent requests fetched:', requestsData?.length || 0)

        // Fetch quotes for these requests
        if (requestsData && requestsData.length > 0) {
          const requestIds = requestsData.map((r: any) => r.id)
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
            const quotesByRequest: Record<string, RecentQuote[]> = {}
            quotesData?.forEach((quote: any) => {
              if (!quotesByRequest[quote.transportation_request_id]) {
                quotesByRequest[quote.transportation_request_id] = []
              }
              quotesByRequest[quote.transportation_request_id].push(quote)
            })
            setQuotes(quotesByRequest)
            console.log('✅ Quotes fetched for requests:', Object.keys(quotesByRequest).length)
          }
        }
      }

    } catch (err: any) {
      console.error('💥 Error fetching recent activity:', err)
      toast.error('Failed to load recent activity')
    } finally {
      setActivityLoading(false)
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
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {profile.full_name || 'User'}!
        </h1>
        <p className="text-gray-600">
          Manage your transportation requests and track your orders from your dashboard.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link
          href="/request"
          className="card hover:shadow-md transition-shadow duration-200 text-center group"
        >
          <div className="flex justify-center mb-4">
            <PlusIcon className="h-12 w-12 text-primary-600 group-hover:text-primary-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            New Request
          </h3>
          <p className="text-gray-600">
            Submit a new transportation request
          </p>
        </Link>

        <Link
          href="/requests"
          className="card hover:shadow-md transition-shadow duration-200 text-center group"
        >
          <div className="flex justify-center mb-4">
            <ClipboardDocumentListIcon className="h-12 w-12 text-primary-600 group-hover:text-primary-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            My Requests
          </h3>
          <p className="text-gray-600">
            View and manage your requests
          </p>
        </Link>

        <Link
          href="/payments"
          className="card hover:shadow-md transition-shadow duration-200 text-center group"
        >
          <div className="flex justify-center mb-4">
            <CreditCardIcon className="h-12 w-12 text-primary-600 group-hover:text-primary-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Payments
          </h3>
          <p className="text-gray-600">
            Track payment history
          </p>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Activity
          </h2>
          <Link
            href="/requests"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All
          </Link>
        </div>
        
        {activityLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading recent activity...</p>
          </div>
        ) : recentRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No recent activity to display.</p>
            <p className="text-sm mt-2">
              Your transportation requests and updates will appear here.
            </p>
            <Link
              href="/request"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 mt-4"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create First Request
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentRequests.map((request) => {
              const requestQuotes = quotes[request.id] || []
              const hasActiveQuote = requestQuotes.length > 0
              const latestQuote = requestQuotes[0]

              return (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {request.order_number}
                      </h3>
                      {getStatusBadge(request.status)}
                      {hasActiveQuote && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Quote: ${latestQuote.total_amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/requests/${request.id}`}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <EyeIcon className="h-3 w-3 mr-1" />
                      View
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-2 text-green-600" />
                      <span className="truncate">{request.pickup_company_name}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-2 text-red-600" />
                      <span className="truncate">{request.delivery_company_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      Created {formatDate(request.created_at)}
                    </div>
                    {request.updated_at !== request.created_at && (
                      <div className="flex items-center">
                        <span>Updated {formatDate(request.updated_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Admin Quick Access */}
      {profile.role === 'admin' && (
        <div className="card bg-primary-50 border-primary-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Admin Tools
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/admin"
              className="btn-primary"
            >
              Admin Dashboard
            </Link>
            <Link
              href="/admin/users"
              className="btn-secondary"
            >
              Manage Users
            </Link>
          </div>
        </div>
      )}
    </div>
  )
} 