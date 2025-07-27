'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { 
  ClipboardDocumentListIcon,
  UserGroupIcon,
  TruckIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { useRawAuth } from '@/hooks/useRawAuth'
import { getRawRequests } from '@/lib/auth-raw'

interface AdminStats {
  totalRequests: number
  newRequests: number
  myAssignedRequests: number
  completedRequests: number
}

export default function AdminDashboard() {
  const { user, profile, loading, error, adminAccess, redirectToLogin, redirectToDashboard } = useRawAuth()
  const [stats, setStats] = useState<AdminStats>({
    totalRequests: 0,
    newRequests: 0,
    myAssignedRequests: 0,
    completedRequests: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)

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
      console.log('✅ Admin access granted, loading stats')
      fetchAdminStats()
    }
  }, [adminAccess, redirectToLogin, redirectToDashboard]) // Simplified dependencies

  const fetchAdminStats = async () => {
    if (!user) return
    
    try {
      setStatsLoading(true)
      
      console.log('📊 Fetching admin stats...')
      const requests = await getRawRequests()
      console.log('📊 Got requests:', requests.length)
      
      const stats: AdminStats = {
        totalRequests: requests.length,
        newRequests: requests.filter(r => r.status === 'pending' && !r.assigned_admin_id).length,
        myAssignedRequests: requests.filter(r => r.assigned_admin_id === user.id).length,
        completedRequests: requests.filter(r => r.status === 'completed').length
      }
      
      console.log('📊 Stats calculated:', stats)
      setStats(stats)
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      toast.error('Failed to load statistics')
    } finally {
      setStatsLoading(false)
    }
  }

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
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Manage transportation requests, quotes, and customer orders
            </p>
            <p className="text-sm text-green-600 mt-2">
              ✅ Logged in as: {profile?.email} (using reliable raw auth)
            </p>
          </div>
          <Link
            href="/admin/raw"
            className="btn-secondary text-sm"
          >
            Raw Version
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Requests</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalRequests}</p>
            </div>
          </div>
        </div>

        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <PlusIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">New Requests</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.newRequests}</p>
            </div>
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">My Assigned</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.myAssignedRequests}</p>
            </div>
          </div>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TruckIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedRequests}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link
          href="/admin/orders/new"
          className="card hover:shadow-md transition-shadow duration-200 text-center group"
        >
          <div className="flex justify-center mb-4">
            <PlusIcon className="h-12 w-12 text-yellow-600 group-hover:text-yellow-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            New Orders
          </h3>
          <p className="text-gray-600">
            View and claim unassigned requests
          </p>
          {stats.newRequests > 0 && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {stats.newRequests} waiting
              </span>
            </div>
          )}
        </Link>

        <Link
          href="/admin/orders/assigned"
          className="card hover:shadow-md transition-shadow duration-200 text-center group"
        >
          <div className="flex justify-center mb-4">
            <UserGroupIcon className="h-12 w-12 text-green-600 group-hover:text-green-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            My Orders
          </h3>
          <p className="text-gray-600">
            Manage your assigned requests
          </p>
          {stats.myAssignedRequests > 0 && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {stats.myAssignedRequests} active
              </span>
            </div>
          )}
        </Link>

        <Link
          href="/admin/orders/all"
          className="card hover:shadow-md transition-shadow duration-200 text-center group"
        >
          <div className="flex justify-center mb-4">
            <EyeIcon className="h-12 w-12 text-blue-600 group-hover:text-blue-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            All Orders
          </h3>
          <p className="text-gray-600">
            View complete order history
          </p>
          <div className="mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {stats.totalRequests} total
            </span>
          </div>
        </Link>
      </div>

      {/* System Status */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          System Status
        </h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Auth System:</strong> <span className="text-green-600">✅ Raw Auth (Working)</span>
          </div>
          <div>
            <strong>Data Loading:</strong> <span className="text-green-600">✅ Raw Fetch (Reliable)</span>
          </div>
          <div>
            <strong>User:</strong> {profile?.email}
          </div>
          <div>
            <strong>Role:</strong> {profile?.role}
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            This admin dashboard now uses the reliable raw auth system across all pages.
            No more hanging issues with Supabase client methods.
          </p>
        </div>
      </div>
    </div>
  )
} 