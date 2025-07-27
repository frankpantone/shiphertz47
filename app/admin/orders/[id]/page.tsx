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
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { useRawAuth } from '@/hooks/useRawAuth'
import { getRawRequests, getRawProfile, updateRawRequest } from '@/lib/auth-raw'
import { supabase } from '@/lib/supabase'
import QuoteForm from '@/components/QuoteForm'

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
  created_at: string
}

interface AdminProfile {
  id: string
  email: string
  role: string
}

interface DocumentAttachment {
  id: string
  transportation_request_id: string
  file_name: string
  file_size: number
  file_type: string
  storage_path: string
  uploaded_by: string
  created_at: string
}

interface Quote {
  id: string
  transportation_request_id: string
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
  updated_at: string
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, adminAccess, redirectToLogin, redirectToDashboard } = useRawAuth()
  
  const [order, setOrder] = useState<TransportationRequest | null>(null)
  const [assignedAdminName, setAssignedAdminName] = useState<string>('')
  const [adminUsers, setAdminUsers] = useState<AdminProfile[]>([])
  const [attachments, setAttachments] = useState<DocumentAttachment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [claiming, setClaiming] = useState(false)
  const [reassigning, setReassigning] = useState(false)
  const [selectedAdminId, setSelectedAdminId] = useState<string>('')
  const [viewingAttachment, setViewingAttachment] = useState<DocumentAttachment | null>(null)
  const [attachmentUrl, setAttachmentUrl] = useState<string>('')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [submittingQuote, setSubmittingQuote] = useState(false)

  useEffect(() => {
    console.log('🔍 Order Detail - Admin access check:', adminAccess)

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
      console.log('✅ Admin access granted, loading order details')
      fetchOrderDetails()
    }
  }, [adminAccess, redirectToLogin, redirectToDashboard])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch all requests and find the specific order
      const allRequests = await getRawRequests()
      const foundOrder = allRequests.find(req => req.id === params.id)
      
      if (!foundOrder) {
        setError('Order not found')
        return
      }
      
      setOrder(foundOrder)
      
      // Fetch assigned admin name if order is assigned
      if (foundOrder.assigned_admin_id) {
        try {
          const adminProfile = await getRawProfile(foundOrder.assigned_admin_id)
          setAssignedAdminName(adminProfile?.email || 'Unknown Admin')
        } catch (err) {
          console.warn('Failed to fetch admin profile:', err)
          setAssignedAdminName('Unknown Admin')
        }
      }

      // Fetch admin users for reassignment dropdown
      await fetchAdminUsers()

      // Fetch document attachments
      await fetchAttachments(foundOrder.id)
      
      // Fetch vehicles
      await fetchVehicles(foundOrder.id)
      
      // Fetch quotes
      await fetchQuotes(foundOrder.id)
      
    } catch (err) {
      console.error('Failed to fetch order details:', err)
      setError('Failed to load order details')
      toast.error('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const fetchAdminUsers = async () => {
    try {
      // Fetch all requests to get admin IDs, then fetch their profiles
      const allRequests = await getRawRequests()
      const adminIds = Array.from(new Set(allRequests
        .filter(r => r.assigned_admin_id)
        .map(r => r.assigned_admin_id!)))
      
      // Add current user if not already in the list
      if (user && !adminIds.includes(user.id)) {
        adminIds.push(user.id)
      }

      const adminProfiles: AdminProfile[] = []
      for (const adminId of adminIds) {
        try {
          const profile = await getRawProfile(adminId)
          if (profile && profile.role === 'admin') {
            adminProfiles.push({
              id: adminId,
              email: profile.email,
              role: profile.role
            })
          }
        } catch (err) {
          console.warn(`Failed to fetch profile for admin ${adminId}:`, err)
        }
      }
      
      setAdminUsers(adminProfiles)
    } catch (err) {
      console.warn('Failed to fetch admin users:', err)
    }
  }

  const fetchAttachments = async (requestId: string) => {
    try {
      console.log('📎 Fetching attachments for request:', requestId)
      
      // Use Supabase client instead of raw fetch for proper authentication
      const { data: attachmentData, error } = await supabase
        .from('document_attachments')
        .select('*')
        .eq('transportation_request_id', requestId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Failed to fetch attachments:', error)
        throw error
      }

      console.log('✅ Attachments fetched:', attachmentData?.length || 0)
      setAttachments(attachmentData || [])
      
    } catch (err) {
      console.warn('Failed to fetch attachments:', err)
      setAttachments([])
    }
  }

  const fetchVehicles = async (requestId: string) => {
    try {
      console.log('🚗 Fetching vehicles for request:', requestId)
      
      const { data: vehicleData, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('transportation_request_id', requestId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ Failed to fetch vehicles:', error)
        throw error
      }

      console.log('✅ Vehicles fetched:', vehicleData?.length || 0)
      setVehicles(vehicleData || [])
      
    } catch (err) {
      console.warn('Failed to fetch vehicles:', err)
      setVehicles([])
    }
  }

  const fetchQuotes = async (requestId: string) => {
    try {
      console.log('💰 Fetching quotes for request:', requestId)
      
      const { data: quotesData, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('transportation_request_id', requestId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Failed to fetch quotes:', error)
        throw error
      }

      console.log('✅ Quotes fetched:', quotesData?.length || 0)
      setQuotes(quotesData || [])
      
    } catch (err) {
      console.warn('Failed to fetch quotes:', err)
      setQuotes([])
    }
  }

  const createQuote = async (quoteData: {
    base_price: number
    fuel_surcharge: number
    additional_fees: number
    estimated_pickup_date?: string
    estimated_delivery_date?: string
    terms_and_conditions?: string
    notes?: string
    expires_at?: string
  }) => {
    if (!order || !user) return

    try {
      setSubmittingQuote(true)
      console.log('💰 Creating quote for order:', order.id)

      const total_amount = quoteData.base_price + quoteData.fuel_surcharge + quoteData.additional_fees

      const { data: newQuote, error } = await supabase
        .from('quotes')
        .insert({
          transportation_request_id: order.id,
          admin_id: user.id,
          base_price: quoteData.base_price,
          fuel_surcharge: quoteData.fuel_surcharge,
          additional_fees: quoteData.additional_fees,
          total_amount: total_amount,
          estimated_pickup_date: quoteData.estimated_pickup_date,
          estimated_delivery_date: quoteData.estimated_delivery_date,
          terms_and_conditions: quoteData.terms_and_conditions,
          notes: quoteData.notes,
          is_active: true,
          expires_at: quoteData.expires_at
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Failed to create quote:', error)
        throw error
      }

      console.log('✅ Quote created successfully:', newQuote)
      toast.success('Quote created successfully!')
      
      // Refresh quotes
      await fetchQuotes(order.id)
      setShowQuoteForm(false)

    } catch (err: any) {
      console.error('💥 Quote creation error:', err)
      toast.error(err.message || 'Failed to create quote')
    } finally {
      setSubmittingQuote(false)
    }
  }

  const viewAttachment = async (attachment: DocumentAttachment) => {
    try {
      console.log('👁️ Viewing attachment:', attachment.file_name)
      console.log('📂 Storage path:', attachment.storage_path)
      
      // Try multiple approaches to get the file URL
      
      // Method 1: Try signed URL with longer expiry
      let signedUrl = null
      const { data: signedData, error: signedError } = await supabase.storage
        .from('documents')
        .createSignedUrl(attachment.storage_path, 7200) // 2 hours

      if (signedError) {
        console.warn('⚠️ Signed URL failed:', signedError)
      } else if (signedData?.signedUrl) {
        signedUrl = signedData.signedUrl
        console.log('✅ Got signed URL')
      }

      // Method 2: Try public URL as fallback
      if (!signedUrl) {
        console.log('🔄 Trying public URL fallback...')
        const { data: publicData } = supabase.storage
          .from('documents')
          .getPublicUrl(attachment.storage_path)
        
        if (publicData?.publicUrl) {
          signedUrl = publicData.publicUrl
          console.log('✅ Got public URL')
        }
      }

      // Method 3: Try downloading and creating blob URL
      if (!signedUrl) {
        console.log('🔄 Trying direct download approach...')
        try {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('documents')
            .download(attachment.storage_path)

          if (!downloadError && fileData) {
            const blob = new Blob([fileData], { type: attachment.file_type })
            signedUrl = URL.createObjectURL(blob)
            console.log('✅ Created blob URL')
          } else {
            console.warn('⚠️ Download failed:', downloadError)
          }
        } catch (downloadErr) {
          console.warn('⚠️ Download error:', downloadErr)
        }
      }

      if (!signedUrl) {
        console.error('❌ All methods failed to get file URL')
        toast.error('Failed to load file for viewing. Please check storage permissions.')
        return
      }

      console.log('✅ Successfully got file URL')
      setAttachmentUrl(signedUrl)
      setViewingAttachment(attachment)
      
    } catch (err) {
      console.error('View attachment error:', err)
      toast.error('Failed to load file for viewing')
    }
  }

  const closeAttachmentModal = () => {
    // Clean up blob URLs to prevent memory leaks
    if (attachmentUrl && attachmentUrl.startsWith('blob:')) {
      URL.revokeObjectURL(attachmentUrl)
    }
    setViewingAttachment(null)
    setAttachmentUrl('')
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }



  const handleClaimOrder = async () => {
    if (!user || !order) return
    
    setClaiming(true)
    try {
      const success = await updateRawRequest(order.id, {
        assigned_admin_id: user.id,
        status: 'quoted'
      })

      if (success) {
        toast.success('Order claimed successfully!')
        // Update local state
        setOrder(prev => prev ? { ...prev, assigned_admin_id: user.id, status: 'quoted' } : null)
        setAssignedAdminName(user.email || 'You')
      } else {
        toast.error('Failed to claim order')
      }
    } catch (error) {
      console.error('Error claiming order:', error)
      toast.error('Failed to claim order')
    } finally {
      setClaiming(false)
    }
  }

  const handleReassignOrder = async () => {
    if (!selectedAdminId || !order) return
    
    setReassigning(true)
    try {
      const success = await updateRawRequest(order.id, {
        assigned_admin_id: selectedAdminId
      })

      if (success) {
        const newAdminProfile = adminUsers.find(admin => admin.id === selectedAdminId)
        toast.success(`Order reassigned to ${newAdminProfile?.email || 'admin'} successfully!`)
        
        // Update local state
        setOrder(prev => prev ? { ...prev, assigned_admin_id: selectedAdminId } : null)
        setAssignedAdminName(newAdminProfile?.email || 'Unknown Admin')
        setSelectedAdminId('')
      } else {
        toast.error('Failed to reassign order')
      }
    } catch (error) {
      console.error('Error reassigning order:', error)
      toast.error('Failed to reassign order')
    } finally {
      setReassigning(false)
    }
  }



  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      quoted: 'bg-blue-100 text-blue-800 border-blue-200',
      accepted: 'bg-green-100 text-green-800 border-green-200',
      in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    }
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  // Don't render anything if not admin (redirects are handled in useEffect)
  if (adminAccess !== 'admin') {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <TruckIcon className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Loading Order Details...</h3>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Order Not Found</h3>
            <p className="mt-2 text-gray-600">{error || 'The requested order could not be found.'}</p>
            <Link
              href="/admin/orders/all"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to All Orders
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/orders/all"
                className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to All Orders
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
                <p className="text-gray-600">Complete information for {order.order_number}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(order.status)}
            </div>
          </div>
        </div>

        {/* Order Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-blue-600" />
                Order Summary
              </h2>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Order Number</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">{order.order_number}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Current Status</dt>
                  <dd className="mt-1">{getStatusBadge(order.status)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                  <dd className="mt-1 text-sm">
                    {order.assigned_admin_id ? (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{assignedAdminName}</span>
                        {order.assigned_admin_id === user?.id && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            You
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-orange-600 font-medium">Unassigned - Available for claim</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                    {formatDate(order.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                    {formatDate(order.updated_at)}
                  </dd>
                </div>
              </dl>
            </div>



            {/* Special Notes */}
            {order.notes && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Special Notes
                </h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{order.notes}</p>
                </div>
              </div>
            )}

            {/* Document Attachments */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PaperClipIcon className="h-5 w-5 mr-2 text-blue-600" />
                Document Attachments
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {attachments.length}
                </span>
              </h2>
              
              {attachments.length === 0 ? (
                <div className="text-center py-6">
                  <PaperClipIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No documents attached to this order</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attachments.map((attachment) => (
                    <div 
                      key={attachment.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <PaperClipIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {attachment.file_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(attachment.file_size)} • Uploaded {formatDate(attachment.created_at)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => viewAttachment(attachment)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <DocumentTextIcon className="h-3 w-3 mr-1" />
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quotes Management */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Quotes
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {quotes.length}
                  </span>
                </h2>
                {!showQuoteForm && (
                  <button
                    onClick={() => setShowQuoteForm(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Quote
                  </button>
                )}
              </div>

              {/* Quote Creation Form */}
              {showQuoteForm && (
                <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Quote</h3>
                  <QuoteForm 
                    onSubmit={createQuote}
                    onCancel={() => setShowQuoteForm(false)}
                    submitting={submittingQuote}
                  />
                </div>
              )}

              {/* Existing Quotes */}
              {quotes.length === 0 ? (
                <div className="text-center py-6">
                  <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No quotes created for this order yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quotes.map((quote, index) => (
                    <div key={quote.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          Quote #{index + 1}
                        </h4>
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
                          <span className="text-xs text-gray-500">
                            {formatDate(quote.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <dt className="text-xs font-medium text-gray-500">Base Price</dt>
                          <dd className="text-sm font-mono text-gray-900">${quote.base_price.toFixed(2)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500">Fuel Surcharge</dt>
                          <dd className="text-sm font-mono text-gray-900">${quote.fuel_surcharge.toFixed(2)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500">Additional Fees</dt>
                          <dd className="text-sm font-mono text-gray-900">${quote.additional_fees.toFixed(2)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500">Total Amount</dt>
                          <dd className="text-lg font-bold text-green-600">${quote.total_amount.toFixed(2)}</dd>
                        </div>
                      </div>

                      {(quote.estimated_pickup_date || quote.estimated_delivery_date) && (
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          {quote.estimated_pickup_date && (
                            <div>
                              <dt className="text-xs font-medium text-gray-500">Est. Pickup Date</dt>
                              <dd className="text-sm text-gray-900">{new Date(quote.estimated_pickup_date).toLocaleDateString()}</dd>
                            </div>
                          )}
                          {quote.estimated_delivery_date && (
                            <div>
                              <dt className="text-xs font-medium text-gray-500">Est. Delivery Date</dt>
                              <dd className="text-sm text-gray-900">{new Date(quote.estimated_delivery_date).toLocaleDateString()}</dd>
                            </div>
                          )}
                        </div>
                      )}

                      {quote.notes && (
                        <div className="mb-3">
                          <dt className="text-xs font-medium text-gray-500">Notes</dt>
                          <dd className="text-sm text-gray-700 mt-1">{quote.notes}</dd>
                        </div>
                      )}

                      {quote.expires_at && (
                        <div className="text-xs text-gray-500">
                          Expires: {formatDate(quote.expires_at)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Vehicle Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TruckIcon className="h-5 w-5 mr-2 text-blue-600" />
                Vehicle Information
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {vehicles.length}
                </span>
              </h2>
              
              {vehicles.length === 0 ? (
                <div className="text-center py-6">
                  <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No vehicles found for this order</p>
                  {order.vin_number && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 mb-2">Legacy single VIN data:</p>
                      <p className="text-sm font-mono text-yellow-900">{order.vin_number}</p>
                      {order.vehicle_make && <p className="text-sm text-yellow-900">{order.vehicle_year} {order.vehicle_make} {order.vehicle_model}</p>}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {vehicles.map((vehicle, index) => (
                    <div key={vehicle.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-900 flex items-center">
                          <TruckIcon className="h-4 w-4 mr-2" />
                          Vehicle {index + 1}
                        </h3>
                        <span className="text-xs text-gray-500">
                          Added {new Date(vehicle.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">VIN Number</dt>
                          <dd className="mt-1 text-sm font-mono text-gray-900 bg-white px-3 py-2 rounded border">
                            {vehicle.vin_number}
                          </dd>
                        </div>
                        
                        {vehicle.vehicle_make && (
                          <div>
                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Make</dt>
                            <dd className="mt-1 text-sm text-gray-900">{vehicle.vehicle_make}</dd>
                          </div>
                        )}
                        
                        {vehicle.vehicle_model && (
                          <div>
                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Model</dt>
                            <dd className="mt-1 text-sm text-gray-900">{vehicle.vehicle_model}</dd>
                          </div>
                        )}
                        
                        {vehicle.vehicle_year && (
                          <div>
                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Year</dt>
                            <dd className="mt-1 text-sm text-gray-900">{vehicle.vehicle_year}</dd>
                          </div>
                        )}
                        
                        {vehicle.vehicle_type && (
                          <div>
                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</dt>
                            <dd className="mt-1 text-sm text-gray-900">{vehicle.vehicle_type}</dd>
                          </div>
                        )}
                        
                        {vehicle.vehicle_engine && (
                          <div className="sm:col-span-2">
                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Engine</dt>
                            <dd className="mt-1 text-sm text-gray-900">{vehicle.vehicle_engine}</dd>
                          </div>
                        )}
                      </dl>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pickup and Delivery Locations - Horizontal Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Pickup Location */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2 text-green-600" />
              Pickup Location
            </h2>
            <div className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Company</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{order.pickup_company_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-700 leading-relaxed">{order.pickup_company_address}</dd>
              </div>
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-900">{order.pickup_contact_name}</span>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <a 
                      href={`tel:${order.pickup_contact_phone}`}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      {order.pickup_contact_phone}
                    </a>
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
                <dd className="mt-1 text-lg font-semibold text-gray-900">{order.delivery_company_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-700 leading-relaxed">{order.delivery_company_address}</dd>
              </div>
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-900">{order.delivery_contact_name}</span>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <a 
                      href={`tel:${order.delivery_contact_phone}`}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      {order.delivery_contact_phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <Link
              href="/admin/orders/all"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to All Orders
            </Link>
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              {/* Order Assignment Actions */}
              {!order.assigned_admin_id ? (
                // Unassigned order - show claim button
                <button
                  onClick={handleClaimOrder}
                  disabled={claiming}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  {claiming ? 'Claiming...' : 'Claim Order'}
                </button>
              ) : (
                // Assigned order - show reassignment options
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <select
                    value={selectedAdminId}
                    onChange={(e) => setSelectedAdminId(e.target.value)}
                    className="block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select admin...</option>
                    {adminUsers
                      .filter(admin => admin.id !== order.assigned_admin_id)
                      .map(admin => (
                        <option key={admin.id} value={admin.id}>
                          {admin.email}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleReassignOrder}
                    disabled={!selectedAdminId || reassigning}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserCircleIcon className="h-4 w-4 mr-2" />
                    {reassigning ? 'Reassigning...' : 'Reassign Order'}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Assignment Status Info */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Assignment Status:
              </span>
              <span className={`font-medium ${order.assigned_admin_id ? 'text-green-600' : 'text-orange-600'}`}>
                {order.assigned_admin_id ? (
                  <>Assigned to {assignedAdminName}</>
                ) : (
                  'Unassigned - Available for claim'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Attachment Viewer Modal */}
      {viewingAttachment && attachmentUrl && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={closeAttachmentModal}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              {/* Modal header */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {viewingAttachment.file_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(viewingAttachment.file_size)} • {formatDate(viewingAttachment.created_at)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeAttachmentModal}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal content */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6">
                <div className="w-full h-96 sm:h-[600px] bg-white rounded border">
                  {viewingAttachment.file_type === 'application/pdf' ? (
                    // PDF viewer
                    <iframe
                      src={attachmentUrl}
                      className="w-full h-full rounded"
                      title={viewingAttachment.file_name}
                    />
                  ) : viewingAttachment.file_type.startsWith('image/') ? (
                    // Image viewer
                    <img
                      src={attachmentUrl}
                      alt={viewingAttachment.file_name}
                      className="w-full h-full object-contain rounded"
                    />
                  ) : (
                    // Generic file viewer
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                        <a
                          href={attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                          Download File
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <a
                  href={attachmentUrl}
                  download={viewingAttachment.file_name}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download
                </a>
                <button
                  type="button"
                  onClick={closeAttachmentModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 