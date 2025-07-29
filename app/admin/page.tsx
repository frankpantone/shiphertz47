'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { 
  ClipboardDocumentListIcon,
  UserGroupIcon,
  TruckIcon,
  PlusIcon,
  EyeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { useRawAuth } from '@/hooks/useRawAuth'
import { Card, Badge, Button } from '@/components/ui'
import { useAdminStats } from '@/components/admin/AdminStatsProvider'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, profile, loading, error, adminAccess, redirectToLogin, redirectToDashboard } = useRawAuth()
  const { 
    totalRequests, 
    newRequests, 
    myAssignedRequests, 
    completedRequests,
    loading: statsLoading 
  } = useAdminStats()

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
  }, [adminAccess, redirectToLogin, redirectToDashboard])

  // Show loading while checking authentication
  if (adminAccess === 'loading' || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        <div className="ml-4">
          <p className="text-gray-600">
            {adminAccess === 'loading' ? 'Checking authentication...' : 'Loading dashboard...'}
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-admin-900 mb-2">
            Dashboard Overview
          </h1>
          <p className="text-admin-600">
            Welcome back! Here's what's happening with your auto logistics operations.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="admin-secondary" size="sm">
            <ClockIcon className="h-4 w-4" />
            Last updated: 2 min ago
          </Button>
          <Button variant="admin-primary">
            Generate Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-admin-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-admin-900">${(totalRequests * 1247).toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <ArrowUpIcon className="h-4 w-4 text-success-500 mr-1" />
                <span className="text-sm text-success-600 font-medium">+12.5%</span>
                <span className="text-sm text-admin-500 ml-2">vs last month</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-admin-600 mb-1">Active Orders</p>
              <p className="text-3xl font-bold text-admin-900">{totalRequests}</p>
              <div className="flex items-center mt-2">
                <ArrowUpIcon className="h-4 w-4 text-success-500 mr-1" />
                <span className="text-sm text-success-600 font-medium">+8.2%</span>
                <span className="text-sm text-admin-500 ml-2">this week</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-warning-100 rounded-xl flex items-center justify-center">
              <ClipboardDocumentListIcon className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-admin-600 mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-admin-900">94.2%</p>
              <div className="flex items-center mt-2">
                <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-sm text-red-600 font-medium">-2.1%</span>
                <span className="text-sm text-admin-500 ml-2">needs attention</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-success-100 rounded-xl flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </Card>

        <Card variant="admin" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-admin-600 mb-1">Avg. Response Time</p>
              <p className="text-3xl font-bold text-admin-900">2.4h</p>
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

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2">
          <Card variant="admin" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-admin-900">Recent Orders</h2>
              <div className="flex items-center space-x-2">
                <Badge variant="pending">5 New</Badge>
                <Button variant="admin-secondary" size="sm">View All</Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-admin-200">
                    <th className="text-left py-3 px-4 font-medium text-admin-600 text-sm">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium text-admin-600 text-sm">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-admin-600 text-sm">Route</th>
                    <th className="text-left py-3 px-4 font-medium text-admin-600 text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-admin-600 text-sm">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-100">
                  {[1,2,3,4,5].map((i) => (
                    <tr key={i} className="hover:bg-admin-50">
                      <td className="py-3 px-4 text-sm font-medium text-admin-900">#ORD-{1000 + i}</td>
                      <td className="py-3 px-4 text-sm text-admin-700">John Smith</td>
                      <td className="py-3 px-4 text-sm text-admin-600">NY → CA</td>
                      <td className="py-3 px-4">
                        <Badge variant={i <= 2 ? 'pending' : i <= 4 ? 'quoted' : 'completed'} size="sm">
                          {i <= 2 ? 'New' : i <= 4 ? 'In Transit' : 'Delivered'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-admin-900">${(1200 + i * 100).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          {/* Priority Actions */}
          <Card variant="admin" className="p-6">
            <h3 className="text-lg font-semibold text-admin-900 mb-4">Priority Actions</h3>
            <div className="space-y-3">
              <Link
                href="/admin/orders/new"
                className="flex items-center justify-between p-3 bg-warning-50 hover:bg-warning-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-warning-100 rounded-lg flex items-center justify-center mr-3">
                    <PlusIcon className="h-4 w-4 text-warning-600" />
                  </div>
                  <div>
                    <p className="font-medium text-admin-900">New Orders</p>
                    <p className="text-sm text-admin-600">Require assignment</p>
                  </div>
                </div>
                <Badge variant="warning">{newRequests}</Badge>
              </Link>

              <Link
                href="/admin/orders/assigned"
                className="flex items-center justify-between p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                    <UserGroupIcon className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-admin-900">My Orders</p>
                    <p className="text-sm text-admin-600">Need attention</p>
                  </div>
                </div>
                <Badge variant="admin">{myAssignedRequests}</Badge>
              </Link>
            </div>
          </Card>

          {/* Performance Metrics */}
          <Card variant="admin" className="p-6">
            <h3 className="text-lg font-semibold text-admin-900 mb-4">This Week</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-admin-600">Orders Completed</span>
                <span className="font-semibold text-admin-900">{completedRequests}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-admin-600">Revenue Generated</span>
                <span className="font-semibold text-success-600">${(completedRequests * 1200).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-admin-600">Customer Satisfaction</span>
                <span className="font-semibold text-admin-900">4.8/5.0</span>
              </div>
              <div className="pt-2 border-t border-admin-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-admin-600">Weekly Target</span>
                  <span className="text-sm text-admin-900">85% Complete</span>
                </div>
                <div className="w-full bg-admin-200 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full" style={{width: '85%'}}></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* System Health & Quick Links */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card variant="admin" className="p-6">
          <h3 className="text-lg font-semibold text-admin-900 mb-4">System Health</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-admin-600">Authentication System</span>
              <Badge variant="success" size="sm">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-admin-600">Payment Processing</span>
              <Badge variant="success" size="sm">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-admin-600">Carrier Network</span>
              <Badge variant="success" size="sm">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-admin-600">Data Backup</span>
              <Badge variant="warning" size="sm">In Progress</Badge>
            </div>
            <div className="pt-3 border-t border-admin-200">
              <p className="text-xs text-admin-500">
                Last system check: 5 minutes ago
              </p>
            </div>
          </div>
        </Card>

        <Card variant="admin" className="p-6">
          <h3 className="text-lg font-semibold text-admin-900 mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="admin-secondary" 
              size="sm" 
              className="h-16 flex flex-col items-center justify-center gap-1"
              onClick={() => router.push('/admin/analytics')}
            >
              <ChartBarIcon className="h-5 w-5" />
              <span>Analytics</span>
            </Button>
            <Button 
              variant="admin-secondary" 
              size="sm" 
              className="h-16 flex flex-col items-center justify-center gap-1"
              onClick={() => router.push('/admin/customers')}
            >
              <UserGroupIcon className="h-5 w-5" />
              <span>Customers</span>
            </Button>
            <Button 
              variant="admin-secondary" 
              size="sm" 
              className="h-16 flex flex-col items-center justify-center gap-1"
              onClick={() => router.push('/admin/fleet')}
            >
              <TruckIcon className="h-5 w-5" />
              <span>Fleet</span>
            </Button>
            <Button 
              variant="admin-secondary" 
              size="sm" 
              className="h-16 flex flex-col items-center justify-center gap-1"
              onClick={() => router.push('/admin/settings')}
            >
              <EyeIcon className="h-5 w-5" />
              <span>Settings</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
} 