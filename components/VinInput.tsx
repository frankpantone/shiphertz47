'use client'

import { useState, useEffect } from 'react'
import { decodeVin, VehicleInfo, isValidVinFormat } from '@/lib/nhtsa'
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

interface VinInputProps {
  value: string
  onChange: (vin: string) => void
  onVehicleInfo?: (info: VehicleInfo | null) => void
  required?: boolean
  error?: string
  disabled?: boolean
}

export default function VinInput({
  value,
  onChange,
  onVehicleInfo,
  required = false,
  error,
  disabled = false
}: VinInputProps) {
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Debounced VIN validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateVin()
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId)
  }, [value])

  const validateVin = async () => {
    if (!value || value.length < 17) {
      setVehicleInfo(null)
      setValidationError(null)
      onVehicleInfo?.(null)
      return
    }

    if (!isValidVinFormat(value)) {
      setValidationError('Invalid VIN format')
      setVehicleInfo(null)
      onVehicleInfo?.(null)
      return
    }

    setIsValidating(true)
    setValidationError(null)

    try {
      const info = await decodeVin(value)
      setVehicleInfo(info)
      onVehicleInfo?.(info)
      
      if (!info.valid && info.errors?.length) {
        setValidationError(info.errors[0])
      }
    } catch (error) {
      setValidationError('Failed to validate VIN')
      setVehicleInfo(null)
      onVehicleInfo?.(null)
    } finally {
      setIsValidating(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '')
    if (inputValue.length <= 17) {
      onChange(inputValue)
    }
  }

  const getValidationIcon = () => {
    if (isValidating) {
      return <ClockIcon className="h-5 w-5 text-yellow-500 animate-pulse" />
    }
    
    if (vehicleInfo?.valid) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />
    }
    
    if (value.length === 17 && (validationError || !vehicleInfo?.valid)) {
      return <XCircleIcon className="h-5 w-5 text-red-500" />
    }
    
    return null
  }

  return (
    <div className="space-y-1">
      <label className="label">
        VIN Number
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder="Enter 17-character VIN"
          required={required}
          disabled={disabled}
          maxLength={17}
          className={`input-field pr-10 font-mono ${
            error || validationError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          } ${
            vehicleInfo?.valid ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''
          }`}
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {getValidationIcon()}
        </div>
      </div>

      {/* Character counter */}
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {value.length}/17 characters
        </div>
        
        {isValidating && (
          <div className="text-xs text-yellow-600">
            Validating VIN...
          </div>
        )}
      </div>

      {/* Vehicle information display */}
      {vehicleInfo?.valid && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center space-x-1 mb-2">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-800">Valid VIN</span>
          </div>
          <div className="text-sm text-green-700">
            <div><strong>Make:</strong> {vehicleInfo.make}</div>
            <div><strong>Model:</strong> {vehicleInfo.model}</div>
            <div><strong>Year:</strong> {vehicleInfo.year}</div>
            {vehicleInfo.bodyClass && (
              <div><strong>Body Class:</strong> {vehicleInfo.bodyClass}</div>
            )}
          </div>
        </div>
      )}

      {/* Error display */}
      {(error || validationError) && (
        <p className="text-sm text-red-600">
          {error || validationError}
        </p>
      )}
      
      {/* Format help */}
      {!vehicleInfo && !isValidating && value.length < 17 && (
        <p className="text-xs text-gray-500">
          VIN must be exactly 17 characters (letters and numbers, excluding I, O, Q)
        </p>
      )}
    </div>
  )
} 