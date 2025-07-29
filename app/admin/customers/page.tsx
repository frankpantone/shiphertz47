'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { 
  UserGroupIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline'
import { useRawAuth } from '@/hooks/useRawAuth'
import { Card, Badge, Button } from '@/components/ui'
import { supabase } from '@/lib/supabase'

interface Customer {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  company_name: string | null
  role: 'customer' | 'admin'
  created_at: string
  updated_at: string
  total_orders?: number
  total_spent?: number
  last_order?: string
}

export default function AdminCustomersPage() {
  const router = useRouter()
  const { user, profile, loading, adminAccess, redirectToLogin, redirectToDashboard } = useRawAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'created_at' | 'total_orders'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterRole, setFilterRole] = useState<'all' | 'customer' | 'admin'>('all')
  const [customersLoading, setCustomersLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

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
      fetchCustomers()
    }
  }, [adminAccess, redirectToLogin, redirectToDashboard])

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true)
      console.log('🔍 Fetching customers...')

      // Get customers with order statistics
      const { data: customersData, error: customersError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          phone,
          company_name,
          role,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })

      if (customersError) {
        console.error('❌ Error fetching customers:', customersError)
        toast.error('Failed to load customers')
        return
      }

      // Get order statistics for each customer
      const customersWithStats = await Promise.all(
        (customersData || []).map(async (customer: any) => {
          const { data: orders, error: ordersError } = await supabase
            .from('transportation_requests')
            .select('id, created_at')
            .eq('user_id', customer.id)

          const { data: quotes, error: quotesError } = await supabase
            .from('quotes')
            .select('total_amount')
            .in('transportation_request_id', orders?.map((o: any) => o.id) || [])
            .eq('is_active', true)

          const totalOrders = orders?.length || 0
          const totalSpent = quotes?.reduce((sum: number, quote: any) => sum + (quote.total_amount || 0), 0) || 0
          const lastOrder = orders?.[0]?.created_at || null

          return {
            ...customer,
            total_orders: totalOrders,
            total_spent: totalSpent,
            last_order: lastOrder
          }
        })
      )

      setCustomers(customersWithStats)
      setFilteredCustomers(customersWithStats)
      console.log('✅ Customers loaded:', customersWithStats.length)
    } catch (error) {
      console.error('💥 Error in fetchCustomers:', error)
      toast.error('Failed to load customers')
    } finally {
      setCustomersLoading(false)
    }
  }

  // Filter and search customers
  useEffect(() => {
    let filtered = [...customers]

    // Apply role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(customer => customer.role === filterRole)
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(customer =>
        customer.email.toLowerCase().includes(search) ||
        customer.full_name?.toLowerCase().includes(search) ||
        customer.company_name?.toLowerCase().includes(search) ||
        customer.phone?.includes(search)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.full_name || a.email
          bValue = b.full_name || b.email
          break
        case 'email':
          aValue = a.email
          bValue = b.email
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'total_orders':
          aValue = a.total_orders || 0
          bValue = b.total_orders || 0
          break
        default:
          aValue = a.created_at
          bValue = b.created_at
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredCustomers(filtered)
  }, [customers, searchTerm, sortBy, sortOrder, filterRole])

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Show loading while checking authentication
  if (adminAccess === 'loading' || customersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        <div className="ml-4">
          <p className="text-gray-600">
            {adminAccess === 'loading' ? 'Checking authentication...' : 'Loading customers...'}
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
            Customer Management
          </h1>
          <p className="text-admin-600">
            Manage customer accounts, view order history, and analyze customer data.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="admin-secondary" size="sm">
            <FunnelIcon className="h-4 w-4" />
            Export Data
          </Button>
          <Button variant="admin-primary">
            <UserPlusIcon className="h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-admin-600 mb-1">Total Customers</p>
              <p className="text-3xl font-bold text-admin-900">{customers.length}</p>
              <p className="text-sm text-admin-500 mt-1">All registered users</p>
            </div>
            <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <UserGroupIcon className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-admin-600 mb-1">Active Customers</p>
              <p className="text-3xl font-bold text-admin-900">
                {customers.filter(c => c.role === 'customer').length}
              </p>
              <p className="text-sm text-admin-500 mt-1">Customer role only</p>
            </div>
            <div className="h-12 w-12 bg-success-100 rounded-xl flex items-center justify-center">
              <UserGroupIcon className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </Card>

        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-admin-600 mb-1">This Month</p>
              <p className="text-3xl font-bold text-admin-900">
                {customers.filter(c => {
                  const created = new Date(c.created_at)
                  const now = new Date()
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
                }).length}
              </p>
              <p className="text-sm text-admin-500 mt-1">New signups</p>
            </div>
            <div className="h-12 w-12 bg-warning-100 rounded-xl flex items-center justify-center">
              <UserPlusIcon className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-admin-600 mb-1">Avg. Orders</p>
              <p className="text-3xl font-bold text-admin-900">
                {customers.length > 0 ? 
                  Math.round(customers.reduce((sum, c) => sum + (c.total_orders || 0), 0) / customers.filter(c => c.role === 'customer').length) || 0
                  : 0
                }
              </p>
              <p className="text-sm text-admin-500 mt-1">Per customer</p>
            </div>
            <div className="h-12 w-12 bg-trust-100 rounded-xl flex items-center justify-center">
              <BuildingOfficeIcon className="h-6 w-6 text-trust-600" />
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
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="px-3 py-2 border border-admin-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers Only</option>
              <option value="admin">Admins Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-admin-600">
            <span>Showing {filteredCustomers.length} of {customers.length} customers</span>
          </div>
        </div>
      </Card>

      {/* Customers Table */}
      <Card variant="admin" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-admin-50 border-b border-admin-200">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-admin-700 text-sm">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center space-x-1 hover:text-admin-900"
                  >
                    <span>Customer</span>
                    <ArrowsUpDownIcon className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left py-4 px-6 font-medium text-admin-700 text-sm">
                  <button
                    onClick={() => handleSort('email')}
                    className="flex items-center space-x-1 hover:text-admin-900"
                  >
                    <span>Contact</span>
                    <ArrowsUpDownIcon className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left py-4 px-6 font-medium text-admin-700 text-sm">Role</th>
                <th className="text-left py-4 px-6 font-medium text-admin-700 text-sm">
                  <button
                    onClick={() => handleSort('total_orders')}
                    className="flex items-center space-x-1 hover:text-admin-900"
                  >
                    <span>Orders</span>
                    <ArrowsUpDownIcon className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left py-4 px-6 font-medium text-admin-700 text-sm">Total Spent</th>
                <th className="text-left py-4 px-6 font-medium text-admin-700 text-sm">
                  <button
                    onClick={() => handleSort('created_at')}
                    className="flex items-center space-x-1 hover:text-admin-900"
                  >
                    <span>Joined</span>
                    <ArrowsUpDownIcon className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left py-4 px-6 font-medium text-admin-700 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-admin-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-primary-600">
                          {(customer.full_name || customer.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-admin-900">
                          {customer.full_name || 'No name provided'}
                        </p>
                        {customer.company_name && (
                          <p className="text-xs text-admin-500">{customer.company_name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-admin-600">
                        <EnvelopeIcon className="h-3 w-3 mr-1" />
                        {customer.email}
                      </div>
                      {customer.phone && (
                        <div className="flex items-center text-sm text-admin-600">
                          <PhoneIcon className="h-3 w-3 mr-1" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <Badge 
                      variant={customer.role === 'admin' ? 'admin' : 'pending'} 
                      size="sm"
                    >
                      {customer.role}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm font-medium text-admin-900">
                      {customer.total_orders || 0}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm font-medium text-admin-900">
                      {formatCurrency(customer.total_spent || 0)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-admin-600">
                      {formatDate(customer.created_at)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="admin-secondary"
                        size="sm"
                        onClick={() => router.push(`/admin/customers/${customer.id}`)}
                      >
                        <EyeIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="admin-secondary"
                        size="sm"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <PencilIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <UserGroupIcon className="h-12 w-12 text-admin-300 mx-auto mb-4" />
              <p className="text-admin-500">No customers found matching your criteria.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}