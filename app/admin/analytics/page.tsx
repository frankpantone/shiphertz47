'use client'

import { useEffect, useState } from 'react'
import { useRawAuth } from '@/hooks/useRawAuth'
import { getRawRequests } from '@/lib/auth-raw'
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowTrendingUpIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { Card, Button, Badge } from '@/components/ui'
import DataExport, { ExportData } from '@/components/admin/DataExport'
import { toast } from 'react-hot-toast'

interface AnalyticsData {
  totalOrders: number
  completedOrders: number
  pendingOrders: number
  cancelledOrders: number
  averageOrderValue: number
  totalRevenue: number
  completionRate: number
  averageResponseTime: number
  monthlyGrowth: number
  revenueGrowth: number
  topRoutes: Array<{ route: string; count: number }>
  ordersByStatus: Array<{ status: string; count: number }>
  monthlyData: Array<{ month: string; orders: number; revenue: number }>
}

export default function AnalyticsPage() {
  const { user, profile, adminAccess, redirectToLogin, redirectToDashboard } = useRawAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [showExportModal, setShowExportModal] = useState(false)
  const [rawRequests, setRawRequests] = useState<any[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

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
      fetchAnalytics()
    }
  }, [adminAccess, timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // Fetch all requests for analytics
      const requests = await getRawRequests()
      setRawRequests(requests) // Store for export
      setLastUpdated(new Date())
      
      // Calculate analytics
      const totalOrders = requests.length
      const completedOrders = requests.filter(r => r.status === 'completed').length
      const pendingOrders = requests.filter(r => r.status === 'pending').length
      const cancelledOrders = requests.filter(r => r.status === 'cancelled').length
      
      // Mock some calculated values (in a real app, these would come from your backend)
      const averageOrderValue = 1247
      const totalRevenue = completedOrders * averageOrderValue
      const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
      const averageResponseTime = 2.4 // hours
      const monthlyGrowth = 12.5
      const revenueGrowth = 18.3
      
      // Calculate top routes
      const routeCounts: Record<string, number> = {}
      requests.forEach(request => {
        const route = `${request.pickup_company_address.split(',').pop()?.trim()} → ${request.delivery_company_address.split(',').pop()?.trim()}`
        routeCounts[route] = (routeCounts[route] || 0) + 1
      })
      
      const topRoutes = Object.entries(routeCounts)
        .map(([route, count]) => ({ route, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
      
      // Calculate orders by status
      const statusCounts: Record<string, number> = {}
      requests.forEach(request => {
        statusCounts[request.status] = (statusCounts[request.status] || 0) + 1
      })
      
      const ordersByStatus = Object.entries(statusCounts)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count)
      
      // Mock monthly data (last 6 months)
      const monthlyData = [
        { month: 'Jan', orders: 45, revenue: 56115 },
        { month: 'Feb', orders: 52, revenue: 64844 },
        { month: 'Mar', orders: 61, revenue: 76067 },
        { month: 'Apr', orders: 58, revenue: 72326 },
        { month: 'May', orders: 67, revenue: 83549 },
        { month: 'Jun', orders: totalOrders, revenue: totalRevenue }
      ]
      
      setAnalytics({
        totalOrders,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        averageOrderValue,
        totalRevenue,
        completionRate,
        averageResponseTime,
        monthlyGrowth,
        revenueGrowth,
        topRoutes,
        ordersByStatus,
        monthlyData
      })
      
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshData = () => {
    fetchAnalytics()
    toast.success('Analytics data refreshed')
  }

  // Prepare export data
  const getExportData = (): ExportData[] => {
    return rawRequests.map(request => ({
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
      created_at: request.created_at,
      updated_at: request.updated_at,
      total_amount: request.total_amount,
      notes: request.notes
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  if (adminAccess === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        <div className="ml-4">
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (adminAccess !== 'admin' || !analytics) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-admin-900">Analytics Dashboard</h1>
          <p className="text-admin-600 mt-1">Track performance metrics and business insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-admin-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button 
            variant="admin-secondary"
            size="sm"
            onClick={handleRefreshData}
            icon={<ArrowPathIcon className="h-4 w-4" />}
          >
            Refresh
          </Button>
          <Button 
            variant="admin-primary"
            onClick={() => setShowExportModal(true)}
            icon={<DocumentArrowDownIcon className="h-4 w-4" />}
          >
            Export Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-admin-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-admin-900">{formatCurrency(analytics.totalRevenue)}</p>
              <div className="flex items-center mt-2">
                <ArrowUpIcon className="h-4 w-4 text-success-500 mr-1" />
                <span className="text-sm text-success-600 font-medium">+{formatPercentage(analytics.revenueGrowth)}</span>
                <span className="text-sm text-admin-500 ml-2">vs last month</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-success-100 rounded-xl flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </Card>

        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-admin-600 mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-admin-900">{analytics.totalOrders}</p>
              <div className="flex items-center mt-2">
                <ArrowUpIcon className="h-4 w-4 text-success-500 mr-1" />
                <span className="text-sm text-success-600 font-medium">+{formatPercentage(analytics.monthlyGrowth)}</span>
                <span className="text-sm text-admin-500 ml-2">this month</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <TruckIcon className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-admin-600 mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-admin-900">{formatPercentage(analytics.completionRate)}</p>
              <div className="flex items-center mt-2">
                <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-sm text-red-600 font-medium">-2.1%</span>
                <span className="text-sm text-admin-500 ml-2">needs attention</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-warning-100 rounded-xl flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-admin-600 mb-1">Avg Response Time</p>
              <p className="text-3xl font-bold text-admin-900">{analytics.averageResponseTime}h</p>
              <div className="flex items-center mt-2">
                <ArrowUpIcon className="h-4 w-4 text-success-500 mr-1" />
                <span className="text-sm text-success-600 font-medium">-15min</span>
                <span className="text-sm text-admin-500 ml-2">improved</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-trust-100 rounded-xl flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-trust-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Performance Chart */}
        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-admin-900">Monthly Performance</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-primary-500 rounded-full mr-2"></div>
                <span className="text-admin-600">Orders</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-success-500 rounded-full mr-2"></div>
                <span className="text-admin-600">Revenue</span>
              </div>
            </div>
          </div>
          
          {/* Simple bar chart representation */}
          <div className="space-y-4">
            {analytics.monthlyData.map((month, index) => {
              const maxOrders = Math.max(...analytics.monthlyData.map(m => m.orders))
              const maxRevenue = Math.max(...analytics.monthlyData.map(m => m.revenue))
              const orderPercentage = (month.orders / maxOrders) * 100
              const revenuePercentage = (month.revenue / maxRevenue) * 100
              
              return (
                <div key={month.month} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-admin-900">{month.month}</span>
                    <div className="text-admin-600">
                      {month.orders} orders • {formatCurrency(month.revenue)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 bg-admin-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500 transition-all duration-300"
                        style={{ width: `${orderPercentage}%` }}
                      ></div>
                    </div>
                    <div className="h-2 bg-admin-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-success-500 transition-all duration-300"
                        style={{ width: `${revenuePercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Order Status Breakdown */}
        <Card variant="admin" className="p-6">
          <h3 className="text-lg font-semibold text-admin-900 mb-6">Order Status Breakdown</h3>
          <div className="space-y-4">
            {analytics.ordersByStatus.map((item) => {
              const percentage = (item.count / analytics.totalOrders) * 100
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'completed': return 'bg-success-500'
                  case 'pending': return 'bg-warning-500'
                  case 'quoted': return 'bg-trust-500'
                  case 'accepted': return 'bg-primary-500'
                  case 'cancelled': return 'bg-red-500'
                  default: return 'bg-admin-400'
                }
              }
              
              return (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`}></div>
                    <span className="font-medium text-admin-900 capitalize">
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 h-2 bg-admin-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getStatusColor(item.status)} transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-admin-900 w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top Routes */}
        <Card variant="admin" className="p-6">
          <h3 className="text-lg font-semibold text-admin-900 mb-6">Top Routes</h3>
          <div className="space-y-4">
            {analytics.topRoutes.map((route, index) => (
              <div key={route.route} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-600">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-admin-900">{route.route}</span>
                </div>
                <Badge variant="admin" size="sm">{route.count} orders</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Stats */}
        <Card variant="admin" className="p-6">
          <h3 className="text-lg font-semibold text-admin-900 mb-6">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-admin-600">Average Order Value</span>
              <span className="font-semibold text-admin-900">{formatCurrency(analytics.averageOrderValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-admin-600">Pending Orders</span>
              <span className="font-semibold text-warning-600">{analytics.pendingOrders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-admin-600">Completed Orders</span>
              <span className="font-semibold text-success-600">{analytics.completedOrders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-admin-600">Cancelled Orders</span>
              <span className="font-semibold text-red-600">{analytics.cancelledOrders}</span>
            </div>
            <div className="pt-3 border-t border-admin-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-admin-600">Monthly Growth</span>
                <div className="flex items-center">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-success-500 mr-1" />
                  <span className="font-semibold text-success-600">+{formatPercentage(analytics.monthlyGrowth)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Performance Indicators */}
        <Card variant="admin" className="p-6">
          <h3 className="text-lg font-semibold text-admin-900 mb-6">Performance Indicators</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-admin-600">Order Completion Rate</span>
                <span className="font-medium text-admin-900">{formatPercentage(analytics.completionRate)}</span>
              </div>
              <div className="w-full h-2 bg-admin-200 rounded-full">
                <div 
                  className="h-2 bg-success-500 rounded-full transition-all duration-300"
                  style={{ width: `${analytics.completionRate}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-admin-600">Customer Satisfaction</span>
                <span className="font-medium text-admin-900">94.5%</span>
              </div>
              <div className="w-full h-2 bg-admin-200 rounded-full">
                <div className="h-2 bg-primary-500 rounded-full transition-all duration-300" style={{ width: '94.5%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-admin-600">On-Time Delivery</span>
                <span className="font-medium text-admin-900">98.2%</span>
              </div>
              <div className="w-full h-2 bg-admin-200 rounded-full">
                <div className="h-2 bg-trust-500 rounded-full transition-all duration-300" style={{ width: '98.2%' }}></div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Last Updated Info */}
      <Card variant="admin" className="p-4">
        <div className="flex items-center justify-between text-sm text-admin-600">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4" />
            <span>Last updated: {lastUpdated.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Total Records: {rawRequests.length}</span>
            <span>Data Range: {timeRange}</span>
          </div>
        </div>
      </Card>

      {/* Export Modal */}
      <DataExport
        data={getExportData()}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        filename={`analytics_${timeRange}_${new Date().toISOString().split('T')[0]}`}
        title="Export Analytics Data"
      />
    </div>
  )
}