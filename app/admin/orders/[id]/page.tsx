'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  TruckIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  UserPlusIcon,
  UserCircleIcon,
  PaperClipIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftEllipsisIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  PencilIcon,
  ChevronRightIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { useRawAuth } from '@/hooks/useRawAuth'
import { getRawRequests, getRawProfile, updateRawRequest, rawCreateQuote } from '@/lib/auth-raw'
import { supabase } from '@/lib/supabase'
import { Card, Button, Badge } from '@/components/ui'

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
  updated_at: string
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
  vehicle_trim?: string
  vehicle_engine?: string
  nhtsa_data?: any
  created_at?: string
  updated_at?: string
}

interface AdminProfile {
  id: string
  email: string
  full_name?: string
  role: string
}

interface Quote {
  id: string
  transportation_request_id: string
  total_amount: number
  estimated_pickup_date?: string
  estimated_delivery_date?: string
  is_active: boolean
  created_at: string
}

const statusConfig: Record<string, {
  label: string
  color: 'pending' | 'quoted' | 'accepted' | 'completed' | 'cancelled' | 'admin' | 'success' | 'warning' | 'danger'
  icon: any
  description: string
  nextActions: string[]
}> = {
  pending: { 
    label: 'Pending Review', 
    color: 'warning', 
    icon: ClockIcon,
    description: 'Awaiting initial review and assignment',
    nextActions: ['Assign Admin', 'Create Quote', 'Request Info']
  },
  quoted: { 
    label: 'Quote Sent', 
    color: 'quoted', 
    icon: CurrencyDollarIcon,
    description: 'Quote provided, awaiting customer response',
    nextActions: ['Follow Up', 'Revise Quote', 'Mark Lost']
  },
  accepted: { 
    label: 'Quote Accepted', 
    color: 'accepted', 
    icon: CheckCircleIcon,
    description: 'Customer accepted quote, ready for pickup',
    nextActions: ['Schedule Pickup', 'Assign Carrier', 'Update Status']
  },
  in_progress: { 
    label: 'In Transit', 
    color: 'admin', 
    icon: TruckIcon,
    description: 'Vehicle picked up and in transit',
    nextActions: ['Update Location', 'Contact Carrier', 'Notify Customer']
  },
  completed: { 
    label: 'Completed', 
    color: 'completed', 
    icon: CheckCircleIcon,
    description: 'Vehicle delivered successfully',
    nextActions: ['Request Feedback', 'Close Order', 'Generate Invoice']
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'cancelled', 
    icon: ExclamationTriangleIcon,
    description: 'Order cancelled by customer or admin',
    nextActions: ['Archive', 'Contact Customer', 'Review Reason']
  }
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  
  console.log('🔍 OrderDetailPage rendering, orderId:', orderId)
  
  const { user, profile, adminAccess, redirectToLogin, redirectToDashboard } = useRawAuth()
  
  console.log('🔍 Auth state:', { 
    hasUser: !!user, 
    hasProfile: !!profile, 
    adminAccess 
  })
  
  const [order, setOrder] = useState<TransportationRequest | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [quote, setQuote] = useState<Quote | null>(null)
  const [assignedAdmin, setAssignedAdmin] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [updating, setUpdating] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [availableAdmins, setAvailableAdmins] = useState<AdminProfile[]>([])
  const [documents, setDocuments] = useState<any[]>([])

  useEffect(() => {
    if (adminAccess === 'not-authenticated') {
      redirectToLogin()
      return
    }
    
    if (adminAccess === 'not-admin') {
      redirectToDashboard()
      return
    }
    
    if (adminAccess === 'admin') {
      fetchOrderDetails()
    }
  }, [adminAccess, orderId])

  const fetchOrderDetails = async () => {
    try {
      console.log('🔍 fetchOrderDetails started for orderId:', orderId)
      setLoading(true)
      setError(null) // Clear any previous errors
      
      // Check if supabase is available
      if (!supabase) {
        console.error('❌ Supabase not available')
        setError('Database connection not available')
        return
      }
      
      // Fetch main order data
      const requests = await getRawRequests()
      const orderData = requests.find(r => r.id === orderId)
      
      if (!orderData) {
        setError('Order not found')
        return
      }
      
      setOrder(orderData)

      // Fetch vehicles
      const { data: vehicleData } = await supabase
        ?.from('vehicles')
        ?.select('*')
        ?.eq('transportation_request_id', orderId)
        ?.order('created_at', { ascending: true }) || { data: null }
      
      setVehicles(vehicleData || [])

      // Fetch quote
      const { data: quoteData } = await supabase
        ?.from('quotes')
        ?.select('*')
        ?.eq('transportation_request_id', orderId)
        ?.eq('is_active', true)
        ?.order('created_at', { ascending: false })
        ?.limit(1)
        ?.single() || { data: null }
      
      if (quoteData) {
        setQuote(quoteData)
      }

      // Fetch assigned admin
      if (orderData.assigned_admin_id) {
        const adminProfile = await getRawProfile(orderData.assigned_admin_id)
        setAssignedAdmin(adminProfile)
      }

      // Fetch available admins for assignment
      const { data: adminsData } = await supabase
        ?.from('profiles')
        ?.select('*')
        ?.eq('role', 'admin')
        ?.order('full_name', { ascending: true }) || { data: null }
      
      setAvailableAdmins(adminsData || [])

      // Fetch documents
      const { data: documentsData } = await supabase
        ?.from('document_attachments')
        ?.select('*')
        ?.eq('transportation_request_id', orderId)
        ?.order('created_at', { ascending: false }) || { data: null }
      
      setDocuments(documentsData || [])
      
    } catch (error) {
      console.error('❌ Error fetching order details:', error)
      setError('Failed to load order details')
    } finally {
      console.log('✅ fetchOrderDetails completed')
      setLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return
    
    try {
      setUpdating(true)
      await updateRawRequest(order.id, { status: newStatus })
      setOrder({ ...order, status: newStatus })
      toast.success(`Order status updated to ${newStatus.replace('_', ' ')}`)
    } catch (error) {
      toast.error('Failed to update order status')
    } finally {
      setUpdating(false)
    }
  }

  const assignAdmin = async (adminId: string) => {
    if (!order) return
    
    try {
      setUpdating(true)
      await updateRawRequest(order.id, { assigned_admin_id: adminId })
      
      const adminProfile = await getRawProfile(adminId)
      setAssignedAdmin(adminProfile)
      setOrder({ ...order, assigned_admin_id: adminId })
      setShowAssignModal(false)
      
      toast.success(`Order assigned to ${adminProfile?.full_name || adminProfile?.email}`)
    } catch (error) {
      toast.error('Failed to assign admin')
    } finally {
      setUpdating(false)
    }
  }

  const createQuote = async (quoteData: { total_amount: number; estimated_pickup_date?: string; estimated_delivery_date?: string }) => {
    console.log('🔍 createQuote called with:', quoteData)
    
    if (!order) {
      console.error('❌ No order available for quote creation')
      toast.error('Order not found')
      return
    }
    
    if (!supabase) {
      console.error('❌ Supabase not available for quote creation')
      toast.error('Database connection not available')
      return
    }

    if (!user?.id) {
      console.error('❌ Admin user not available for quote creation')
      toast.error('Admin authentication required')
      return
    }
    
    // Validate input data
    if (!quoteData.total_amount || isNaN(quoteData.total_amount) || quoteData.total_amount <= 0) {
      console.error('❌ Invalid quote amount:', quoteData.total_amount)
      toast.error('Please enter a valid quote amount')
      return
    }
    
    try {
      setUpdating(true)
      console.log('🔍 Creating quote for order:', order.id)
      
      const insertData = {
        transportation_request_id: order.id,
        admin_id: user.id, // Add the current admin user ID
        base_price: quoteData.total_amount, // Use total_amount as base_price for now
        fuel_surcharge: 0, // Default to 0
        additional_fees: 0, // Default to 0
        total_amount: quoteData.total_amount,
        estimated_pickup_date: quoteData.estimated_pickup_date || null,
        estimated_delivery_date: quoteData.estimated_delivery_date || null,
        is_active: true
      }
      
      console.log('🔍 Insert data:', insertData)
      
      // Create quote using raw authentication
      const result = await rawCreateQuote(insertData)
      
      if (!result.success) {
        console.error('❌ Raw quote creation error:', result.error)
        throw new Error(result.error || 'Failed to create quote')
      }
      
      console.log('✅ Quote created successfully:', result.data)
      const data = result.data
      
      setQuote(data)
      setShowQuoteModal(false)
      
      // Update order status to quoted
      await updateOrderStatus('quoted')
      
      toast.success('Quote created successfully')
    } catch (error: any) {
      console.error('❌ Quote creation failed:', error)
      toast.error(`Failed to create quote: ${error.message || 'Unknown error'}`)
    } finally {
      setUpdating(false)
    }
  }

  const handleViewDocument = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.storage_path, 3600) // 1 hour expiry
      
      if (error) {
        console.error('❌ Error creating signed URL:', error)
        toast.error('Failed to generate view URL for document')
        return
      }
      
      if (data.signedUrl) {
        window.open(data.signedUrl, '_blank')
      } else {
        toast.error('Unable to generate view URL for document')
      }
    } catch (error) {
      console.error('❌ Error viewing document:', error)
      toast.error('Failed to view document')
    }
  }

  const handleDownloadDocument = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.storage_path)
      
      if (error) {
        console.error('❌ Error downloading document:', error)
        toast.error('Failed to download document')
        return
      }

      // Create blob URL and trigger download
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Document downloaded successfully')
    } catch (error) {
      console.error('❌ Error downloading document:', error)
      toast.error('Failed to download document')
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: InformationCircleIcon },
    { id: 'vehicles', name: 'Vehicles', icon: TruckIcon, count: vehicles.length },
    { id: 'quote', name: 'Pricing', icon: CurrencyDollarIcon },
    { id: 'documents', name: 'Documents', icon: DocumentTextIcon, count: documents.length },
    { id: 'activity', name: 'Activity', icon: ClockIcon }
  ]

  if (adminAccess === 'loading') {
    return (
      <div className="min-h-screen bg-admin-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-admin-600 mx-auto"></div>
          <p className="mt-4 text-admin-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (adminAccess !== 'admin') {
    return (
      <div className="min-h-screen bg-admin-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-admin-600">Access denied. Redirecting...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-admin-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-admin-600 mx-auto"></div>
          <p className="mt-4 text-admin-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-admin-50">
        <div className="max-w-7xl mx-auto py-12 px-6">
          <Card className="text-center py-12">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-admin-900 mb-2">Order Not Found</h3>
            <p className="text-admin-600 mb-6">{error || 'The requested order could not be found.'}</p>
            <Button onClick={() => router.push('/admin/orders/all')}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to All Orders
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const currentStatus = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = currentStatus.icon

  console.log('🔍 About to render, state:', {
    order: !!order,
    loading,
    error,
    adminAccess,
    currentStatus: currentStatus.label
  })

  return (
    <>
    <div className="min-h-screen bg-admin-50">
      <div className="max-w-7xl mx-auto py-6 px-6">
        {/* Header Section */}
        <div className="mb-8">
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm text-admin-600 mb-4">
            <Link href="/admin/orders/all" className="hover:text-admin-900 transition-colors">
              Orders
            </Link>
            <ChevronRightIcon className="h-4 w-4 mx-2" />
            <span className="text-admin-900 font-medium">{order.order_number}</span>
          </nav>

          {/* Main Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-xl ${currentStatus.color === 'warning' ? 'bg-warning-100' : 
                currentStatus.color === 'quoted' ? 'bg-trust-100' :
                currentStatus.color === 'accepted' ? 'bg-primary-100' :
                currentStatus.color === 'admin' ? 'bg-admin-100' :
                currentStatus.color === 'completed' ? 'bg-success-100' :
                currentStatus.color === 'cancelled' ? 'bg-red-100' : 'bg-admin-100'}`}>
                <StatusIcon className={`h-8 w-8 ${currentStatus.color === 'warning' ? 'text-warning-600' :
                currentStatus.color === 'quoted' ? 'text-trust-600' :
                currentStatus.color === 'accepted' ? 'text-primary-600' :
                currentStatus.color === 'admin' ? 'text-admin-600' :
                currentStatus.color === 'completed' ? 'text-success-600' :
                currentStatus.color === 'cancelled' ? 'text-red-600' : 'text-admin-600'}`} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-admin-900 mb-1">
                  {order.order_number}
                </h1>
                <p className="text-admin-600 mb-2">{currentStatus.description}</p>
                <div className="flex items-center space-x-4 text-sm text-admin-500">
                  <span>Created {formatDate(order.created_at)}</span>
                  <span>•</span>
                  <span>Updated {formatDate(order.updated_at)}</span>
                  {assignedAdmin && (
                    <>
                      <span>•</span>
                      <span>Assigned to {assignedAdmin.full_name || assignedAdmin.email}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant={currentStatus.color} size="lg">
                {currentStatus.label}
              </Badge>
              <Button variant="admin-secondary" size="sm">
                <PencilIcon className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <Card className="mb-6 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-admin-900 mb-1">Quick Actions</h3>
              <p className="text-sm text-admin-600">Common actions for {currentStatus.label.toLowerCase()} orders</p>
            </div>
            <div className="flex items-center space-x-2">
              {currentStatus.nextActions.map((action) => (
                <Button 
                  key={action}
                  variant="admin-secondary" 
                  size="sm"
                  onClick={() => {
                    if (action === 'Assign Admin') {
                      setShowAssignModal(true)
                    } else if (action === 'Create Quote') {
                      setShowQuoteModal(true)
                    } else if (action === 'Schedule Pickup') {
                      updateOrderStatus('in_progress')
                    } else if (action === 'Mark Lost') {
                      updateOrderStatus('cancelled')
                    } else if (action === 'Close Order') {
                      updateOrderStatus('completed')
                    }
                  }}
                  loading={updating}
                >
                  {action}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs Navigation */}
            <div className="border-b border-admin-200 mb-6">
              <nav className="flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                        ${activeTab === tab.id
                          ? 'border-admin-600 text-admin-600'
                          : 'border-transparent text-admin-500 hover:text-admin-700 hover:border-admin-300'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5 mr-2" />
                      {tab.name}
                      {tab.count !== undefined && (
                        <span className="ml-2 bg-admin-100 text-admin-600 py-0.5 px-2 rounded-full text-xs">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Route Information */}
                <Card variant="admin">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-admin-900 mb-6">Transportation Route</h3>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Pickup */}
                      <div className="relative">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                              <MapPinIcon className="h-5 w-5 text-success-600" />
                            </div>
                          </div>
                          <div className="ml-4 flex-1">
                            <h4 className="text-sm font-medium text-admin-900 mb-1">Pickup Location</h4>
                            <div className="space-y-1">
                              <p className="font-medium text-admin-900">{order.pickup_company_name}</p>
                              <p className="text-sm text-admin-600">{order.pickup_company_address}</p>
                              <div className="flex items-center space-x-4 mt-2">
                                <div className="flex items-center text-sm text-admin-600">
                                  <UserIcon className="h-4 w-4 mr-1" />
                                  {order.pickup_contact_name}
                                </div>
                                <div className="flex items-center text-sm text-admin-600">
                                  <PhoneIcon className="h-4 w-4 mr-1" />
                                  {order.pickup_contact_phone}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delivery */}
                      <div className="relative">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <MapPinIcon className="h-5 w-5 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4 flex-1">
                            <h4 className="text-sm font-medium text-admin-900 mb-1">Delivery Location</h4>
                            <div className="space-y-1">
                              <p className="font-medium text-admin-900">{order.delivery_company_name}</p>
                              <p className="text-sm text-admin-600">{order.delivery_company_address}</p>
                              <div className="flex items-center space-x-4 mt-2">
                                <div className="flex items-center text-sm text-admin-600">
                                  <UserIcon className="h-4 w-4 mr-1" />
                                  {order.delivery_contact_name}
                                </div>
                                <div className="flex items-center text-sm text-admin-600">
                                  <PhoneIcon className="h-4 w-4 mr-1" />
                                  {order.delivery_contact_phone}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Vehicle Information */}
                <Card variant="admin">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-admin-900 mb-6">Vehicle Information</h3>
                    
                    {vehicles.length > 0 ? (
                      <div className="space-y-4">
                        {vehicles.map((vehicle, index) => (
                          <div key={vehicle.id} className="border border-admin-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4">
                                <div className="w-10 h-10 bg-trust-100 rounded-lg flex items-center justify-center">
                                  <TruckIcon className="h-5 w-5 text-trust-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-admin-900">
                                    {vehicle.vehicle_year} {vehicle.vehicle_make} {vehicle.vehicle_model}
                                  </h4>
                                  <p className="text-sm text-admin-600 font-mono">VIN: {vehicle.vin_number}</p>
                                  {vehicle.vehicle_type && (
                                    <p className="text-sm text-admin-600">Type: {vehicle.vehicle_type}</p>
                                  )}
                                </div>
                              </div>
                              <Button variant="admin-secondary" size="sm">
                                <EyeIcon className="h-4 w-4" />
                                View Details
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-admin-200 rounded-lg p-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-trust-100 rounded-lg flex items-center justify-center">
                            <TruckIcon className="h-5 w-5 text-trust-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-admin-900">
                              {order.vehicle_year} {order.vehicle_make} {order.vehicle_model}
                            </h4>
                            <p className="text-sm text-admin-600 font-mono">VIN: {order.vin_number}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Notes */}
                {order.notes && (
                  <Card variant="admin">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-admin-900 mb-4">Special Instructions</h3>
                      <div className="bg-admin-50 rounded-lg p-4">
                        <p className="text-admin-700">{order.notes}</p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'vehicles' && (
              <Card variant="admin">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-admin-900 mb-6">Vehicle Details</h3>
                  
                  {vehicles.length > 0 ? (
                    <div className="space-y-6">
                      {vehicles.map((vehicle, index) => (
                        <div key={vehicle.id} className="border border-admin-200 rounded-lg p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 bg-trust-100 rounded-lg flex items-center justify-center">
                                <TruckIcon className="h-6 w-6 text-trust-600" />
                              </div>
                              <div>
                                <h4 className="text-xl font-semibold text-admin-900">
                                  {vehicle.vehicle_year} {vehicle.vehicle_make} {vehicle.vehicle_model}
                                </h4>
                                <p className="text-admin-600 mt-1">Vehicle #{index + 1}</p>
                              </div>
                            </div>
                            <Badge variant="admin" size="sm">
                              {vehicle.vehicle_type || 'Unknown Type'}
                            </Badge>
                          </div>
                          
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                              <h5 className="text-sm font-medium text-admin-900 mb-2">Vehicle Identification</h5>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs text-admin-600 uppercase tracking-wide">VIN Number</p>
                                  <p className="font-mono text-sm text-admin-900 bg-admin-50 px-2 py-1 rounded">{vehicle.vin_number}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-admin-600 uppercase tracking-wide">Make & Model</p>
                                  <p className="text-sm text-admin-900">{vehicle.vehicle_make} {vehicle.vehicle_model}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-admin-600 uppercase tracking-wide">Year</p>
                                  <p className="text-sm text-admin-900">{vehicle.vehicle_year || 'Unknown'}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h5 className="text-sm font-medium text-admin-900 mb-2">Vehicle Specifications</h5>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs text-admin-600 uppercase tracking-wide">Type</p>
                                  <p className="text-sm text-admin-900">{vehicle.vehicle_type || 'Not specified'}</p>
                                </div>
                                {vehicle.vehicle_trim && (
                                  <div>
                                    <p className="text-xs text-admin-600 uppercase tracking-wide">Trim</p>
                                    <p className="text-sm text-admin-900">{vehicle.vehicle_trim}</p>
                                  </div>
                                )}
                                {vehicle.vehicle_engine && (
                                  <div>
                                    <p className="text-xs text-admin-600 uppercase tracking-wide">Engine</p>
                                    <p className="text-sm text-admin-900">{vehicle.vehicle_engine}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <h5 className="text-sm font-medium text-admin-900 mb-2">Record Information</h5>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs text-admin-600 uppercase tracking-wide">Added to Order</p>
                                  <p className="text-sm text-admin-900">{formatDate(vehicle.created_at || new Date().toISOString())}</p>
                                </div>
                                {vehicle.updated_at && vehicle.updated_at !== vehicle.created_at && (
                                  <div>
                                    <p className="text-xs text-admin-600 uppercase tracking-wide">Last Updated</p>
                                    <p className="text-sm text-admin-900">{formatDate(vehicle.updated_at)}</p>
                                  </div>
                                )}
                                {vehicle.nhtsa_data && (
                                  <div>
                                    <p className="text-xs text-admin-600 uppercase tracking-wide">NHTSA Data</p>
                                    <p className="text-sm text-success-600">✓ Available</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {vehicle.nhtsa_data && (
                            <div className="mt-6 pt-4 border-t border-admin-200">
                              <details className="group">
                                <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-admin-900 hover:text-admin-700">
                                  <span>NHTSA Vehicle Data</span>
                                  <ChevronRightIcon className="h-4 w-4 transform group-open:rotate-90 transition-transform" />
                                </summary>
                                <div className="mt-3 p-3 bg-admin-50 rounded-lg">
                                  <pre className="text-xs text-admin-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                                    {JSON.stringify(vehicle.nhtsa_data, null, 2)}
                                  </pre>
                                </div>
                              </details>
                            </div>
                          )}
                          
                          <div className="flex justify-end mt-4 pt-4 border-t border-admin-200">
                            <Button variant="admin-secondary" size="sm">
                              <PencilIcon className="h-4 w-4 mr-2" />
                              Edit Vehicle
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-admin-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-trust-100 rounded-lg flex items-center justify-center">
                            <TruckIcon className="h-6 w-6 text-trust-600" />
                          </div>
                          <div>
                            <h4 className="text-xl font-semibold text-admin-900">
                              {order.vehicle_year} {order.vehicle_make} {order.vehicle_model}
                            </h4>
                            <p className="text-admin-600 mt-1">Primary Vehicle (from original request)</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                          <h5 className="text-sm font-medium text-admin-900 mb-2">Vehicle Identification</h5>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-admin-600 uppercase tracking-wide">VIN Number</p>
                              <p className="font-mono text-sm text-admin-900 bg-admin-50 px-2 py-1 rounded">{order.vin_number}</p>
                            </div>
                            <div>
                              <p className="text-xs text-admin-600 uppercase tracking-wide">Make & Model</p>
                              <p className="text-sm text-admin-900">{order.vehicle_make} {order.vehicle_model}</p>
                            </div>
                            <div>
                              <p className="text-xs text-admin-600 uppercase tracking-wide">Year</p>
                              <p className="text-sm text-admin-900">{order.vehicle_year || 'Unknown'}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium text-admin-900 mb-2">Order Information</h5>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-admin-600 uppercase tracking-wide">Order Created</p>
                              <p className="text-sm text-admin-900">{formatDate(order.created_at)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-admin-600 uppercase tracking-wide">Last Updated</p>
                              <p className="text-sm text-admin-900">{formatDate(order.updated_at)}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium text-admin-900 mb-2">Status</h5>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-admin-600 uppercase tracking-wide">Current Status</p>
                              <Badge variant={currentStatus.color} size="sm">
                                {currentStatus.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-4 pt-4 border-t border-admin-200">
                        <Button variant="admin-secondary" size="sm">
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Edit Vehicle Details
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {activeTab === 'quote' && (
              <Card variant="admin">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-admin-900">Pricing & Quote</h3>
                    <Button 
                      variant="admin-primary" 
                      size="sm"
                      onClick={() => setShowQuoteModal(true)}
                    >
                      <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                      Create Quote
                    </Button>
                  </div>
                  
                  {quote ? (
                    <div className="space-y-4">
                      <div className="bg-admin-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-admin-900">
                              {formatCurrency(quote.total_amount)}
                            </p>
                            <p className="text-sm text-admin-600">
                              Quote created {formatDate(quote.created_at)}
                            </p>
                          </div>
                          <Badge variant={quote.is_active ? 'success' : 'admin'}>
                            {quote.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      
                      {quote.estimated_pickup_date && (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-admin-900">Estimated Pickup</p>
                            <p className="text-admin-600">{formatDate(quote.estimated_pickup_date)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-admin-900">Estimated Delivery</p>
                            <p className="text-admin-600">{formatDate(quote.estimated_delivery_date || '')}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CurrencyDollarIcon className="mx-auto h-12 w-12 text-admin-300 mb-4" />
                      <p className="text-admin-600">No quote created yet</p>
                      <Button 
                        variant="admin-primary" 
                        className="mt-4"
                        onClick={() => setShowQuoteModal(true)}
                      >
                        Create First Quote
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {activeTab === 'documents' && (
              <Card variant="admin">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-admin-900 mb-6">Documents & Attachments</h3>
                  
                  {documents.length > 0 ? (
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border border-admin-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <DocumentTextIcon className="h-8 w-8 text-admin-400" />
                            <div>
                              <p className="font-medium text-admin-900">{doc.file_name}</p>
                              <p className="text-sm text-admin-600">
                                {(doc.file_size / 1024 / 1024).toFixed(2)} MB • 
                                Uploaded {formatDate(doc.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="admin-secondary" 
                              size="sm"
                              onClick={() => handleViewDocument(doc)}
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="admin-secondary" 
                              size="sm"
                              onClick={() => handleDownloadDocument(doc)}
                            >
                              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DocumentTextIcon className="mx-auto h-12 w-12 text-admin-300 mb-4" />
                      <p className="text-admin-600">No documents uploaded yet</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {activeTab === 'activity' && (
              <Card variant="admin">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-admin-900 mb-6">Activity Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="h-4 w-4 text-success-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-admin-900">Order created</p>
                        <p className="text-sm text-admin-600">{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Status Card */}
            <Card variant="admin">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-admin-900 mb-4">Order Status</h3>
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${currentStatus.color === 'warning' ? 'bg-warning-100' : 
                    currentStatus.color === 'quoted' ? 'bg-trust-100' :
                    currentStatus.color === 'accepted' ? 'bg-primary-100' :
                    currentStatus.color === 'admin' ? 'bg-admin-100' :
                    currentStatus.color === 'completed' ? 'bg-success-100' :
                    currentStatus.color === 'cancelled' ? 'bg-red-100' : 'bg-admin-100'} flex items-center justify-center`}>
                    <StatusIcon className={`h-8 w-8 ${currentStatus.color === 'warning' ? 'text-warning-600' :
                    currentStatus.color === 'quoted' ? 'text-trust-600' :
                    currentStatus.color === 'accepted' ? 'text-primary-600' :
                    currentStatus.color === 'admin' ? 'text-admin-600' :
                    currentStatus.color === 'completed' ? 'text-success-600' :
                    currentStatus.color === 'cancelled' ? 'text-red-600' : 'text-admin-600'}`} />
                  </div>
                  <h4 className="font-medium text-admin-900 mb-1">{currentStatus.label}</h4>
                  <p className="text-sm text-admin-600 mb-4">{currentStatus.description}</p>
                  <Button 
                    variant="admin-secondary" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setShowStatusModal(true)}
                  >
                    Update Status
                  </Button>
                </div>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card variant="admin">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-admin-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-admin-600">Vehicles</span>
                    <span className="font-medium text-admin-900">{vehicles.length || 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-admin-600">Quote Value</span>
                    <span className="font-medium text-admin-900">
                      {quote ? formatCurrency(quote.total_amount) : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-admin-600">Days Active</span>
                    <span className="font-medium text-admin-900">
                      {Math.ceil((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Contact Information */}
            <Card variant="admin">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-admin-900 mb-4">Customer Contact</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-admin-900">Pickup Contact</p>
                    <p className="text-sm text-admin-600">{order.pickup_contact_name}</p>
                    <a href={`tel:${order.pickup_contact_phone}`} className="text-sm text-primary-600 hover:text-primary-700">
                      {order.pickup_contact_phone}
                    </a>
                  </div>
                  <div className="pt-3 border-t border-admin-200">
                    <p className="text-sm font-medium text-admin-900">Delivery Contact</p>
                    <p className="text-sm text-admin-600">{order.delivery_contact_name}</p>
                    <a href={`tel:${order.delivery_contact_phone}`} className="text-sm text-primary-600 hover:text-primary-700">
                      {order.delivery_contact_phone}
                    </a>
                  </div>
                </div>
                <Button variant="admin-secondary" size="sm" className="w-full mt-4">
                  <ChatBubbleLeftEllipsisIcon className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
    {/* Assign Admin Modal */}
    {showAssignModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-admin-900 mb-4">Assign Admin</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {availableAdmins.map((admin) => (
              <button
                key={admin.id}
                onClick={() => assignAdmin(admin.id)}
                disabled={updating}
                className="w-full text-left p-3 border border-admin-200 rounded-lg hover:bg-admin-50 transition-colors disabled:opacity-50"
              >
                <p className="font-medium text-admin-900">{admin.full_name || admin.email}</p>
                <p className="text-sm text-admin-600">{admin.email}</p>
              </button>
            ))}
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="admin-secondary" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* Create Quote Modal */}
    {showQuoteModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg">
          <h3 className="text-lg font-semibold text-admin-900 mb-4">Create Quote</h3>
          <form onSubmit={(e) => {
            e.preventDefault()
            console.log('🔍 Quote form submitted')
            
            try {
              const formData = new FormData(e.target as HTMLFormElement)
              const amountString = formData.get('amount') as string
              const pickupDate = formData.get('pickup_date') as string
              const deliveryDate = formData.get('delivery_date') as string
              
              console.log('🔍 Form values:', { 
                amountString, 
                pickupDate, 
                deliveryDate 
              })
              
              const amount = parseFloat(amountString)
              
              if (!amountString || isNaN(amount) || amount <= 0) {
                toast.error('Please enter a valid quote amount')
                return
              }
              
              createQuote({
                total_amount: amount,
                estimated_pickup_date: pickupDate || undefined,
                estimated_delivery_date: deliveryDate || undefined
              })
            } catch (error) {
              console.error('❌ Form submission error:', error)
              toast.error('Error processing form data')
            }
          }}>
            <div className="space-y-4">
              <div>
                <label className="label-admin">Quote Amount *</label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0.01"
                  required
                  className="input-admin"
                  placeholder="Enter quote amount (e.g., 1500.00)"
                />
              </div>
              <div>
                <label className="label-admin">Estimated Pickup Date</label>
                <input
                  type="datetime-local"
                  name="pickup_date"
                  className="input-admin"
                />
              </div>
              <div>
                <label className="label-admin">Estimated Delivery Date</label>
                <input
                  type="datetime-local"
                  name="delivery_date"
                  className="input-admin"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                type="button" 
                variant="admin-secondary" 
                onClick={() => setShowQuoteModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="admin-primary" loading={updating}>
                Create Quote
              </Button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Update Status Modal */}
    {showStatusModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-admin-900 mb-4">Update Order Status</h3>
          <div className="space-y-3">
            {Object.entries(statusConfig).map(([status, config]) => (
              <button
                key={status}
                onClick={() => {
                  updateOrderStatus(status)
                  setShowStatusModal(false)
                }}
                disabled={updating || order?.status === status}
                className={`w-full text-left p-3 border rounded-lg transition-colors disabled:opacity-50 ${
                  order?.status === status 
                    ? 'border-admin-300 bg-admin-50' 
                    : 'border-admin-200 hover:bg-admin-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <config.icon className={`h-5 w-5 ${config.color === 'warning' ? 'text-warning-600' :
                  config.color === 'quoted' ? 'text-trust-600' :
                  config.color === 'accepted' ? 'text-primary-600' :
                  config.color === 'admin' ? 'text-admin-600' :
                  config.color === 'completed' ? 'text-success-600' :
                  config.color === 'cancelled' ? 'text-red-600' : 'text-admin-600'}`} />
                  <div>
                    <p className="font-medium text-admin-900">{config.label}</p>
                    <p className="text-sm text-admin-600">{config.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="admin-secondary" onClick={() => setShowStatusModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}