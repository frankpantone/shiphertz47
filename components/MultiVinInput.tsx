'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { VehicleInfo, isValidVinFormat, decodeVin } from '@/lib/nhtsa'
import { 
  PlusIcon, 
  XMarkIcon, 
  TruckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline'

export interface Vehicle {
  id: string
  vin: string
  info?: VehicleInfo
  isValidating?: boolean
  isValid?: boolean
  error?: string
}

interface MultiVinInputProps {
  vehicles: Vehicle[]
  onChange: (vehicles: Vehicle[]) => void
  required?: boolean
  disabled?: boolean
}

export default function MultiVinInput({ 
  vehicles, 
  onChange, 
  required = false, 
  disabled = false 
}: MultiVinInputProps) {
  // Store timeouts for each vehicle to manage debouncing
  const [validationTimeouts, setValidationTimeouts] = useState<Record<string, NodeJS.Timeout>>({})

  const generateId = () => `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const addVehicle = () => {
    if (vehicles.length >= 9) {
      toast.error('Maximum of 9 vehicles allowed per request')
      return
    }
    
    const newVehicle: Vehicle = {
      id: generateId(),
      vin: '',
      isValid: false,
      isValidating: false,
      info: undefined,
      error: undefined
    }
    onChange([...vehicles, newVehicle])
  }

  const removeVehicle = (id: string) => {
    if (vehicles.length === 1) {
      toast.error('At least one vehicle is required')
      return
    }
    
    // Clear any pending validation timeout for this vehicle
    if (validationTimeouts[id]) {
      clearTimeout(validationTimeouts[id])
      setValidationTimeouts(prev => {
        const { [id]: _, ...rest } = prev
        return rest
      })
    }
    
    onChange(vehicles.filter(v => v.id !== id))
  }

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    onChange(vehicles.map(v => 
      v.id === id 
        ? { ...v, ...updates }
        : v
    ))
  }

  const validateVehicle = async (id: string, vin: string) => {
    
    // Find the current vehicle to check if VIN still matches (avoid race conditions)
    const currentVehicle = vehicles.find(v => v.id === id)
    
    if (!currentVehicle) {
      return
    }
    
    // Only skip if the VIN is completely different (not just a minor state issue)
    // Allow validation to proceed if VINs are similar (handles React state timing issues)
    if (currentVehicle.vin !== vin) {
      if (currentVehicle.vin.length === 0 || Math.abs(currentVehicle.vin.length - vin.length) <= 1) {
      } else {
        return
      }
    }

    if (!vin || vin.length < 17) {
      updateVehicle(id, {
        vin: vin, // Preserve partial VIN
        info: undefined,
        isValid: false,
        error: undefined,
        isValidating: false
      })
      return
    }

    if (!isValidVinFormat(vin)) {
      updateVehicle(id, {
        vin: vin, // Preserve invalid VIN for user to see/edit
        error: 'Invalid VIN format',
        isValid: false,
        isValidating: false,
        info: undefined
      })
      return
    }

    // Set validating state
    updateVehicle(id, { 
      vin: vin, // Preserve VIN during validation
      isValidating: true, 
      error: undefined 
    })

    try {
      const info = await decodeVin(vin)
      
      // Check if vehicle still exists  
      const vehicleAfterValidation = vehicles.find(v => v.id === id)
      if (!vehicleAfterValidation) {
        return
      }
      
      // Always proceed with validation results - we already checked at the start
      
      updateVehicle(id, {
        // Preserve the VIN - don't let it get cleared during validation updates
        vin: vin,
        info: info,
        isValid: info && info.valid,
        isValidating: false,
        error: (info && info.valid) ? undefined : (info?.errors?.length ? info.errors[0] : 'Vehicle information not found')
      })
      
      if (info && info.valid) {
        toast.success(`Vehicle found: ${info.year} ${info.make} ${info.model}`)
      } else {
        if (info?.errors?.length) {
          toast.error(`VIN validation failed: ${info.errors[0]}`)
        } else {
          toast.error(`VIN validation failed: Incomplete vehicle information`)
        }
      }
      
    } catch (error: any) {
      updateVehicle(id, {
        vin: vin, // Preserve VIN even on validation error
        error: 'Failed to validate VIN',
        isValid: false,
        isValidating: false,
        info: undefined
      })
    }
  }

  const handleVinChange = (id: string, vin: string) => {
    
    const cleanVin = vin.toUpperCase().replace(/[^A-Z0-9]/g, '')
    
    if (cleanVin.length <= 17) {
      // Clear ALL existing timeouts to prevent interference
      Object.values(validationTimeouts).forEach(timeoutId => {
        if (timeoutId) clearTimeout(timeoutId)
      })
      setValidationTimeouts({})
      
      updateVehicle(id, { 
        vin: cleanVin,
        // Clear validation state when VIN changes
        isValid: false,
        error: undefined,
        info: undefined,
        isValidating: false
      })
      
      // Validate if VIN is complete
      if (cleanVin.length === 17) {
        const timeoutId = setTimeout(() => {
          // Use a callback to get the current state at validation time
          validateVehicle(id, cleanVin)
          // Remove timeout from state after it executes
          setValidationTimeouts(prev => {
            const { [id]: _, ...rest } = prev
            return rest
          })
        }, 500)
        
        setValidationTimeouts(prev => ({
          ...prev,
          [id]: timeoutId
        }))
      } else {
        // Remove timeout if VIN is not complete
        setValidationTimeouts(prev => {
          const { [id]: _, ...rest } = prev
          return rest
        })
      }
    }
  }

  // Initialize with one vehicle if empty
  useEffect(() => {
    if (vehicles.length === 0) {
      addVehicle()
    }
  }, [vehicles.length])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(validationTimeouts).forEach(timeout => {
        clearTimeout(timeout)
      })
    }
  }, [])

  // Clean up timeouts for vehicles that no longer exist
  useEffect(() => {
    const currentVehicleIds = new Set(vehicles.map(v => v.id))
    const timeoutIds = Object.keys(validationTimeouts)
    
    timeoutIds.forEach(id => {
      if (!currentVehicleIds.has(id)) {
        clearTimeout(validationTimeouts[id])
        setValidationTimeouts(prev => {
          const { [id]: _, ...rest } = prev
          return rest
        })
      }
    })
  }, [vehicles.map(v => v.id).join(',')])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Vehicle Information {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={addVehicle}
          disabled={disabled || vehicles.length >= 9}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Vehicle ({vehicles.length}/9)
        </button>
      </div>

      <div className="space-y-4">
        {vehicles.map((vehicle, index) => (
          <div key={vehicle.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <TruckIcon className="h-4 w-4 mr-2" />
                Vehicle {index + 1}
              </h4>
              {vehicles.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVehicle(vehicle.id)}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* VIN Input */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                VIN Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={vehicle.vin}
                  onChange={(e) => handleVinChange(vehicle.id, e.target.value)}
                  maxLength={17}
                  placeholder="Enter 17-character VIN"
                  disabled={disabled}
                  className={`
                    block w-full px-3 py-2 text-sm border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${vehicle.error 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : vehicle.isValid 
                        ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }
                  `}
                />
                
                {/* Status Icons */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {vehicle.isValidating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  ) : vehicle.error ? (
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                  ) : vehicle.isValid ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  ) : null}
                </div>
              </div>
              
              {/* Character Count */}
              <div className="text-xs text-gray-500 mt-1">
                {vehicle.vin.length}/17 characters
              </div>
            </div>

            {/* Error Message */}
            {vehicle.error && (
              <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {vehicle.error}
              </div>
            )}

            {/* Vehicle Information Display */}
            {vehicle.info && (
              <div className="bg-white border border-gray-200 rounded p-3">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Vehicle Details</h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Year:</span>
                    <span className="ml-2 font-medium">{vehicle.info.year}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Make:</span>
                    <span className="ml-2 font-medium">{vehicle.info.make}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Model:</span>
                    <span className="ml-2 font-medium">{vehicle.info.model}</span>
                  </div>
                  {vehicle.info.bodyClass && (
                    <div>
                      <span className="text-gray-600">Body:</span>
                      <span className="ml-2 font-medium">{vehicle.info.bodyClass}</span>
                    </div>
                  )}
                  {vehicle.info.vehicleType && (
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-2 font-medium">{vehicle.info.vehicleType}</span>
                    </div>
                  )}
                  {vehicle.info.engineInfo && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Engine:</span>
                      <span className="ml-2 font-medium">{vehicle.info.engineInfo}</span>
                    </div>
                  )}
                  {vehicle.info.fuelType && (
                    <div>
                      <span className="text-gray-600">Fuel:</span>
                      <span className="ml-2 font-medium">{vehicle.info.fuelType}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-600">
        {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} • {vehicles.filter(v => v.isValid).length} validated
      </div>
    </div>
  )
} 