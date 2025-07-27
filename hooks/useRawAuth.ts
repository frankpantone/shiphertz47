import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getRawSession, isAdmin, type RawSession } from '@/lib/auth-raw'

/**
 * React hook for raw authentication that bypasses Supabase client hanging issues
 * This replaces useAuth() for admin pages that need reliable loading
 */
export function useRawAuth() {
  const [session, setSession] = useState<RawSession>({
    user: null,
    profile: null,
    loading: true,
    error: null
  })
  const router = useRouter()

  const loadSession = useCallback(async () => {
    try {
      const sessionData = await getRawSession()
      setSession(sessionData)
      
      console.log('🔍 Raw auth session loaded:', {
        hasUser: !!sessionData.user,
        hasProfile: !!sessionData.profile,
        role: sessionData.profile?.role,
        isAdmin: sessionData.profile?.role === 'admin'
      })
    } catch (error) {
      console.error('Error loading raw session:', error)
      setSession({
        user: null,
        profile: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      })
    }
  }, [])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  // Stable admin access check
  const adminAccess = session.loading ? 'loading' : 
                     !session.user ? 'not-authenticated' :
                     !isAdmin(session.profile) ? 'not-admin' : 'admin'

  // Stable redirect functions using useCallback
  const redirectToLogin = useCallback(() => {
    router.push('/auth/login')
  }, [router])

  const redirectToDashboard = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  return {
    user: session.user,
    profile: session.profile,
    loading: session.loading,
    error: session.error,
    isAdmin: session.profile?.role === 'admin',
    isAuthenticated: !!session.user,
    adminAccess,
    redirectToLogin,
    redirectToDashboard,
    reload: loadSession
  }
} 