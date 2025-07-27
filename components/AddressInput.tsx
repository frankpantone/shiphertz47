'use client'

import { useEffect, useRef, useState } from 'react'
import { createAddressAutocomplete, AddressResult } from '@/lib/google-maps-fixed'

interface AddressInputProps {
  label: string
  placeholder: string
  value: string
  onChange: (address: string) => void
  onAddressSelected?: (result: AddressResult) => void
  required?: boolean
  error?: string
  disabled?: boolean
}

export default function AddressInput({
  label,
  placeholder,
  value,
  onChange,
  onAddressSelected,
  required = false,
  error,
  disabled = false
}: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    const initAutocomplete = async () => {
      if (!inputRef.current) {
        console.log('❌ No input ref available')
        return
      }

      try {
        setIsLoading(true)
        setInitError(null)
        setDebugInfo('Initializing...')

        console.log('🔄 Starting autocomplete initialization')

        // Clean up existing autocomplete
        if (autocompleteRef.current) {
          console.log('🧹 Cleaning up existing autocomplete')
          if (window.google?.maps?.event) {
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
          }
        }

        setDebugInfo('Loading Google Maps...')

        // Create new autocomplete
        autocompleteRef.current = await createAddressAutocomplete(
          inputRef.current,
          (result: AddressResult) => {
            console.log('📍 Address selected via autocomplete:', result)
            onChange(result.formattedAddress)
            onAddressSelected?.(result)
            setDebugInfo('Address selected successfully!')
          }
        )

        setDebugInfo('Autocomplete ready!')
        console.log('✅ Autocomplete initialization complete')

      } catch (error: any) {
        console.error('❌ Failed to initialize address autocomplete:', error)
        setInitError(`Autocomplete failed: ${error.message}`)
        setDebugInfo('Autocomplete failed')
        
        // Check for common issues
        if (error.message.includes('API key')) {
          setInitError('Google Maps API key issue. Check your configuration.')
        } else if (error.message.includes('quota')) {
          setInitError('Google Maps API quota exceeded.')
        } else if (error.message.includes('billing')) {
          setInitError('Google Maps API billing issue.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    // Delay initialization slightly to ensure DOM is ready
    const timeoutId = setTimeout(initAutocomplete, 100)

    // Cleanup on unmount
          return () => {
        clearTimeout(timeoutId)
        if (autocompleteRef.current && window.google?.maps?.event) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
        }
      }
  }, [onChange, onAddressSelected])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="space-y-1">
      <label className="label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled || isLoading}
          className={`input-field ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {initError && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p className="text-yellow-800">
            ⚠️ <strong>Autocomplete Issue:</strong> {initError}
          </p>
          <p className="text-yellow-700 mt-1">
            You can still enter addresses manually. Check the browser console for more details.
          </p>
        </div>
      )}
      
      {!initError && !isLoading && debugInfo === 'Autocomplete ready!' && (
        <p className="text-xs text-green-600">
          ✅ Address autocomplete is ready - start typing to see suggestions
        </p>
      )}
      
      {!initError && !isLoading && debugInfo !== 'Autocomplete ready!' && debugInfo && (
        <p className="text-xs text-blue-600">
          🔄 {debugInfo}
        </p>
      )}
      
      {!initError && !isLoading && !debugInfo && (
        <p className="text-xs text-gray-500">
          Start typing to see address suggestions
        </p>
      )}
    </div>
  )
} 