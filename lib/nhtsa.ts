// NHTSA API utilities for VIN validation and vehicle information

const NHTSA_BASE_URL = process.env.NEXT_PUBLIC_NHTSA_API_URL || 'https://vpic.nhtsa.dot.gov/api'

export interface VehicleInfo {
  vin: string
  make: string
  model: string
  year: number
  bodyClass?: string
  vehicleType?: string
  fuelType?: string
  engineInfo?: string
  valid: boolean
  errors?: string[]
}

// Validate VIN format (basic check)
export const isValidVinFormat = (vin: string): boolean => {
  // VIN should be exactly 17 characters, alphanumeric
  // Note: Technically VINs shouldn't contain I, O, Q but we'll let NHTSA API handle validation
  // and be more lenient here since many real VINs have these characters
  const vinRegex = /^[A-Z0-9]{17}$/
  return vinRegex.test(vin.toUpperCase())
}

// Decode VIN using NHTSA API
export const decodeVin = async (vin: string): Promise<VehicleInfo> => {
  console.log('🔍 decodeVin called for VIN:', vin)
  
  if (!isValidVinFormat(vin)) {
    console.log('❌ VIN format invalid:', vin)
    return {
      vin,
      make: '',
      model: '',
      year: 0,
      valid: false,
      errors: ['Invalid VIN format. VIN must be 17 characters.']
    }
  }

  try {
    const response = await fetch(
      `${NHTSA_BASE_URL}/vehicles/DecodeVin/${vin.toUpperCase()}?format=json`
    )
    
    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.Results || data.Results.length === 0) {
      return {
        vin,
        make: '',
        model: '',
        year: 0,
        valid: false,
        errors: ['No vehicle data found for this VIN']
      }
    }

    // Extract relevant information from NHTSA response
    const results = data.Results
    const vehicleInfo: VehicleInfo = {
      vin: vin.toUpperCase(),
      make: '',
      model: '',
      year: 0,
      valid: false,
      errors: []
    }

    // Parse the results array to extract vehicle information
    let hasErrors = false
    results.forEach((item: any) => {
      switch (item.Variable) {
        case 'Make':
          vehicleInfo.make = item.Value || ''
          break
        case 'Model':
          vehicleInfo.model = item.Value || ''
          break
        case 'Model Year':
          vehicleInfo.year = parseInt(item.Value) || 0
          break
        case 'Body Class':
          vehicleInfo.bodyClass = item.Value || ''
          break
        case 'Vehicle Type':
          vehicleInfo.vehicleType = item.Value || ''
          break
        case 'Fuel Type - Primary':
          vehicleInfo.fuelType = item.Value || ''
          break
        case 'Engine Model':
          vehicleInfo.engineInfo = item.Value || ''
          break
        case 'Error Code':
          if (item.Value && item.Value !== '0' && item.Value !== '') {
            hasErrors = true
            // Only add specific error types to the errors array
            const errorCodes = item.Value.split(',').map((code: string) => code.trim())
            errorCodes.forEach((code: string) => {
              // Only report serious errors, not minor validation issues
              if (['5', '6', '7', '8'].includes(code)) {
                vehicleInfo.errors?.push(`Serious validation error: ${code}`)
              }
            })
          }
          break
        case 'Error Text':
          // Store error text for debugging but don't necessarily fail validation
          if (item.Value && item.Value.trim() !== '') {
            console.log('🔍 NHTSA Validation Warnings:', item.Value)
          }
          break
      }
    })

    // Check if we have essential information - be more lenient with validation
    if (vehicleInfo.make && vehicleInfo.model && vehicleInfo.year > 0) {
      vehicleInfo.valid = true
      // Clear errors if we have essential info - treat NHTSA warnings as non-critical
      if (hasErrors && vehicleInfo.errors?.length === 0) {
        // Had warnings but no serious errors - still valid
        console.log('✅ Vehicle validated with warnings:', vehicleInfo.make, vehicleInfo.model, vehicleInfo.year)
      }
    } else {
      vehicleInfo.valid = false
      if (!vehicleInfo.make) vehicleInfo.errors?.push('Vehicle make not found')
      if (!vehicleInfo.model) vehicleInfo.errors?.push('Vehicle model not found')
      if (!vehicleInfo.year) vehicleInfo.errors?.push('Vehicle year not found')
    }

    return vehicleInfo

  } catch (error) {
    console.error('NHTSA API error:', error)
    return {
      vin,
      make: '',
      model: '',
      year: 0,
      valid: false,
      errors: ['Failed to validate VIN. Please try again later.']
    }
  }
}

// Batch decode multiple VINs (useful for future features)
export const batchDecodeVins = async (vins: string[]): Promise<VehicleInfo[]> => {
  if (vins.length === 0) return []
  
  // NHTSA supports batch processing, but for now we'll do individual requests
  // to keep error handling simpler
  const results = await Promise.allSettled(
    vins.map(vin => decodeVin(vin))
  )
  
  return results.map(result => 
    result.status === 'fulfilled' 
      ? result.value 
      : { vin: '', make: '', model: '', year: 0, valid: false, errors: ['Request failed'] }
  )
}

// Get vehicle makes (for dropdown lists)
export const getVehicleMakes = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${NHTSA_BASE_URL}/vehicles/GetMakesForVehicleType/car?format=json`)
    const data = await response.json()
    
    if (data.Results) {
      return data.Results.map((item: any) => item.MakeName).sort()
    }
    
    return []
  } catch (error) {
    console.error('Error fetching vehicle makes:', error)
    return []
  }
}

// Get models for a specific make and year
export const getModelsForMakeYear = async (make: string, year: number): Promise<string[]> => {
  try {
    const response = await fetch(
      `${NHTSA_BASE_URL}/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`
    )
    const data = await response.json()
    
    if (data.Results) {
      return data.Results.map((item: any) => item.Model_Name).sort()
    }
    
    return []
  } catch (error) {
    console.error('Error fetching vehicle models:', error)
    return []
  }
} 