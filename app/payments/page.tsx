'use client'

import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  CreditCardIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  ReceiptRefundIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  payment_method: string
  stripe_payment_intent_id: string
  created_at: string
  transportation_requests: {
    order_number: string
    pickup_company_name: string
    delivery_company_name: string
  }[]
  quotes: {
    total_amount: number
  }[]
}

export default function PaymentsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }
    
    if (user) {
      fetchPayments()
    }
  }, [user, loading, router])

  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true)
      console.log('💳 Fetching payment history for user:', user?.id)

      const { data: paymentsData, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          currency,
          status,
          payment_method,
          stripe_payment_intent_id,
          created_at,
          transportation_requests!inner(
            order_number,
            pickup_company_name,
            delivery_company_name
          ),
          quotes!inner(
            total_amount
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Failed to fetch payments:', error)
        throw error
      }

      setPayments(paymentsData || [])
      console.log('✅ Payment history loaded:', paymentsData?.length || 0)

    } catch (err: any) {
      console.error('💥 Error fetching payment history:', err)
      toast.error('Failed to load payment history')
    } finally {
      setPaymentsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-600" />
      default:
        return <CreditCardIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'
      }`}>
        {status.toUpperCase()}
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

  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount)
  }

  if (loading || paymentsLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600 mt-1">View your payment history and receipts</p>
        </div>
        <Link
          href="/requests"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
          View Requests
        </Link>
      </div>

      {/* Payments List */}
      {payments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No payments yet</h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            Your payment history will appear here after you pay for accepted quotes.
          </p>
          <div className="mt-6">
            <Link
              href="/requests"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
              View My Requests
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {payments.filter(p => p.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-500">Successful Payments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    payments
                      .filter(p => p.status === 'completed')
                      .reduce((sum, p) => sum + p.amount, 0)
                  )}
                </div>
                <div className="text-sm text-gray-500">Total Paid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {payments.length}
                </div>
                <div className="text-sm text-gray-500">Total Transactions</div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <div key={payment.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(payment.status)}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Order {payment.transportation_requests[0]?.order_number || 'Unknown'}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Payment ID: {payment.stripe_payment_intent_id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(payment.amount, payment.currency)}
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">From:</span> {payment.transportation_requests[0]?.pickup_company_name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">To:</span> {payment.transportation_requests[0]?.delivery_company_name || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Payment Method:</span> {payment.payment_method}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {formatDate(payment.created_at)}
                      </p>
                    </div>
                  </div>

                  {payment.status === 'completed' && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center text-sm text-gray-500">
                        <CheckCircleIcon className="h-4 w-4 mr-1 text-green-600" />
                        Payment completed successfully
                      </div>
                      <button
                        onClick={() => window.open(`https://dashboard.stripe.com/payments/${payment.stripe_payment_intent_id}`, '_blank')}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <ReceiptRefundIcon className="h-3 w-3 mr-1" />
                        View Receipt
                      </button>
                    </div>
                  )}

                  {payment.status === 'failed' && (
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center text-sm text-red-600">
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Payment failed - please try again or contact support
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Features Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Secure Payments</h3>
              <p className="text-sm text-gray-500">All payments processed securely through Stripe</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <CreditCardIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Multiple Payment Methods</h3>
              <p className="text-sm text-gray-500">Credit cards, debit cards, and more</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <ReceiptRefundIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Digital Receipts</h3>
              <p className="text-sm text-gray-500">Automatic email receipts for all transactions</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Payment History</h3>
              <p className="text-sm text-gray-500">Complete transaction history and tracking</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 