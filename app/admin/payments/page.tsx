'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { 
  CreditCardIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  EyeIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { useRawAuth } from '@/hooks/useRawAuth'
import { Card, Badge, Button } from '@/components/ui'
import { supabase } from '@/lib/supabase'

interface Payment {
  id: string
  transportation_request_id: string
  quote_id: string
  user_id: string
  amount: number
  payment_method: 'credit_card' | 'ach' | 'check'
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  ach_transaction_id: string | null
  payment_date: string | null
  failure_reason: string | null
  refund_amount: number
  created_at: string
  updated_at: string
  // Joined data
  order_number?: string
  customer_name?: string
  customer_email?: string
  quote_total?: number
}

export default function AdminPaymentsPage() {
  const router = useRouter()
  const { user, profile, loading, adminAccess, redirectToLogin, redirectToDashboard } = useRawAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'created_at' | 'amount' | 'payment_date' | 'customer_name'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'>('all')
  const [filterMethod, setFilterMethod] = useState<'all' | 'credit_card' | 'ach' | 'check'>('all')
  const [paymentsLoading, setPaymentsLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

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
      fetchPayments()
    }
  }, [adminAccess, redirectToLogin, redirectToDashboard])

  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true)
      console.log('🔍 Fetching payments...')

      // Get payments with joined data
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          transportation_requests!inner(
            order_number,
            profiles!inner(
              full_name,
              email
            )
          ),
          quotes!inner(
            total_amount
          )
        `)
        .order('created_at', { ascending: false })

      if (paymentsError) {
        console.error('❌ Error fetching payments:', paymentsError)
        toast.error('Failed to load payments')
        return
      }

      // Transform the data to flatten the joined fields
      const transformedPayments = (paymentsData || []).map((payment: any) => ({
        ...payment,
        order_number: payment.transportation_requests?.order_number,
        customer_name: payment.transportation_requests?.profiles?.full_name,
        customer_email: payment.transportation_requests?.profiles?.email,
        quote_total: payment.quotes?.total_amount
      }))

      setPayments(transformedPayments)
      setFilteredPayments(transformedPayments)
      console.log('✅ Payments loaded:', transformedPayments.length)
    } catch (error) {
      console.error('💥 Error in fetchPayments:', error)
      toast.error('Failed to load payments')
    } finally {
      setPaymentsLoading(false)
    }
  }

  // Filter and search payments
  useEffect(() => {
    let filtered = [...payments]

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(payment => payment.payment_status === filterStatus)
    }

    // Apply method filter
    if (filterMethod !== 'all') {
      filtered = filtered.filter(payment => payment.payment_method === filterMethod)
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(payment =>
        payment.order_number?.toLowerCase().includes(search) ||
        payment.customer_name?.toLowerCase().includes(search) ||
        payment.customer_email?.toLowerCase().includes(search) ||
        payment.stripe_payment_intent_id?.toLowerCase().includes(search) ||
        payment.id.toLowerCase().includes(search)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'customer_name':
          aValue = a.customer_name || a.customer_email
          bValue = b.customer_name || b.customer_email
          break
        case 'amount':
          aValue = a.amount
          bValue = b.amount
          break
        case 'payment_date':
          aValue = a.payment_date ? new Date(a.payment_date).getTime() : 0
          bValue = b.payment_date ? new Date(b.payment_date).getTime() : 0
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

    setFilteredPayments(filtered)
  }, [payments, searchTerm, sortBy, sortOrder, filterStatus, filterMethod])

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
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

  const getStatusIcon = (status: Payment['payment_status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'failed':
        return <XCircleIcon className="h-4 w-4" />
      case 'pending':
        return <ClockIcon className="h-4 w-4" />
      case 'processing':
        return <ArrowPathIcon className="h-4 w-4" />
      case 'refunded':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  const getMethodIcon = (method: Payment['payment_method']) => {
    switch (method) {
      case 'credit_card':
        return <CreditCardIcon className="h-4 w-4" />
      case 'ach':
        return <BanknotesIcon className="h-4 w-4" />
      case 'check':
        return <DocumentTextIcon className="h-4 w-4" />
      default:
        return <CreditCardIcon className="h-4 w-4" />
    }
  }

  // Calculate stats
  const totalRevenue = payments.reduce((sum, p) => p.payment_status === 'completed' ? sum + p.amount : sum, 0)
  const pendingAmount = payments.reduce((sum, p) => p.payment_status === 'pending' ? sum + p.amount : sum, 0)
  const refundedAmount = payments.reduce((sum, p) => sum + p.refund_amount, 0)
  const completedCount = payments.filter(p => p.payment_status === 'completed').length
  const failedCount = payments.filter(p => p.payment_status === 'failed').length

  // Show loading while checking authentication
  if (adminAccess === 'loading' || paymentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        <div className="ml-4">
          <p className="text-gray-600">
            {adminAccess === 'loading' ? 'Checking authentication...' : 'Loading payments...'}
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
            Payment Management
          </h1>
          <p className="text-admin-600">
            Monitor payment transactions, process refunds, and analyze payment data.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="admin-secondary" size="sm">
            <FunnelIcon className="h-4 w-4" />
            Export Report
          </Button>
          <Button variant="admin-primary">
            <CurrencyDollarIcon className="h-4 w-4" />
            Process Payment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid lg:grid-cols-5 md:grid-cols-2 gap-6">
        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-admin-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-admin-900">{formatCurrency(totalRevenue)}</p>
              <p className="text-sm text-admin-500 mt-1">Completed payments</p>
            </div>
            <div className="h-12 w-12 bg-success-100 rounded-xl flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </Card>

        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-admin-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-admin-900">{formatCurrency(pendingAmount)}</p>
              <p className="text-sm text-admin-500 mt-1">Awaiting processing</p>
            </div>
            <div className="h-12 w-12 bg-warning-100 rounded-xl flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-admin-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-admin-900">{completedCount}</p>
              <p className="text-sm text-admin-500 mt-1">Successful payments</p>
            </div>
            <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-admin-600 mb-1">Failed</p>
              <p className="text-2xl font-bold text-admin-900">{failedCount}</p>
              <p className="text-sm text-admin-500 mt-1">Payment failures</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-admin-600 mb-1">Refunds</p>
              <p className="text-2xl font-bold text-admin-900">{formatCurrency(refundedAmount)}</p>
              <p className="text-sm text-admin-500 mt-1">Total refunded</p>
            </div>
            <div className="h-12 w-12 bg-trust-100 rounded-xl flex items-center justify-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-trust-600" />
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
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* Method Filter */}
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value as any)}
              className="px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="all">All Methods</option>
              <option value="credit_card">Credit Card</option>
              <option value="ach">ACH Transfer</option>
              <option value="check">Check</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-admin-600">
            <span>Showing {filteredPayments.length} of {payments.length} payments</span>
          </div>
        </div>
      </Card>

      {/* Payments Table */}
      <Card variant="admin" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-admin-50 border-b border-admin-200">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-admin-700 text-sm">
                  Payment ID
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
                <th className="text-left py-4 px-6 font-medium text-admin-700 text-sm">
                  <button
                    onClick={() => handleSort('amount')}
                    className="flex items-center space-x-1 hover:text-admin-900"
                  >
                    <span>Amount</span>
                    <ArrowsUpDownIcon className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left py-4 px-6 font-medium text-admin-700 text-sm">Method</th>
                <th className="text-left py-4 px-6 font-medium text-admin-700 text-sm">Status</th>
                <th className="text-left py-4 px-6 font-medium text-admin-700 text-sm">
                  <button
                    onClick={() => handleSort('payment_date')}
                    className="flex items-center space-x-1 hover:text-admin-900"
                  >
                    <span>Payment Date</span>
                    <ArrowsUpDownIcon className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left py-4 px-6 font-medium text-admin-700 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-100">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-admin-50">
                  <td className="py-4 px-6">
                    <div className="font-mono text-xs text-admin-600 bg-admin-100 rounded px-2 py-1 inline-block">
                      {payment.id.substring(0, 8)}...
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="text-sm font-medium text-admin-900">
                        {payment.customer_name || payment.customer_email}
                      </p>
                      <p className="text-xs text-admin-500">
                        Order: {payment.order_number}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="text-sm font-medium text-admin-900">
                        {formatCurrency(payment.amount)}
                      </p>
                      {payment.refund_amount > 0 && (
                        <p className="text-xs text-red-600">
                          Refunded: {formatCurrency(payment.refund_amount)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      {getMethodIcon(payment.payment_method)}
                      <span className="text-sm text-admin-600 capitalize">
                        {payment.payment_method.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(payment.payment_status)}
                      <Badge 
                        variant={
                          payment.payment_status === 'completed' ? 'success' :
                          payment.payment_status === 'failed' ? 'danger' :
                          payment.payment_status === 'pending' ? 'pending' :
                          payment.payment_status === 'processing' ? 'quoted' :
                          'warning'
                        } 
                        size="sm"
                      >
                        {payment.payment_status}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-admin-600">
                      {formatDate(payment.payment_date)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="admin-secondary"
                        size="sm"
                        onClick={() => router.push(`/admin/payments/${payment.id}`)}
                      >
                        <EyeIcon className="h-3 w-3" />
                      </Button>
                      {payment.payment_status === 'completed' && (
                        <Button
                          variant="admin-secondary"
                          size="sm"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          <ArrowPathIcon className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <CreditCardIcon className="h-12 w-12 text-admin-300 mx-auto mb-4" />
              <p className="text-admin-500">No payments found matching your criteria.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}