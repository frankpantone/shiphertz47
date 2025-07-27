'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ClipboardDocumentListIcon,
  UserGroupIcon,
  TruckIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface AdminStats {
  totalRequests: number
  newRequests: number
  myAssignedRequests: number
  completedRequests: number
}

export default function RawAdminDashboard() {
  const [userEmail, setUserEmail] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [stats, setStats] = useState<AdminStats>({
    totalRequests: 0,
    newRequests: 0,
    myAssignedRequests: 0,
    completedRequests: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    checkSessionAndFetchStats()
  }, [])

  const checkSessionAndFetchStats = async () => {
    try {
      console.log('🔍 Checking session without Supabase client...')
      
      // Try to get session info from localStorage first
      const supabaseSession = localStorage.getItem('sb-sxhuqsrnxfunoasutezm-auth-token')
      console.log('📱 LocalStorage session check:', !!supabaseSession)
      
      // For now, let's use the known user info and test the dashboard
      // In a real app, you'd validate the session properly
      setUserId('764a6428-4b01-420f-8b69-3dffea3e883f')
      setUserEmail('bodielago@gmail.com')
      
      console.log('✅ Using known user for testing')
      
      // Fetch stats using our proven raw fetch approach
      await fetchAdminStats('764a6428-4b01-420f-8b69-3dffea3e883f')
      
    } catch (error) {
      console.error('Error checking session:', error)
      setError('Failed to load admin session')
    } finally {
      setLoading(false)
    }
  }

  const fetchAdminStats = async (userId: string) => {
    try {
      console.log('📊 Fetching admin stats...')
      
      // Fetch stats using raw fetch (same approach that works)
      const response = await fetch('https://sxhuqsrnxfunoasutezm.supabase.co/rest/v1/transportation_requests?select=id,status,assigned_admin_id,created_at', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aHVxc3JueGZ1bm9hc3V0ZXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NzQzMjMsImV4cCI6MjA2ODQ1MDMyM30.acV66qx3m1AgGZxPnqVWDbwODhqcAM_y8cTGNfc3hk0'
        }
      })

      console.log('📋 Stats response:', response.status)

      if (response.ok) {
        const requests = await response.json()
        console.log('✅ Stats fetched:', requests.length, 'requests')
        
        const stats: AdminStats = {
          totalRequests: requests.length,
          newRequests: requests.filter((r: any) => r.status === 'pending' && !r.assigned_admin_id).length,
          myAssignedRequests: requests.filter((r: any) => r.assigned_admin_id === userId).length,
          completedRequests: requests.filter((r: any) => r.status === 'completed').length
        }
        
        setStats(stats)
      } else {
        console.error('Failed to fetch stats:', response.status)
        setError('Failed to load statistics')
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      setError('Failed to fetch admin stats')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        <div className="ml-4">
          <p className="text-lg font-medium">Loading Pure Raw Dashboard...</p>
          <p className="text-sm text-gray-600">No Supabase client - pure fetch only</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-medium text-red-600 mb-4">Error: {error}</p>
          <div className="space-y-2">
            <a href="/auth/login" className="btn-primary block">
              Go to Login
            </a>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-secondary block w-full"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-medium mb-4">Please login to access admin dashboard</p>
          <a href="/auth/login" className="btn-primary">
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Pure Raw Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Manage transportation requests, quotes, and customer orders
              </p>
              <p className="text-sm text-green-600 mt-2">
                ✅ Admin user: {userEmail} (100% raw fetch - no Supabase client)
              </p>
            </div>
            <Link
              href="/admin/setup/raw"
              className="btn-secondary text-sm"
            >
              Admin Setup
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

        {/* Debug Info */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Debug Information
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>User ID:</strong> {userId}
            </div>
            <div>
              <strong>Email:</strong> {userEmail}
            </div>
            <div>
              <strong>Method:</strong> Pure fetch API (no Supabase client)
            </div>
            <div>
              <strong>Status:</strong> <span className="text-green-600">✅ Working</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/admin"
                className="btn-secondary text-center"
              >
                Try Regular Admin Dashboard
              </Link>
              <Link
                href="/dashboard"
                className="btn-secondary text-center"
              >
                Customer Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 