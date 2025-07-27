'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'

export default function RawAdminSetupPage() {
  const [setupLoading, setSetupLoading] = useState(false)
  const [result, setResult] = useState('')

  const makeCurrentUserAdmin = async () => {
    setSetupLoading(true)
    setResult('')

    try {
      console.log('🔧 Starting admin setup via API...')
      
      // Use the hardcoded user ID that we know exists from previous testing
      const userId = '764a6428-4b01-420f-8b69-3dffea3e883f'
      
      console.log('📤 Making API request to update role...')
      
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId
        })
      })

      console.log('📋 API response status:', response.status)

      const apiResult = await response.json()

      if (response.ok && apiResult.success) {
        console.log('✅ Admin setup successful:', apiResult)
        setResult(`✅ SUCCESS! User ${userId} is now an admin!`)
        toast.success('Admin role updated! Go to /admin to test the dashboard.')
      } else {
        console.error('❌ Admin setup failed:', apiResult)
        setResult(`❌ Error: ${apiResult.error || 'Unknown error'}`)
        toast.error(`Failed: ${apiResult.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('Error updating role:', error)
      setResult(`💥 Exception: ${error.message}`)
      toast.error(`Exception: ${error.message}`)
    } finally {
      setSetupLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">API Admin Setup</h1>
        
        <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">🔧 Server-Side Admin Setup</h2>
          
          <div className="mb-6 p-4 bg-blue-50 rounded text-sm">
            <p><strong>This will make user:</strong></p>
            <p className="font-mono text-xs">bodielago@gmail.com</p>
            <p className="font-mono text-xs">764a6428-4b01-420f-8b69-3dffea3e883f</p>
            <p className="mt-2"><strong>Into an admin user via server API (bypasses RLS).</strong></p>
          </div>

          <p className="text-gray-600 mb-4">
            This uses an API route with service role permissions to bypass RLS policies.
          </p>
          
          <button
            onClick={makeCurrentUserAdmin}
            disabled={setupLoading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 mb-4"
          >
            {setupLoading ? 'Updating...' : '🚀 Make Admin via API'}
          </button>

          {result && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
              <strong>Result:</strong>
              <div className="mt-2">{result}</div>
            </div>
          )}

          <div className="mt-6 space-y-2">
            <a 
              href="/admin/raw" 
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 block text-center"
            >
              Test Raw Admin Dashboard
            </a>
            <a 
              href="/auth/login" 
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 block text-center"
            >
              Login First
            </a>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            This uses server-side API with service role key to bypass RLS infinite recursion.
          </p>
        </div>
      </div>
    </div>
  )
} 