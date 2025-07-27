'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { rawLogin } from '@/lib/auth-raw'

export default function LoginPage() {
  const [email, setEmail] = useState('bodielago@gmail.com') // Pre-filled for testing
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('🔐 Starting login process for:', email)
      
      const result = await rawLogin(email, password)

      if (result.success && result.user) {
        console.log('✅ Login successful:', result.user)
        toast.success('Successfully logged in!')
        
        // Force a page refresh to update auth state across the app
        window.location.href = redirectTo
      } else {
        console.error('❌ Login failed:', result.error)
        
        // Provide user-friendly error messages
        let errorMessage = result.error || 'Login failed'
        
        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials.'
        } else if (errorMessage.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before logging in.'
        } else if (errorMessage.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a moment and try again.'
        }
        
        toast.error(errorMessage)
      }
    } catch (error: any) {
      console.error('🔐 Login error:', error)
      toast.error(`Login failed: ${error.message || 'Network error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error('Please enter your email address first')
      return
    }

    try {
      // You could implement this with raw fetch if needed
      toast('Please contact support to resend confirmation email')
    } catch (error) {
      toast.error('Failed to resend confirmation email')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href="/auth/signup"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              create a new account
            </Link>
          </p>
          
          {/* Help text for email confirmation */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              📧 <strong>Important:</strong> You must confirm your email address before logging in. 
              Check your inbox for a confirmation email from Supabase.
            </p>
          </div>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleResendConfirmation}
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Didn't receive confirmation email? Click to resend
            </button>
          </div>
        </form>

        {/* Debug info */}
        <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-xs text-gray-600">
            🔧 <strong>Using Raw Authentication:</strong> This login now bypasses the problematic Supabase client and uses direct API calls for reliable authentication.
          </p>
        </div>
      </div>
    </div>
  )
} 