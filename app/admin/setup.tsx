'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { toast } from 'react-hot-toast'

export default function AdminSetup() {
  const { user, profile, loading } = useAuth()
  const [setupLoading, setSetupLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    // Debug info
    setDebugInfo({
      user: user ? { id: user.id, email: user.email } : null,
      profile: profile ? { id: profile.id, email: profile.email, role: profile.role } : null,
      loading
    })
  }, [user, profile, loading])

  const makeCurrentUserAdmin = async () => {
    if (!user) {
      toast.error('Please login first')
      return
    }

    setSetupLoading(true)

    try {
      console.log('🔧 Making user admin:', user.email)
      console.log('🔍 Current user data:', { id: user.id, email: user.email })
      
      const response = await fetch(`https://sxhuqsrnxfunoasutezm.supabase.co/rest/v1/profiles?id=eq.${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aHVxc3JueGZ1bm9hc3V0ZXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NzQzMjMsImV4cCI6MjA2ODQ1MDMyM30.acV66qx3m1AgGZxPnqVWDbwODhqcAM_y8cTGNfc3hk0',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          role: 'admin'
        })
      })

      console.log('📋 Response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ User updated to admin:', result)
        toast.success('You are now an admin! Please refresh the page.')
      } else {
        const error = await response.text()
        console.error('❌ Failed to update role:', error)
        toast.error(`Failed to update role: ${error}`)
      }
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Failed to update user role')
    } finally {
      setSetupLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-center mt-4">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">🔧 Admin Setup</h2>
      
      {/* Debug Information */}
      <div className="mb-6 p-4 bg-gray-100 rounded text-sm">
        <h3 className="font-bold mb-2">Debug Info:</h3>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <p className="text-gray-600 mb-4">
        Click below to make your current account an admin user so you can test the admin dashboard.
      </p>
      
      {!user ? (
        <div className="space-y-4">
          <p className="text-red-600 text-sm">⚠️ Please login first</p>
          <a 
            href="/auth/login" 
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 block text-center"
          >
            Go to Login
          </a>
        </div>
      ) : profile?.role === 'admin' ? (
        <div className="space-y-4">
          <p className="text-green-600 text-sm">✅ You are already an admin!</p>
          <a 
            href="/admin" 
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 block text-center"
          >
            Go to Admin Dashboard
          </a>
        </div>
      ) : (
        <button
          onClick={makeCurrentUserAdmin}
          disabled={setupLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {setupLoading ? 'Setting up...' : '🚀 Make Me Admin'}
        </button>
      )}
      
      <p className="text-xs text-gray-500 mt-4">
        This is a temporary setup utility. In production, admin roles would be set by a super admin.
      </p>
    </div>
  )
} 