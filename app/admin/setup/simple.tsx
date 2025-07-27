'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

export default function SimpleAdminSetup() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [setupLoading, setSetupLoading] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        console.log('✅ User found:', session.user.email)
        
        // Try to get profile
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (!profileError && profileData) {
            setProfile(profileData)
            console.log('✅ Profile found:', profileData)
          } else {
            console.log('⚠️ Profile not found or error:', profileError)
          }
        } catch (profileErr) {
          console.log('⚠️ Profile fetch failed:', profileErr)
        }
      } else {
        console.log('❌ No user session found')
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const makeAdmin = async () => {
    if (!user) {
      toast.error('Please login first')
      return
    }

    setSetupLoading(true)

    try {
      console.log('🔧 Making user admin:', user.email)
      
      // Use our proven raw fetch approach
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
        toast.success('You are now an admin! Redirecting to admin dashboard...')
        
        // Update local state
        setProfile({ ...profile, role: 'admin' })
        
        // Redirect after a delay
        setTimeout(() => {
          window.location.href = '/admin'
        }, 2000)
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
        <p className="text-center mt-4">Checking user session...</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">🔧 Admin Setup (Simple)</h2>
      
      {/* Status Info */}
      <div className="mb-6 p-4 bg-gray-100 rounded text-sm space-y-2">
        <div>
          <strong>User:</strong> {user ? `${user.email} (${user.id.substring(0, 8)}...)` : 'Not logged in'}
        </div>
        <div>
          <strong>Profile:</strong> {profile ? `${profile.role} user` : 'No profile found'}
        </div>
      </div>

      <p className="text-gray-600 mb-4">
        Click below to make your current account an admin user.
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
          onClick={makeAdmin}
          disabled={setupLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {setupLoading ? 'Setting up...' : '🚀 Make Me Admin'}
        </button>
      )}
      
      <p className="text-xs text-gray-500 mt-4">
        This bypasses the AuthProvider to avoid loading issues.
      </p>
    </div>
  )
} 