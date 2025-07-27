// Raw authentication utilities that bypass Supabase client hanging issues
// This provides the same functionality as AuthProvider but with reliable raw fetch calls

interface RawUser {
  id: string
  email: string
}

interface RawProfile {
  id: string
  email: string
  full_name?: string
  phone?: string
  company_name?: string
  role: 'customer' | 'admin'
  created_at: string
  updated_at: string
}

export interface RawSession {
  user: RawUser | null
  profile: RawProfile | null
  loading: boolean
  error: string | null
}

interface RawLoginResult {
  success: boolean
  user?: RawUser
  profile?: RawProfile | null
  error?: string
  accessToken?: string
}

// Supabase configuration
const SUPABASE_URL = 'https://sxhuqsrnxfunoasutezm.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aHVxc3JueGZ1bm9hc3V0ZXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NzQzMjMsImV4cCI6MjA2ODQ1MDMyM30.acV66qx3m1AgGZxPnqVWDbwODhqcAM_y8cTGNfc3hk0'

/**
 * Raw login function that bypasses Supabase client
 */
export async function rawLogin(email: string, password: string): Promise<RawLoginResult> {
  try {
    console.log('🔐 Starting raw login for:', email)
    
    // Call Supabase Auth API directly
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email,
        password
      })
    })

    const data = await response.json()
    console.log('🔐 Raw login response:', { status: response.status, ok: response.ok })

    if (!response.ok) {
      console.error('🔐 Login failed:', data)
      return {
        success: false,
        error: data.error_description || data.msg || 'Login failed'
      }
    }

    if (!data.access_token || !data.user) {
      return {
        success: false,
        error: 'Invalid response from authentication server'
      }
    }

    const user: RawUser = {
      id: data.user.id,
      email: data.user.email
    }

    // Store the session in localStorage (similar to Supabase client)
    const sessionData = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
      expires_at: data.expires_at,
      expires_in: data.expires_in
    }
    
    localStorage.setItem(`sb-${SUPABASE_URL.split('.')[0].split('//')[1]}-auth-token`, JSON.stringify(sessionData))

    // Fetch user profile with access token
    const profile = await getRawProfile(user.id, data.access_token)

    console.log('✅ Raw login successful:', { user, profile })

    return {
      success: true,
      user,
      profile,
      accessToken: data.access_token
    }

  } catch (error: any) {
    console.error('🔐 Raw login error:', error)
    return {
      success: false,
      error: error.message || 'Network error during login'
    }
  }
}

/**
 * Raw logout function
 */
export async function rawLogout(): Promise<{ success: boolean; error?: string }> {
  try {
    // Clear localStorage
    localStorage.removeItem(`sb-${SUPABASE_URL.split('.')[0].split('//')[1]}-auth-token`)
    
    // Optionally call Supabase logout endpoint
    const response = await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error('Logout error:', error)
    return { 
      success: false, 
      error: error.message || 'Logout failed' 
    }
  }
}

/**
 * Get current session using localStorage (bypasses Supabase client)
 */
export async function getRawSession(): Promise<RawSession> {
  try {
    // Try to get session from localStorage first
    const sessionKey = `sb-${SUPABASE_URL.split('.')[0].split('//')[1]}-auth-token`
    const sessionData = localStorage.getItem(sessionKey)
    
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData)
        if (session.user && session.access_token) {
          const user: RawUser = {
            id: session.user.id,
            email: session.user.email
          }

          // Fetch profile using raw fetch with access token
          const profile = await getRawProfile(user.id, session.access_token)

          return {
            user,
            profile,
            loading: false,
            error: null
          }
        }
      } catch (parseError) {
        console.error('Error parsing session data:', parseError)
      }
    }

    // Fallback: return empty session
    return {
      user: null,
      profile: null,
      loading: false,
      error: null
    }

  } catch (error: any) {
    console.error('Error getting raw session:', error)
    return {
      user: null,
      profile: null,
      loading: false,
      error: error.message || 'Failed to get session'
    }
  }
}

/**
 * Fetch user profile using raw fetch (bypasses Supabase client)
 */
export async function getRawProfile(userId: string, accessToken?: string): Promise<RawProfile | null> {
  console.log('🔍 Fetching profile for user:', userId, 'with token:', !!accessToken)
  
  // First try: Direct API call with access token
  if (accessToken) {
    try {
      const headers: Record<string, string> = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
        headers
      })

      console.log('🔍 Direct profile fetch response:', response.status, response.ok)

      if (response.ok) {
        const profiles = await response.json()
        console.log('🔍 Direct profile fetch result:', profiles)
        
        const profile = profiles[0] || null
        if (profile) {
          console.log('✅ Profile found via direct fetch:', { id: profile.id, email: profile.email, role: profile.role })
          return profile
        }
      } else {
        const errorText = await response.text()
        console.log('⚠️ Direct fetch failed (trying fallback):', response.status, errorText)
      }
    } catch (error) {
      console.log('⚠️ Direct fetch error (trying fallback):', error)
    }
  }
  
  // Second try: Use API route fallback (bypasses RLS with service role)
  try {
    console.log('🔄 Trying API route fallback...')
    
    const response = await fetch(`/api/profile/${userId}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log('🔍 API route response:', response.status, response.ok)

    if (response.ok) {
      const profile = await response.json()
      console.log('✅ Profile found via API route:', { id: profile.id, email: profile.email, role: profile.role })
      return profile
    } else {
      const errorData = await response.json()
      console.error('❌ API route failed:', response.status, errorData)
    }
  } catch (error) {
    console.error('❌ API route error:', error)
  }

  console.log('❌ All profile fetch methods failed for user:', userId)
  return null
}

/**
 * Fetch transportation requests using raw fetch
 */
export async function getRawRequests(filters?: {
  status?: string
  assigned_admin_id?: string | null
  user_id?: string
}): Promise<any[]> {
  try {
    let url = `${SUPABASE_URL}/rest/v1/transportation_requests?select=*&order=created_at.desc`
    
    // Add filters
    if (filters?.status) {
      url += `&status=eq.${filters.status}`
    }
    if (filters?.assigned_admin_id === null) {
      url += `&assigned_admin_id=is.null`
    } else if (filters?.assigned_admin_id) {
      url += `&assigned_admin_id=eq.${filters.assigned_admin_id}`
    }
    if (filters?.user_id) {
      url += `&user_id=eq.${filters.user_id}`
    }

    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Requests fetch failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching raw requests:', error)
    return []
  }
}

/**
 * Update transportation request using raw fetch
 */
export async function updateRawRequest(
  requestId: string, 
  updates: Record<string, any>
): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/transportation_requests?id=eq.${requestId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updates)
    })

    return response.ok
  } catch (error) {
    console.error('Error updating raw request:', error)
    return false
  }
}

/**
 * Check if user is admin
 */
export function isAdmin(profile: RawProfile | null): boolean {
  return profile?.role === 'admin'
}

/**
 * Redirect to login if not authenticated
 */
export function requireAuth(session: RawSession): boolean {
  if (!session.user) {
    window.location.href = '/auth/login'
    return false
  }
  return true
}

/**
 * Redirect to dashboard if not admin
 */
export function requireAdmin(session: RawSession): boolean {
  if (!requireAuth(session)) return false
  
  if (!isAdmin(session.profile)) {
    window.location.href = '/dashboard'
    return false
  }
  return true
} 