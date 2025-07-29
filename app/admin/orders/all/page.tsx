'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
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
  EyeIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { useRawAuth } from '@/hooks/useRawAuth'
import { getRawRequests, getRawProfile } from '@/lib/auth-raw'
import { supabase } from '@/lib/supabase'
import { Card, Button, Badge, Input } from '@/components/ui'
import AdvancedFilters, { AdvancedFilters as FilterState } from '@/components/admin/AdvancedFilters'
import DataExport, { ExportData } from '@/components/admin/DataExport'

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
  const [showExportModal, setShowExportModal] = useState(false)
  
  // Advanced Filters
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: [],
    dateRange: null,
    assignment: '',
    customFilters: {},
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

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
  }, [adminAccess, redirectToLogin, redirectToDashboard])

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
      vehicleData?.forEach((vehicle: Vehicle) => {
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

  // Advanced filtering and sorting logic
  const filteredAndSortedRequests = useMemo(() => {
    let filtered = requests.filter(request => {
      // Search filter
      if (filters.search) {
        const term = filters.search.toLowerCase()
        
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
          !request.vin_number.toLowerCase().includes(term) &&
          !vehicleMatches
        ) {
          return false
        }
      }
      
      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(request.status)) {
        return false
      }
      
      // Assignment filter
      if (filters.assignment === 'assigned' && !request.assigned_admin_id) {
        return false
      }
      if (filters.assignment === 'unassigned' && request.assigned_admin_id) {
        return false
      }
      
      // Date range filter
      if (filters.dateRange) {
        const requestDate = new Date(request.created_at)
        if (filters.dateRange.start) {
          const startDate = new Date(filters.dateRange.start)
          if (requestDate < startDate) return false
        }
        if (filters.dateRange.end) {
          const endDate = new Date(filters.dateRange.end)
          endDate.setHours(23, 59, 59, 999) // Include full end date
          if (requestDate > endDate) return false
        }
      }
      
      return true
    })
    
    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue: any = a[filters.sortBy as keyof TransportationRequest]
      let bValue: any = b[filters.sortBy as keyof TransportationRequest]
      
      // Handle date sorting
      if (filters.sortBy.includes('_at')) {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }
      
      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue?.toLowerCase() || ''
      }
      
      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1
      return 0
    })
    
    return filtered
  }, [requests, vehiclesByRequest, filters])

  // Generate status options with counts
  const statusOptions = useMemo(() => {
    const statusCounts: Record<string, number> = {}
    requests.forEach(request => {
      statusCounts[request.status] = (statusCounts[request.status] || 0) + 1
    })
    
    return [
      { value: 'pending', label: 'Pending', count: statusCounts.pending || 0 },
      { value: 'quoted', label: 'Quoted', count: statusCounts.quoted || 0 },
      { value: 'accepted', label: 'Accepted', count: statusCounts.accepted || 0 },
      { value: 'in_progress', label: 'In Progress', count: statusCounts.in_progress || 0 },
      { value: 'completed', label: 'Completed', count: statusCounts.completed || 0 },
      { value: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled || 0 }
    ]
  }, [requests])

  // Generate assignment options with counts
  const assignmentOptions = useMemo(() => {
    const assignedCount = requests.filter(r => r.assigned_admin_id).length
    const unassignedCount = requests.filter(r => !r.assigned_admin_id).length
    
    return [
      { value: 'assigned', label: 'Assigned', count: assignedCount },
      { value: 'unassigned', label: 'Unassigned', count: unassignedCount }
    ]
  }, [requests])

  const getAdminName = useCallback((adminId: string) => {
    const admin = adminProfiles[adminId]
    return admin?.full_name || admin?.email || 'Unknown Admin'
  }, [adminProfiles])

  // Prepare export data
  const exportData: ExportData[] = useMemo(() => {
    return filteredAndSortedRequests.map(request => ({
      id: request.id,
      order_number: request.order_number,
      status: request.status,
      pickup_company_name: request.pickup_company_name,
      pickup_company_address: request.pickup_company_address,
      pickup_contact_name: request.pickup_contact_name,
      pickup_contact_phone: request.pickup_contact_phone,
      delivery_company_name: request.delivery_company_name,
      delivery_company_address: request.delivery_company_address,
      delivery_contact_name: request.delivery_contact_name,
      delivery_contact_phone: request.delivery_contact_phone,
      vin_number: request.vin_number,
      vehicle_make: request.vehicle_make,
      vehicle_model: request.vehicle_model,
      vehicle_year: request.vehicle_year,
      assigned_admin_id: request.assigned_admin_id,
      assigned_admin_name: request.assigned_admin_id ? getAdminName(request.assigned_admin_id) : undefined,
      created_at: request.created_at,
      notes: request.notes
    }))
  }, [filteredAndSortedRequests, adminProfiles, getAdminName])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleViewOrder = (order: TransportationRequest) => {
    console.log('🔍 Navigating to order details:', order.order_number)
    router.push(`/admin/orders/${order.id}`)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-admin-900">All Orders</h1>
          <p className="text-admin-600 mt-1">Manage and track all transportation requests</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="admin-secondary" 
            size="sm"
            onClick={() => setShowExportModal(true)}
          >
            <DocumentTextIcon className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-4">
        <Card variant="admin" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-admin-600">Total Orders</p>
              <p className="text-2xl font-bold text-admin-900">{requests.length}</p>
            </div>
            <div className="h-8 w-8 bg-admin-100 rounded-lg flex items-center justify-center">
              <TruckIcon className="h-4 w-4 text-admin-600" />
            </div>
          </div>
        </Card>
        
        <Card variant="admin" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-admin-600">Pending Orders</p>
              <p className="text-2xl font-bold text-warning-600">{requests.filter(r => r.status === 'pending').length}</p>
            </div>
            <div className="h-8 w-8 bg-warning-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="h-4 w-4 text-warning-600" />
            </div>
          </div>
        </Card>
        
        <Card variant="admin" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-admin-600">Completed Orders</p>
              <p className="text-2xl font-bold text-success-600">{requests.filter(r => r.status === 'completed').length}</p>
            </div>
            <div className="h-8 w-8 bg-success-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="h-4 w-4 text-success-600" />
            </div>
          </div>
        </Card>
        
        <Card variant="admin" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-admin-600">Unassigned</p>
              <p className="text-2xl font-bold text-red-600">{requests.filter(r => !r.assigned_admin_id).length}</p>
            </div>
            <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
              <FunnelIcon className="h-4 w-4 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        statusOptions={statusOptions}
        assignmentOptions={assignmentOptions}
        placeholder="Search orders, VIN, company names, or any field..."
        resultCount={filteredAndSortedRequests.length}
        totalCount={requests.length}
      />

      {/* Orders Table */}
      <Card variant="admin" className="overflow-hidden">
        {filteredAndSortedRequests.length === 0 ? (
          <div className="text-center py-12">
            <TruckIcon className="mx-auto h-12 w-12 text-admin-400" />
            <h3 className="text-lg font-medium text-admin-900 mb-2">No Orders Found</h3>
            <p className="text-admin-600">
              {filters.search || filters.status.length > 0 || filters.assignment || filters.dateRange
                ? 'Try adjusting your search criteria'
                : 'No orders have been submitted yet'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-admin-200 bg-admin-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-admin-700 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-admin-700 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-admin-700 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-admin-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-admin-700 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-admin-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-admin-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-100">
                  {filteredAndSortedRequests.map((request, index) => (
                    <tr key={request.id} className="hover:bg-admin-50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-admin-900">
                        {request.order_number}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-start space-x-2">
                          <MapPinIcon className="h-4 w-4 text-admin-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-admin-900">{request.pickup_company_name}</div>
                            <div className="text-xs text-admin-500">to {request.delivery_company_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {(() => {
                          const requestVehicles = vehiclesByRequest[request.id] || []
                          
                          if (requestVehicles.length === 0) {
                            return (
                              <div>
                                <div className="font-mono text-sm font-medium text-admin-900">{request.vin_number}</div>
                                {(request.vehicle_make || request.vehicle_model || request.vehicle_year) && (
                                  <div className="text-xs text-admin-500">
                                    {[request.vehicle_year, request.vehicle_make, request.vehicle_model]
                                      .filter(Boolean)
                                      .join(' ')}
                                  </div>
                                )}
                              </div>
                            )
                          }
                          
                          if (requestVehicles.length === 1) {
                            const vehicle = requestVehicles[0]
                            return (
                              <div>
                                <div className="font-mono text-sm font-medium text-admin-900">{vehicle.vin_number}</div>
                                {(vehicle.vehicle_make || vehicle.vehicle_model || vehicle.vehicle_year) && (
                                  <div className="text-xs text-admin-500">
                                    {[vehicle.vehicle_year, vehicle.vehicle_make, vehicle.vehicle_model]
                                      .filter(Boolean)
                                      .join(' ')}
                                  </div>
                                )}
                              </div>
                            )
                          }
                          
                          const firstVehicle = requestVehicles[0]
                          return (
                            <div>
                              <div className="flex items-center space-x-1 mb-1">
                                <TruckIcon className="h-3 w-3 text-admin-400" />
                                <span className="text-sm font-medium text-admin-900">{requestVehicles.length} vehicles</span>
                              </div>
                              <div className="font-mono text-xs text-admin-600">{firstVehicle.vin_number}</div>
                              {requestVehicles.length > 1 && (
                                <div className="text-xs text-admin-500">+{requestVehicles.length - 1} more</div>
                              )}
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <Badge 
                          variant={request.status === 'pending' ? 'pending' : 
                                  request.status === 'quoted' ? 'quoted' :
                                  request.status === 'accepted' ? 'accepted' :
                                  request.status === 'completed' ? 'completed' :
                                  request.status === 'cancelled' ? 'cancelled' : 'admin'}
                          size="sm"
                        >
                          {request.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className={request.assigned_admin_id ? 'font-medium text-admin-900' : 'text-admin-500'}>
                          {request.assigned_admin_id ? getAdminName(request.assigned_admin_id) : 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-admin-600">
                        {formatDate(request.created_at)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Button 
                          variant="admin-secondary"
                          size="sm"
                          onClick={() => handleViewOrder(request)}
                          icon={<EyeIcon className="h-4 w-4" />}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Footer */}
            <div className="bg-admin-50 px-6 py-3 border-t border-admin-200">
              <div className="flex justify-between items-center text-sm text-admin-600">
                <span>Showing {filteredAndSortedRequests.length} of {requests.length} orders</span>
                <div className="flex items-center space-x-4">
                  <span>Page 1 of 1</span>
                  <div className="flex space-x-1">
                    <Button variant="admin-secondary" size="sm" disabled>Previous</Button>
                    <Button variant="admin-secondary" size="sm" disabled>Next</Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Export Modal */}
      <DataExport
        data={exportData}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        filename={`orders_export_${new Date().toISOString().split('T')[0]}`}
        title="Export Orders Data"
      />
    </div>
  )
}