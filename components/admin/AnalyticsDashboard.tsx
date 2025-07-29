'use client'

import { useMemo } from 'react'
import { 
  ChartBarIcon, 
  TruckIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { Card, Badge } from '@/components/ui'

interface TransportationRequest {
  id: string
  order_number: string
  status: string
  created_at: string
  assigned_admin_id?: string
  total_amount?: number
  pickup_company_name: string
  delivery_company_name: string
}

interface AnalyticsData {
  requests: TransportationRequest[]
  timeframe: 'today' | 'week' | 'month' | 'quarter' | 'year'
}

interface KPICard {
  title: string
  value: string | number
  change?: {
    value: number
    trend: 'up' | 'down' | 'neutral'
    timeframe: string
  }
  icon: React.ComponentType<{ className?: string }>
  color: 'primary' | 'success' | 'warning' | 'danger' | 'admin'
}

export default function AnalyticsDashboard({ requests, timeframe }: AnalyticsData) {
  // Calculate KPIs
  const analytics = useMemo(() => {
    const now = new Date()
    const timeframes = {
      today: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getFullYear(), now.getMonth(), 1),
      quarter: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1),
      year: new Date(now.getFullYear(), 0, 1)
    }

    const currentPeriodStart = timeframes[timeframe]
    const currentPeriodRequests = requests.filter(r => 
      new Date(r.created_at) >= currentPeriodStart
    )

    // Calculate previous period for comparison
    const periodLength = now.getTime() - currentPeriodStart.getTime()
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - periodLength)
    const previousPeriodRequests = requests.filter(r => {
      const date = new Date(r.created_at)
      return date >= previousPeriodStart && date < currentPeriodStart
    })

    // Status counts
    const statusCounts = currentPeriodRequests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const previousStatusCounts = previousPeriodRequests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Revenue calculations
    const totalRevenue = currentPeriodRequests
      .filter(r => r.total_amount && r.status === 'completed')
      .reduce((sum, r) => sum + (r.total_amount || 0), 0)

    const previousRevenue = previousPeriodRequests
      .filter(r => r.total_amount && r.status === 'completed')
      .reduce((sum, r) => sum + (r.total_amount || 0), 0)

    // Conversion rates
    const quotedCount = statusCounts.quoted || 0
    const acceptedCount = statusCounts.accepted || 0
    const completedCount = statusCounts.completed || 0
    const totalCount = currentPeriodRequests.length

    const conversionRate = totalCount > 0 ? ((acceptedCount + completedCount) / totalCount) * 100 : 0
    const completionRate = (acceptedCount + quotedCount) > 0 ? (completedCount / (acceptedCount + quotedCount)) * 100 : 0

    // Previous period rates for comparison
    const prevQuotedCount = previousStatusCounts.quoted || 0
    const prevAcceptedCount = previousStatusCounts.accepted || 0
    const prevCompletedCount = previousStatusCounts.completed || 0
    const prevTotalCount = previousPeriodRequests.length

    const prevConversionRate = prevTotalCount > 0 ? ((prevAcceptedCount + prevCompletedCount) / prevTotalCount) * 100 : 0
    const prevCompletionRate = (prevAcceptedCount + prevQuotedCount) > 0 ? (prevCompletedCount / (prevAcceptedCount + prevQuotedCount)) * 100 : 0

    // Average processing time (mock calculation)
    const avgProcessingTime = currentPeriodRequests.length > 0 ? 
      Math.floor(Math.random() * 48) + 24 : 0 // Mock: 24-72 hours

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return { value: 0, trend: 'neutral' as const }
      const change = ((current - previous) / previous) * 100
      return {
        value: Math.abs(change),
        trend: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const
      }
    }

    return {
      currentPeriod: currentPeriodRequests,
      previousPeriod: previousPeriodRequests,
      statusCounts,
      totalRevenue,
      conversionRate,
      completionRate,
      avgProcessingTime,
      changes: {
        totalOrders: calculateChange(totalCount, prevTotalCount),
        revenue: calculateChange(totalRevenue, previousRevenue),
        conversion: calculateChange(conversionRate, prevConversionRate),
        completion: calculateChange(completionRate, prevCompletionRate)
      }
    }
  }, [requests, timeframe])

  const getTimeframeLabel = (timeframe: string) => {
    switch (timeframe) {
      case 'today': return 'Today'
      case 'week': return 'This Week'
      case 'month': return 'This Month'
      case 'quarter': return 'This Quarter'
      case 'year': return 'This Year'
      default: return 'Period'
    }
  }

  const kpiCards: KPICard[] = [
    {
      title: 'Total Orders',
      value: analytics.currentPeriod.length,
      change: {
        ...analytics.changes.totalOrders,
        timeframe: `vs last ${timeframe}`
      },
      icon: TruckIcon,
      color: 'admin'
    },
    {
      title: 'Revenue',
      value: `$${analytics.totalRevenue.toLocaleString()}`,
      change: {
        ...analytics.changes.revenue,
        timeframe: `vs last ${timeframe}`
      },
      icon: CurrencyDollarIcon,
      color: 'success'
    },
    {
      title: 'Conversion Rate',
      value: `${analytics.conversionRate.toFixed(1)}%`,
      change: {
        ...analytics.changes.conversion,
        timeframe: `vs last ${timeframe}`
      },
      icon: ArrowTrendingUpIcon,
      color: 'primary'
    },
    {
      title: 'Completion Rate',
      value: `${analytics.completionRate.toFixed(1)}%`,
      change: {
        ...analytics.changes.completion,
        timeframe: `vs last ${timeframe}`
      },
      icon: CheckCircleIcon,
      color: 'success'
    },
    {
      title: 'Avg Processing Time',
      value: `${analytics.avgProcessingTime}h`,
      change: {
        value: Math.floor(Math.random() * 10) + 5,
        trend: Math.random() > 0.5 ? 'down' : 'up',
        timeframe: `vs last ${timeframe}`
      },
      icon: ClockIcon,
      color: 'warning'
    },
    {
      title: 'Pending Orders',
      value: analytics.statusCounts.pending || 0,
      icon: ExclamationTriangleIcon,
      color: 'warning'
    }
  ]

  const statusDistribution = [
    { label: 'Pending', value: analytics.statusCounts.pending || 0, color: 'bg-warning-500' },
    { label: 'Quoted', value: analytics.statusCounts.quoted || 0, color: 'bg-trust-500' },
    { label: 'Accepted', value: analytics.statusCounts.accepted || 0, color: 'bg-primary-500' },
    { label: 'In Progress', value: analytics.statusCounts.in_progress || 0, color: 'bg-admin-500' },
    { label: 'Completed', value: analytics.statusCounts.completed || 0, color: 'bg-success-500' },
    { label: 'Cancelled', value: analytics.statusCounts.cancelled || 0, color: 'bg-red-500' }
  ].filter(status => status.value > 0)

  const maxStatusValue = Math.max(...statusDistribution.map(s => s.value))

  // Generate mock daily data for the last 7 days
  const dailyData = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayRequests = requests.filter(r => {
        const reqDate = new Date(r.created_at)
        return reqDate.toDateString() === date.toDateString()
      })
      days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        orders: dayRequests.length,
        revenue: dayRequests
          .filter(r => r.total_amount && r.status === 'completed')
          .reduce((sum, r) => sum + (r.total_amount || 0), 0)
      })
    }
    return days
  }, [requests])

  const maxDailyOrders = Math.max(...dailyData.map(d => d.orders))
  const maxDailyRevenue = Math.max(...dailyData.map(d => d.revenue))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-admin-900">Analytics Overview</h2>
          <p className="text-admin-600 mt-1">{getTimeframeLabel(timeframe)} performance metrics</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-admin-600">
          <CalendarIcon className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <Card key={index} variant="admin" className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-admin-600">{kpi.title}</p>
                  <p className="text-2xl font-bold text-admin-900 mt-1">{kpi.value}</p>
                  {kpi.change && (
                    <div className="flex items-center mt-2">
                      {kpi.change.trend === 'up' ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 text-success-600" />
                      ) : kpi.change.trend === 'down' ? (
                        <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
                      ) : (
                        <div className="h-4 w-4" />
                      )}
                      <span className={`text-xs ml-1 ${
                        kpi.change.trend === 'up' ? 'text-success-600' : 
                        kpi.change.trend === 'down' ? 'text-red-600' : 'text-admin-500'
                      }`}>
                        {kpi.change.value.toFixed(1)}% {kpi.change.timeframe}
                      </span>
                    </div>
                  )}
                </div>
                <div className={`p-2 rounded-lg ${
                  kpi.color === 'primary' ? 'bg-primary-100' :
                  kpi.color === 'success' ? 'bg-success-100' :
                  kpi.color === 'warning' ? 'bg-warning-100' :
                  kpi.color === 'danger' ? 'bg-red-100' :
                  'bg-admin-100'
                }`}>
                  <Icon className={`h-5 w-5 ${
                    kpi.color === 'primary' ? 'text-primary-600' :
                    kpi.color === 'success' ? 'text-success-600' :
                    kpi.color === 'warning' ? 'text-warning-600' :
                    kpi.color === 'danger' ? 'text-red-600' :
                    'text-admin-600'
                  }`} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-admin-900">Order Status Distribution</h3>
            <ChartBarIcon className="h-5 w-5 text-admin-500" />
          </div>
          
          <div className="space-y-3">
            {statusDistribution.map((status, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${status.color}`} />
                  <span className="text-sm font-medium text-admin-900">{status.label}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-admin-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${status.color}`}
                      style={{ width: `${(status.value / maxStatusValue) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-admin-900 w-8 text-right">{status.value}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-admin-200">
            <div className="text-sm text-admin-600">
              Total: {statusDistribution.reduce((sum, s) => sum + s.value, 0)} orders
            </div>
          </div>
        </Card>

        {/* Daily Trend */}
        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-admin-900">7-Day Trend</h3>
            <ArrowTrendingUpIcon className="h-5 w-5 text-admin-500" />
          </div>
          
          <div className="space-y-3">
            {dailyData.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-admin-900 w-16">{day.date}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-admin-100 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-admin-500"
                        style={{ width: `${maxDailyOrders > 0 ? (day.orders / maxDailyOrders) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-admin-600 w-8">{day.orders}</span>
                  </div>
                </div>
                <div className="text-sm font-medium text-admin-900">
                  ${day.revenue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-admin-200 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-admin-600">Avg Daily Orders:</span>
              <span className="ml-2 font-medium text-admin-900">
                {(dailyData.reduce((sum, d) => sum + d.orders, 0) / dailyData.length).toFixed(1)}
              </span>
            </div>
            <div>
              <span className="text-admin-600">Total Revenue:</span>
              <span className="ml-2 font-medium text-admin-900">
                ${dailyData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Summary Statistics */}
      <Card variant="admin" className="p-6">
        <h3 className="text-lg font-semibold text-admin-900 mb-4">Summary Statistics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-admin-900">{analytics.currentPeriod.length}</div>
            <div className="text-sm text-admin-600">Total Orders</div>
            <div className="text-xs text-admin-500 mt-1">{getTimeframeLabel(timeframe)}</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-success-600">${analytics.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-admin-600">Revenue Generated</div>
            <div className="text-xs text-admin-500 mt-1">Completed orders only</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">{analytics.conversionRate.toFixed(1)}%</div>
            <div className="text-sm text-admin-600">Conversion Rate</div>
            <div className="text-xs text-admin-500 mt-1">Quote to completion</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-warning-600">{analytics.avgProcessingTime}h</div>
            <div className="text-sm text-admin-600">Avg Processing</div>
            <div className="text-xs text-admin-500 mt-1">From quote to completion</div>
          </div>
        </div>
      </Card>
    </div>
  )
}