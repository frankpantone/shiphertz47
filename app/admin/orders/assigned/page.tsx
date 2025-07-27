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
  ClockIcon,
  CheckIcon,
  XMarkIcon,
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

export default function AssignedOrdersPage() {
  const router = useRouter()
  const { user, profile, loading, error, adminAccess, redirectToLogin, redirectToDashboard } = useRawAuth()
  const [requests, setRequests] = useState<TransportationRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔍 Assigned Orders - Admin access check:', adminAccess)

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
      console.log('✅ Admin access granted, loading assigned requests')
      fetchAssignedRequests()
    }
  }, [adminAccess, redirectToLogin, redirectToDashboard]) // Simplified dependencies

  const fetchAssignedRequests = async () => {
    if (!user) return
    
    try {
      setRequestsLoading(true)
      
      // Fetch requests assigned to current admin
      const allRequests = await getRawRequests()
      const assignedRequests = allRequests.filter(request => 
        request.assigned_admin_id === user.id
      )
      
      setRequests(assignedRequests)
    } catch (error) {
      console.error('Error fetching assigned requests:', error)
      toast.error('Failed to load assigned orders')
    } finally {
      setRequestsLoading(false)
    }
  }

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      setUpdatingId(requestId)
      
      await updateRawRequest(requestId, { status: newStatus })
      
      // Update local state
      setRequests(prev => prev.map(request => 
        request.id === requestId 
          ? { ...request, status: newStatus }
          : request
      ))
      
      toast.success(`Order ${newStatus === 'in_progress' ? 'started' : 'completed'}`)
    } catch (error) {
      console.error('Error updating request status:', error)
      toast.error('Failed to update order status')
    } finally {
      setUpdatingId(null)
    }
  }

  const unassignRequest = async (requestId: string) => {
    try {
      setUpdatingId(requestId)
      
      await updateRawRequest(requestId, { 
        assigned_admin_id: null,
        status: 'pending'
      })
      
      // Remove from local state
      setRequests(prev => prev.filter(request => request.id !== requestId))
      
      toast.success('Order unassigned')
    } catch (error) {
      console.error('Error unassigning request:', error)
      toast.error('Failed to unassign order')
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'quoted': return 'bg-blue-100 text-blue-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-green-200 text-green-900'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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

  const handleViewOrder = (request: TransportationRequest) => {
    console.log('🔍 Navigating to order details:', request.order_number)
    router.push(`/admin/orders/${request.id}`)
  }

  // Show loading while checking authentication
  if (adminAccess === 'loading' || requestsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        <div className="ml-4">
          <p className="text-gray-600">
            {adminAccess === 'loading' ? 'Checking authentication...' : 'Loading assigned orders...'}
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
          <TruckIcon className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        </div>
        <p className="text-gray-600">
          Transportation requests assigned to you
        </p>
        <p className="text-sm text-green-600 mt-2">
          ✅ Using reliable raw auth system - no hanging issues
        </p>
      </div>

      {/* Orders List */}
      {requests.length === 0 ? (
        <div className="card text-center py-12">
          <TruckIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Assigned Orders</h3>
          <p className="text-gray-600 mb-4">
            You don't have any assigned orders yet.
          </p>
          <Link
            href="/admin/orders/new"
            className="btn-primary"
          >
            Browse New Orders
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((request) => (
            <div key={request.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.order_number}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Submitted {formatDate(request.created_at)}
                  </p>
                </div>
                
                <div className="flex flex-col space-y-2">
                  {/* View Details Button */}
                  <button
                    onClick={() => handleViewOrder(request)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    View Details
                  </button>
                  
                  {/* Status Update Buttons */}
                  {request.status === 'quoted' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateRequestStatus(request.id, 'in_progress')}
                        disabled={updatingId === request.id}
                        className="btn-primary text-sm flex items-center space-x-1"
                      >
                        <ClockIcon className="h-4 w-4" />
                        <span>Start Work</span>
                      </button>
                    </div>
                  )}
                  
                  {request.status === 'in_progress' && (
                    <button
                      onClick={() => updateRequestStatus(request.id, 'completed')}
                      disabled={updatingId === request.id}
                      className="btn-primary text-sm flex items-center space-x-1"
                    >
                      <CheckIcon className="h-4 w-4" />
                      <span>Mark Complete</span>
                    </button>
                  )}
                  
                  {['quoted', 'in_progress'].includes(request.status) && (
                    <button
                      onClick={() => unassignRequest(request.id)}
                      disabled={updatingId === request.id}
                      className="btn-secondary text-sm"
                    >
                      Unassign
                    </button>
                  )}
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

              {/* Quote Section - Placeholder for future implementation */}
              {request.status === 'quoted' && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Quote Management</h4>
                    <button className="btn-secondary text-sm flex items-center space-x-1">
                      {/* CurrencyDollarIcon is not imported, so it's removed */}
                      <span>Create Quote</span>
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Quote creation system will be implemented in Phase 4
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 