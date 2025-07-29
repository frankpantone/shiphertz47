'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { 
  TruckIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  CalendarIcon,
  CogIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline'
import { useRawAuth } from '@/hooks/useRawAuth'
import { Card, Badge, Button } from '@/components/ui'
import { supabase } from '@/lib/supabase'

interface FleetVehicle {
  id: string
  transportation_request_id: string
  vin_number: string
  vehicle_make: string
  vehicle_model: string
  vehicle_year: number | null
  vehicle_type: string
  vehicle_trim: string
  vehicle_engine: string
  nhtsa_data: any
  created_at: string
  // Joined data
  order_number?: string
  customer_name?: string
  pickup_address?: string
  delivery_address?: string
  order_status?: string
}

interface VehicleStats {
  totalVehicles: number
  inTransit: number
  delivered: number
  pending: number
  mostCommonMake: string
  avgYear: number
  newestVehicle: string
  oldestVehicle: string
}

export default function AdminFleetPage() {
  const router = useRouter()
  const { user, profile, loading, adminAccess, redirectToLogin, redirectToDashboard } = useRawAuth()
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<FleetVehicle[]>([])
  const [stats, setStats] = useState<VehicleStats>({
    totalVehicles: 0,
    inTransit: 0,
    delivered: 0,
    pending: 0,
    mostCommonMake: '',
    avgYear: 0,
    newestVehicle: '',
    oldestVehicle: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'created_at' | 'vehicle_year' | 'vehicle_make' | 'customer_name'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterMake, setFilterMake] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterYear, setFilterYear] = useState<string>('all')
  const [vehiclesLoading, setVehiclesLoading] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicle | null>(null)

  useEffect(() => {
    console.log('🔍 Admin access check:', adminAccess, {
      user: !!user,
      profile: !!profile,
      role: profile?.role
    })

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
      fetchVehicles()
    }
  }, [adminAccess, redirectToLogin, redirectToDashboard])

  const fetchVehicles = async () => {
    try {
      setVehiclesLoading(true)
      console.log('🔍 Fetching fleet vehicles...')

      // Get vehicles with joined transportation request data
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select(`
          *,
          transportation_requests!inner(
            order_number,
            status,
            pickup_company_address,
            delivery_company_address,
            profiles!inner(
              full_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (vehiclesError) {
        console.error('❌ Error fetching vehicles:', vehiclesError)
        toast.error('Failed to load fleet vehicles')
        return
      }

      // Transform the data to flatten the joined fields
      const transformedVehicles = (vehiclesData || []).map((vehicle: any) => ({
        ...vehicle,
        order_number: vehicle.transportation_requests?.order_number,
        customer_name: vehicle.transportation_requests?.profiles?.full_name || vehicle.transportation_requests?.profiles?.email,
        pickup_address: vehicle.transportation_requests?.pickup_company_address,
        delivery_address: vehicle.transportation_requests?.delivery_company_address,
        order_status: vehicle.transportation_requests?.status
      }))

      setVehicles(transformedVehicles)
      setFilteredVehicles(transformedVehicles)
      
      // Calculate stats
      calculateStats(transformedVehicles)
      
      console.log('✅ Fleet vehicles loaded:', transformedVehicles.length)
    } catch (error) {
      console.error('💥 Error in fetchVehicles:', error)
      toast.error('Failed to load fleet vehicles')
    } finally {
      setVehiclesLoading(false)
    }
  }

  const calculateStats = (vehicleList: FleetVehicle[]) => {
    const totalVehicles = vehicleList.length
    const inTransit = vehicleList.filter(v => v.order_status === 'in_progress').length
    const delivered = vehicleList.filter(v => v.order_status === 'completed').length
    const pending = vehicleList.filter(v => v.order_status === 'pending').length

    // Find most common make
    const makeCounts = vehicleList.reduce((acc, v) => {
      const make = v.vehicle_make || 'Unknown'
      acc[make] = (acc[make] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const mostCommonMake = Object.entries(makeCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'

    // Calculate average year
    const validYears = vehicleList.filter(v => v.vehicle_year && v.vehicle_year > 1900)
    const avgYear = validYears.length > 0 ? 
      Math.round(validYears.reduce((sum, v) => sum + (v.vehicle_year || 0), 0) / validYears.length) : 0

    // Find newest and oldest vehicles
    const sortedByYear = validYears.sort((a, b) => (b.vehicle_year || 0) - (a.vehicle_year || 0))
    const newestVehicle = sortedByYear[0] ? `${sortedByYear[0].vehicle_year} ${sortedByYear[0].vehicle_make} ${sortedByYear[0].vehicle_model}` : 'N/A'
    const oldestVehicle = sortedByYear[sortedByYear.length - 1] ? 
      `${sortedByYear[sortedByYear.length - 1].vehicle_year} ${sortedByYear[sortedByYear.length - 1].vehicle_make} ${sortedByYear[sortedByYear.length - 1].vehicle_model}` : 'N/A'

    setStats({
      totalVehicles,
      inTransit,
      delivered,
      pending,
      mostCommonMake,
      avgYear,
      newestVehicle,
      oldestVehicle
    })
  }

  // Filter and search vehicles
  useEffect(() => {
    let filtered = [...vehicles]

    // Apply make filter
    if (filterMake !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.vehicle_make === filterMake)
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.order_status === filterStatus)
    }

    // Apply year filter
    if (filterYear !== 'all') {
      const year = parseInt(filterYear)
      filtered = filtered.filter(vehicle => vehicle.vehicle_year === year)
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(vehicle =>
        vehicle.vin_number?.toLowerCase().includes(search) ||
        vehicle.vehicle_make?.toLowerCase().includes(search) ||
        vehicle.vehicle_model?.toLowerCase().includes(search) ||
        vehicle.customer_name?.toLowerCase().includes(search) ||
        vehicle.order_number?.toLowerCase().includes(search)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'vehicle_make':
          aValue = a.vehicle_make || ''
          bValue = b.vehicle_make || ''
          break
        case 'vehicle_year':
          aValue = a.vehicle_year || 0
          bValue = b.vehicle_year || 0
          break
        case 'customer_name':
          aValue = a.customer_name || ''
          bValue = b.customer_name || ''
          break
        case 'created_at':
        default:
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredVehicles(filtered)
  }, [vehicles, searchTerm, sortBy, sortOrder, filterMake, filterStatus, filterYear])

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'in_progress':
        return <TruckIcon className="h-4 w-4" />
      case 'pending':
        return <ClockIcon className="h-4 w-4" />
      default:
        return <ExclamationTriangleIcon className="h-4 w-4" />
    }
  }

  // Get unique makes and years for filters
  const uniqueMakes = Array.from(new Set(vehicles.map(v => v.vehicle_make).filter(Boolean))).sort()
  const uniqueYears = Array.from(new Set(vehicles.map(v => v.vehicle_year).filter(Boolean))).sort((a, b) => (b as number) - (a as number))

  // Show loading while checking authentication
  if (adminAccess === 'loading' || vehiclesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        <div className="ml-4">
          <p className="text-gray-600">
            {adminAccess === 'loading' ? 'Checking authentication...' : 'Loading fleet data...'}
          </p>
        </div>
      </div>
    )
  }

  // Don't render anything if not admin
  if (adminAccess !== 'admin') {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-admin-900 mb-2">
            Fleet Management
          </h1>
          <p className="text-admin-600">
            Monitor and manage vehicles being transported through the platform.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="admin-secondary" size="sm">
            <FunnelIcon className="h-4 w-4" />
            Export Fleet Data
          </Button>
          <Button variant="admin-primary">
            <PlusIcon className="h-4 w-4" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-admin-600 mb-1">Total Vehicles</p>
              <p className="text-3xl font-bold text-admin-900">{stats.totalVehicles}</p>
              <p className="text-sm text-admin-500 mt-1">In system</p>
            </div>
            <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <TruckIcon className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-admin-600 mb-1">In Transit</p>
              <p className="text-3xl font-bold text-admin-900">{stats.inTransit}</p>
              <p className="text-sm text-admin-500 mt-1">Currently moving</p>
            </div>
            <div className="h-12 w-12 bg-warning-100 rounded-xl flex items-center justify-center">
              <TruckIcon className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-admin-600 mb-1">Delivered</p>
              <p className="text-3xl font-bold text-admin-900">{stats.delivered}</p>
              <p className="text-sm text-admin-500 mt-1">Successfully completed</p>
            </div>
            <div className="h-12 w-12 bg-success-100 rounded-xl flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </Card>

        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-admin-600 mb-1">Avg. Year</p>
              <p className="text-3xl font-bold text-admin-900">{stats.avgYear || 'N/A'}</p>
              <p className="text-sm text-admin-500 mt-1">Fleet average</p>
            </div>
            <div className="h-12 w-12 bg-trust-100 rounded-xl flex items-center justify-center">
              <CalendarIcon className="h-6 w-6 text-trust-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Fleet Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card variant="admin" className="p-6">
          <h3 className="text-lg font-semibold text-admin-900 mb-4">Fleet Insights</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-admin-600">Most Common Make</span>
              <span className="font-semibold text-admin-900">{stats.mostCommonMake}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-admin-600">Newest Vehicle</span>
              <span className="font-semibold text-admin-900 text-right text-xs">{stats.newestVehicle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-admin-600">Oldest Vehicle</span>
              <span className="font-semibold text-admin-900 text-right text-xs">{stats.oldestVehicle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-admin-600">Pending Pickup</span>
              <span className="font-semibold text-warning-600">{stats.pending}</span>
            </div>
          </div>
        </Card>

        <Card variant="admin" className="p-6">
          <h3 className="text-lg font-semibold text-admin-900 mb-4">Fleet Status Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-success-500 rounded-full mr-2"></div>
                <span className="text-sm text-admin-600">Delivered</span>
              </div>
              <span className="font-semibold text-admin-900">{stats.delivered}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-warning-500 rounded-full mr-2"></div>
                <span className="text-sm text-admin-600">In Transit</span>
              </div>
              <span className="font-semibold text-admin-900">{stats.inTransit}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                <span className="text-sm text-admin-600">Pending</span>
              </div>
              <span className="font-semibold text-admin-900">{stats.pending}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card variant="admin" className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-admin-400" />
              <input
                type="text"
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Make Filter */}
            <select
              value={filterMake}
              onChange={(e) => setFilterMake(e.target.value)}
              className="px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="all">All Makes</option>
              {uniqueMakes.map(make => (
                <option key={make} value={make}>{make}</option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="all">All Years</option>
              {uniqueYears.map(year => (
                <option key={year} value={year || ''}>{year}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Transit</option>
              <option value="completed">Delivered</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-admin-600">
            <span>Showing {filteredVehicles.length} of {vehicles.length} vehicles</span>
          </div>
        </div>
      </Card>

      {/* Vehicles Table */}
      <Card variant="admin" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-admin-50 border-b border-admin-200">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-admin-700 text-sm">
                  Vehicle Details
                </th>
                <th className="text-left py-4 px-6 font-medium text-admin-700 text-sm">
                  <button
                    onClick={() => handleSort('customer_name')}
                    className="flex items-center space-x-1 hover:text-admin-900"
                  >
                    <span>Customer & Order</span>
                    <ArrowsUpDownIcon className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left py-4 px-6 font-medium text-admin-700 text-sm">Route</th>
                <th className="text-left py-4 px-6 font-medium text-admin-700 text-sm">Status</th>
                <th className="text-left py-4 px-6 font-medium text-admin-700 text-sm">
                  <button
                    onClick={() => handleSort('created_at')}
                    className="flex items-center space-x-1 hover:text-admin-900"
                  >
                    <span>Added</span>
                    <ArrowsUpDownIcon className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left py-4 px-6 font-medium text-admin-700 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-100">
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-admin-50">
                  <td className="py-4 px-6">
                    <div>
                      <p className="text-sm font-medium text-admin-900">
                        {vehicle.vehicle_year} {vehicle.vehicle_make} {vehicle.vehicle_model}
                      </p>
                      <div className="flex items-center mt-1">
                        <IdentificationIcon className="h-3 w-3 text-admin-400 mr-1" />
                        <span className="text-xs text-admin-500 font-mono">
                          {vehicle.vin_number}
                        </span>
                      </div>
                      {vehicle.vehicle_type && (
                        <p className="text-xs text-admin-500 mt-1">{vehicle.vehicle_type}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="text-sm font-medium text-admin-900">
                        {vehicle.customer_name}
                      </p>
                      <p className="text-xs text-admin-500">
                        Order: {vehicle.order_number}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-admin-600">
                        <MapPinIcon className="h-3 w-3 mr-1 text-green-500" />
                        <span className="truncate max-w-32">
                          {vehicle.pickup_address?.split(',')[0] || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-admin-600">
                        <MapPinIcon className="h-3 w-3 mr-1 text-red-500" />
                        <span className="truncate max-w-32">
                          {vehicle.delivery_address?.split(',')[0] || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(vehicle.order_status || '')}
                      <Badge 
                        variant={
                          vehicle.order_status === 'completed' ? 'success' :
                          vehicle.order_status === 'in_progress' ? 'quoted' :
                          'pending'
                        } 
                        size="sm"
                      >
                        {vehicle.order_status?.replace('_', ' ') || 'Unknown'}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-admin-600">
                      {formatDate(vehicle.created_at)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="admin-secondary"
                        size="sm"
                        onClick={() => router.push(`/admin/fleet/${vehicle.id}`)}
                      >
                        <EyeIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="admin-secondary"
                        size="sm"
                        onClick={() => setSelectedVehicle(vehicle)}
                      >
                        <PencilIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredVehicles.length === 0 && (
            <div className="text-center py-12">
              <TruckIcon className="h-12 w-12 text-admin-300 mx-auto mb-4" />
              <p className="text-admin-500">No vehicles found matching your criteria.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}