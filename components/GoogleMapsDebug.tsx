'use client'

import { useEffect, useState } from 'react'
import { initializeGoogleMaps } from '@/lib/google-maps-fixed'

export default function GoogleMapsDebug() {
  const [debugInfo, setDebugInfo] = useState<{
    apiKey: string
    status: string
    error?: string
    loadTime?: number
  }>({
    apiKey: '',
    status: 'checking'
  })

  useEffect(() => {
    const testGoogleMaps = async () => {
      const startTime = Date.now()
      
      // Check API key
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
      
      setDebugInfo(prev => ({
        ...prev,
        apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET',
        status: 'loading'
      }))

      try {
        await initializeGoogleMaps()
        const loadTime = Date.now() - startTime
        
        setDebugInfo(prev => ({
          ...prev,
          status: 'success',
          loadTime
        }))
      } catch (error: any) {
        setDebugInfo(prev => ({
          ...prev,
          status: 'error',
          error: error.message,
          loadTime: Date.now() - startTime
        }))
      }
    }

    testGoogleMaps()
  }, [])

  const getStatusColor = () => {
    switch (debugInfo.status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      case 'loading': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = () => {
    switch (debugInfo.status) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'loading': return '🔄'
      default: return '🔍'
    }
  }

  return (
    <div className={`p-4 border rounded-lg ${getStatusColor()}`}>
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-lg">{getStatusIcon()}</span>
        <h3 className="font-medium">Google Maps API Status</h3>
      </div>
      
      <div className="space-y-1 text-sm">
        <div><strong>API Key:</strong> {debugInfo.apiKey}</div>
        <div><strong>Status:</strong> {debugInfo.status}</div>
        {debugInfo.loadTime && (
          <div><strong>Load Time:</strong> {debugInfo.loadTime}ms</div>
        )}
        {debugInfo.error && (
          <div><strong>Error:</strong> {debugInfo.error}</div>
        )}
      </div>

      {debugInfo.status === 'error' && (
        <div className="mt-3 p-3 bg-white border rounded text-sm">
          <h4 className="font-medium text-red-800 mb-2">Common Solutions:</h4>
          <ul className="space-y-1 text-red-700">
            <li>• Check if your Google Maps API key is valid</li>
            <li>• Enable Places API and Maps JavaScript API in Google Cloud Console</li>
            <li>• Add localhost:3001 to authorized domains</li>
            <li>• Check if billing is enabled for your Google Cloud project</li>
            <li>• Verify API usage limits haven't been exceeded</li>
          </ul>
        </div>
      )}

      {debugInfo.status === 'success' && (
        <div className="mt-2 text-xs">
          Google Maps is working correctly! If autocomplete still isn't working, 
          check the browser console for JavaScript errors.
        </div>
      )}
    </div>
  )
} 