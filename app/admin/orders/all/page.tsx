'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TruckIcon,
  MapPinIcon,
  PhoneIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { useRawAuth } from '@/hooks/useRawAuth'
import { getRawRequests, getRawProfile } from '@/lib/auth-raw'
import { supabase } from '@/lib/supabase'

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
  user_id: string
}

interface Vehicle {
  id: string
  transportation_request_id: string
  vin_number: string
  vehicle_make?: string
  vehicle_model?: string
  vehicle_year?: number
  vehicle_type?: string
}

interface AdminProfile {
  id: string
  email: string
  full_name?: string
}

export default function AllOrdersPage() {
  const router = useRouter()
  const { user, profile, loading, error, adminAccess, redirectToLogin, redirectToDashboard } = useRawAuth()
  const [requests, setRequests] = useState<TransportationRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [adminProfiles, setAdminProfiles] = useState<Record<string, AdminProfile>>({})
  const [vehiclesByRequest, setVehiclesByRequest] = useState<Record<string, Vehicle[]>>({})
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [assignmentFilter, setAssignmentFilter] = useState('')

  useEffect(() => {
    console.log('🔍 All Orders - Admin access check:', adminAccess)

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
      console.log('✅ Admin access granted, loading all requests')
      fetchAllRequests()
    }
  }, [adminAccess, redirectToLogin, redirectToDashboard]) // Simplified dependencies

  const fetchAllRequests = async () => {
    try {
      setRequestsLoading(true)
      
      // Fetch all requests
      const allRequests = await getRawRequests()
      setRequests(allRequests)
      
      // Fetch admin profiles for assigned requests
      const adminIds = Array.from(new Set(allRequests
        .filter(r => r.assigned_admin_id)
        .map(r => r.assigned_admin_id!)))
      
      const profiles: Record<string, AdminProfile> = {}
      for (const adminId of adminIds) {
        try {
          const profile = await getRawProfile(adminId)
          if (profile) {
            profiles[adminId] = profile
          }
        } catch (error) {
          console.error(`Error fetching profile for admin ${adminId}:`, error)
        }
      }
      setAdminProfiles(profiles)
      
      // Fetch vehicles for all requests
      await fetchVehiclesForRequests(allRequests.map(r => r.id))
      
    } catch (error) {
      console.error('Error fetching all requests:', error)
      toast.error('Failed to load orders')
    } finally {
      setRequestsLoading(false)
    }
  }

  const fetchVehiclesForRequests = async (requestIds: string[]) => {
    try {
      console.log('🚗 Fetching vehicles for', requestIds.length, 'requests')
      
      const { data: vehicleData, error } = await supabase
        .from('vehicles')
        .select('*')
        .in('transportation_request_id', requestIds)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ Failed to fetch vehicles:', error)
        return
      }

      // Group vehicles by request ID
      const vehiclesByRequestId: Record<string, Vehicle[]> = {}
      vehicleData?.forEach(vehicle => {
        if (!vehiclesByRequestId[vehicle.transportation_request_id]) {
          vehiclesByRequestId[vehicle.transportation_request_id] = []
        }
        vehiclesByRequestId[vehicle.transportation_request_id].push(vehicle)
      })

      console.log('✅ Vehicles fetched and grouped:', Object.keys(vehiclesByRequestId).length, 'requests have vehicles')
      setVehiclesByRequest(vehiclesByRequestId)
      
    } catch (err) {
      console.warn('Failed to fetch vehicles:', err)
    }
  }

  const filteredRequests = requests.filter(request => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      
      // Check if any vehicle VIN matches the search term
      const requestVehicles = vehiclesByRequest[request.id] || []
      const vehicleMatches = requestVehicles.some(vehicle => 
        vehicle.vin_number.toLowerCase().includes(term) ||
        vehicle.vehicle_make?.toLowerCase().includes(term) ||
        vehicle.vehicle_model?.toLowerCase().includes(term)
      )
      
      if (
        !request.order_number.toLowerCase().includes(term) &&
        !request.pickup_company_name.toLowerCase().includes(term) &&
        !request.delivery_company_name.toLowerCase().includes(term) &&
        !request.vin_number.toLowerCase().includes(term) && // Keep legacy VIN search
        !vehicleMatches
      ) {
        return false
      }
    }
    
    // Status filter
    if (statusFilter && request.status !== statusFilter) {
      return false
    }
    
    // Assignment filter
    if (assignmentFilter === 'assigned' && !request.assigned_admin_id) {
      return false
    }
    if (assignmentFilter === 'unassigned' && request.assigned_admin_id) {
      return false
    }
    
    return true
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      quoted: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  const handleViewOrder = (order: TransportationRequest) => {
    console.log('🔍 Navigating to order details:', order.order_number)
    router.push(`/admin/orders/${order.id}`)
  }

  const getAdminName = (adminId: string) => {
    const admin = adminProfiles[adminId]
    return admin?.full_name || admin?.email || 'Unknown Admin'
  }

  // Show loading while checking authentication
  if (adminAccess === 'loading' || requestsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        <div className="ml-4">
          <p className="text-gray-600">
            {adminAccess === 'loading' ? 'Checking authentication...' : 'Loading all orders...'}
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
    <div className="min-h-screen bg-gray-50">
      <div className="w-full mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">All Orders</h1>
                <p className="text-gray-600">View complete order history and details</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  className="input-field pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <select
                className="input-field"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="quoted">Quoted</option>
                <option value="accepted">Accepted</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Assignment Filter */}
              <select
                className="input-field"
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value)}
              >
                <option value="">All Assignments</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>

              {/* Results Count */}
              <div className="flex items-center text-sm text-gray-500">
                <FunnelIcon className="h-4 w-4 mr-2" />
                {filteredRequests.length} of {requests.length} orders
              </div>
            </div>
          </div>
        </div>

                {/* Table Instructions */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>📋 Orders Management:</strong> Use the table below to view all transportation requests. You can search, filter, and click "View" to see detailed order information.
          </p>
          <div className="mt-2 text-xs text-blue-600">
            <strong>Debug:</strong> Table width set to 1400px with 8 explicit columns. Orders loaded: {filteredRequests.length}.
            {filteredRequests.length > 0 && (
              <span className="ml-2 font-mono">
                {filteredRequests[0].order_number}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Full Width Table Section */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pb-8">
        {/* Orders Table - React/Tailwind Compatible */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter || assignmentFilter
                  ? 'Try adjusting your search criteria'
                  : 'No orders have been submitted yet'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Table Container with Horizontal Scroll */}
              <div className="overflow-x-auto">
                <div className="min-w-full inline-block align-middle">
                  <table className="border-collapse" style={{ width: '1400px', minWidth: '1400px' }}>
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200" style={{ width: '140px', minWidth: '140px' }}>
                          Order #
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200" style={{ width: '200px', minWidth: '200px' }}>
                          Pickup
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200" style={{ width: '200px', minWidth: '200px' }}>
                          Delivery
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200" style={{ width: '180px', minWidth: '180px' }}>
                          Vehicle
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200" style={{ width: '100px', minWidth: '100px' }}>
                          Status
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200" style={{ width: '150px', minWidth: '150px' }}>
                          Assigned To
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200" style={{ width: '130px', minWidth: '130px' }}>
                          Created
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200 bg-blue-50" style={{ width: '100px', minWidth: '100px' }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRequests.map((request, index) => (
                        <tr key={request.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            {request.order_number}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <div className="font-semibold text-gray-900 mb-1">{request.pickup_company_name}</div>
                            <div className="text-xs text-gray-500 leading-relaxed">{request.pickup_company_address}</div>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <div className="font-semibold text-gray-900 mb-1">{request.delivery_company_name}</div>
                            <div className="text-xs text-gray-500 leading-relaxed">{request.delivery_company_address}</div>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {(() => {
                              const requestVehicles = vehiclesByRequest[request.id] || []
                              
                              if (requestVehicles.length === 0) {
                                // Fallback to legacy single VIN data
                                return (
                                  <>
                                    <div className="font-mono font-medium text-gray-900 mb-1">{request.vin_number}</div>
                                    {(request.vehicle_make || request.vehicle_model || request.vehicle_year) && (
                                      <div className="text-xs text-gray-500">
                                        {[request.vehicle_year, request.vehicle_make, request.vehicle_model]
                                          .filter(Boolean)
                                          .join(' ')}
                                      </div>
                                    )}
                                  </>
                                )
                              }
                              
                              if (requestVehicles.length === 1) {
                                // Single vehicle - show full details
                                const vehicle = requestVehicles[0]
                                return (
                                  <>
                                    <div className="font-mono font-medium text-gray-900 mb-1">{vehicle.vin_number}</div>
                                    {(vehicle.vehicle_make || vehicle.vehicle_model || vehicle.vehicle_year) && (
                                      <div className="text-xs text-gray-500">
                                        {[vehicle.vehicle_year, vehicle.vehicle_make, vehicle.vehicle_model]
                                          .filter(Boolean)
                                          .join(' ')}
                                      </div>
                                    )}
                                  </>
                                )
                              }
                              
                              // Multiple vehicles - show count and first VIN
                              const firstVehicle = requestVehicles[0]
                              return (
                                <>
                                  <div className="flex items-center space-x-2 mb-1">
                                    <TruckIcon className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-gray-900">{requestVehicles.length} vehicles</span>
                                  </div>
                                  <div className="font-mono text-xs text-gray-600 mb-1">{firstVehicle.vin_number}</div>
                                  {requestVehicles.length > 1 && (
                                    <div className="text-xs text-gray-500">+{requestVehicles.length - 1} more</div>
                                  )}
                                </>
                              )
                            })()}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {getStatusBadge(request.status)}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <span className={`${request.assigned_admin_id ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                              {request.assigned_admin_id ? getAdminName(request.assigned_admin_id) : 'Unassigned'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            {formatDate(request.created_at)}
                          </td>
                          <td className="px-4 py-4 text-sm text-center bg-blue-50">
                            <button 
                              onClick={() => {
                                console.log('🔍 View button clicked for order:', request.order_number)
                                handleViewOrder(request)
                              }}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            >
                              <EyeIcon className="h-3 w-3 mr-1" />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Professional Footer */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Showing {filteredRequests.length} of {requests.length} orders</span>
                  <span className="text-xs">💡 Scroll right to view all columns →</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  )
} 