'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  TruckIcon,
  MapPinIcon,
  PhoneIcon,
  UserPlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { useRawAuth } from '@/hooks/useRawAuth'
import { getRawRequests, updateRawRequest } from '@/lib/auth-raw'

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
  vin_number: string
  vehicle_make?: string
  vehicle_model?: string
  vehicle_year?: number
  notes?: string
  status: string
  assigned_admin_id?: string
  created_at: string
}

export default function NewOrdersPage() {
  const router = useRouter()
  const { user, profile, loading, error, adminAccess, redirectToLogin, redirectToDashboard } = useRawAuth()
  const [requests, setRequests] = useState<TransportationRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [claimingId, setClaimingId] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔍 New Orders - Admin access check:', adminAccess)

    if (adminAccess === 'not-authenticated') {
      console.log('❌ Not authenticated, redirecting to login')
      redirectToLogin()
      return
    }
    
    if (adminAccess === 'not-admin') {
      console.log('❌ Not admin, redirecting to dashboard')
      redirectToDashboard()
      return
    }
    
    if (adminAccess === 'admin') {
      console.log('✅ Admin access granted, loading new requests')
      fetchNewRequests()
    }
  }, [adminAccess, redirectToLogin, redirectToDashboard]) // Simplified dependencies

  const fetchNewRequests = async () => {
    try {
      setRequestsLoading(true)
      
      // Fetch unassigned requests using raw fetch
      const requests = await getRawRequests({
        status: 'pending',
        assigned_admin_id: null
      })
      
      setRequests(requests)
    } catch (error) {
      console.error('Error fetching new requests:', error)
      toast.error('Failed to load new requests')
    } finally {
      setRequestsLoading(false)
    }
  }

  const handleClaimOrder = async (requestId: string) => {
    if (!user) return
    
    setClaimingId(requestId)
    
    try {
      // Update request to assign it to current admin
      const success = await updateRawRequest(requestId, {
        assigned_admin_id: user.id,
        status: 'quoted' // Move to quoted status when claimed
      })

      if (success) {
        toast.success('Order claimed successfully!')
        // Remove the claimed request from the list
        setRequests(prev => prev.filter(r => r.id !== requestId))
      } else {
        toast.error('Failed to claim order')
      }
    } catch (error) {
      console.error('Error claiming order:', error)
      toast.error('Failed to claim order')
    } finally {
      setClaimingId(null)
    }
  }

  const handleViewOrder = (request: TransportationRequest) => {
    console.log('🔍 Navigating to order details:', request.order_number)
    router.push(`/admin/orders/${request.id}`)
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

  // Show loading while checking authentication
  if (adminAccess === 'loading' || requestsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        <div className="ml-4">
          <p className="text-gray-600">
            {adminAccess === 'loading' ? 'Checking authentication...' : 'Loading new orders...'}
          </p>
        </div>
      </div>
    )
  }

  // Don't render anything if not admin (redirects are handled in useEffect)
  if (adminAccess !== 'admin') {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/admin"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Back to Admin
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-2">
          <TruckIcon className="h-8 w-8 text-yellow-600" />
          <h1 className="text-3xl font-bold text-gray-900">New Orders</h1>
        </div>
        <p className="text-gray-600">
          Unassigned transportation requests waiting for admin attention
        </p>
        <p className="text-sm text-green-600 mt-2">
          ✅ Using reliable raw auth system - no hanging issues
        </p>
      </div>

      {/* Orders List */}
      {requests.length === 0 ? (
        <div className="card text-center py-12">
          <TruckIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No New Orders</h3>
          <p className="text-gray-600">
            All current requests have been assigned. Check back later for new orders.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((request) => (
            <div key={request.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {request.order_number}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Submitted {formatDate(request.created_at)}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleViewOrder(request)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    View Details
                  </button>
                  <button
                    onClick={() => handleClaimOrder(request.id)}
                    disabled={claimingId === request.id}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <UserPlusIcon className="h-4 w-4" />
                    <span>
                      {claimingId === request.id ? 'Claiming...' : 'Claim Order'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Pickup Information */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <MapPinIcon className="h-5 w-5 mr-2 text-green-600" />
                    Pickup Location
                  </h4>
                  <div className="pl-7 space-y-2">
                    <p className="font-medium">{request.pickup_company_name}</p>
                    <p className="text-gray-600 text-sm">{request.pickup_company_address}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-600">Contact: {request.pickup_contact_name}</span>
                      <span className="flex items-center text-gray-600">
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        {request.pickup_contact_phone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <MapPinIcon className="h-5 w-5 mr-2 text-red-600" />
                    Delivery Location
                  </h4>
                  <div className="pl-7 space-y-2">
                    <p className="font-medium">{request.delivery_company_name}</p>
                    <p className="text-gray-600 text-sm">{request.delivery_company_address}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-600">Contact: {request.delivery_contact_name}</span>
                      <span className="flex items-center text-gray-600">
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        {request.delivery_contact_phone}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Vehicle Information</h4>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="bg-gray-100 px-3 py-1 rounded-full">
                    VIN: {request.vin_number}
                  </span>
                  {request.vehicle_make && (
                    <span className="bg-blue-100 px-3 py-1 rounded-full">
                      {request.vehicle_year} {request.vehicle_make} {request.vehicle_model}
                    </span>
                  )}
                </div>
                {request.notes && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">
                      <strong>Notes:</strong> {request.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 