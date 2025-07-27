import { Loader } from '@googlemaps/js-api-loader'

let googleMapsLoader: Loader | null = null
let isLoaded = false

// Initialize Google Maps with proper library loading
export const initializeGoogleMaps = async (): Promise<any> => {
  if (isLoaded && window.google?.maps) {
    return window.google.maps
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  console.log('🗺️ Google Maps API Key present:', !!apiKey)
  
  if (!apiKey) {
    throw new Error('Google Maps API key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file')
  }

  if (!googleMapsLoader) {
    console.log('🗺️ Creating Google Maps loader...')
    googleMapsLoader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geocoding'],
      region: 'US',
      language: 'en'
    })
  }

  try {
    console.log('🗺️ Loading Google Maps...')
    await googleMapsLoader.load()
    
    // Wait for libraries to be fully available
    let retries = 0
    const maxRetries = 10
    
    while (retries < maxRetries) {
      if (window.google?.maps?.places?.Autocomplete && window.google?.maps?.Geocoder) {
        console.log('✅ Google Maps and Places library loaded successfully!')
        isLoaded = true
        return window.google.maps
      }
      
      console.log(`⏳ Waiting for Places library... (${retries + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, 200))
      retries++
    }
    
    throw new Error('Places library failed to load after multiple attempts')
    
  } catch (error) {
    console.error('❌ Failed to load Google Maps:', error)
    throw error
  }
}

// Address result interface
export interface AddressResult {
  formattedAddress: string
  lat: number
  lng: number
  placeId: string
  addressComponents: {
    streetNumber?: string
    route?: string
    locality?: string
    administrativeAreaLevel1?: string
    postalCode?: string
    country?: string
  }
}

// Validate and geocode an address
export const validateAddress = async (address: string): Promise<AddressResult | null> => {
  try {
    await initializeGoogleMaps()
    const geocoder = new window.google.maps.Geocoder()

    return new Promise((resolve) => {
      geocoder.geocode({ address }, (results: any, status: any) => {
        console.log('🔍 Geocoding result:', { status, resultsCount: results?.length })
        
        if (status === 'OK' && results && results[0]) {
          const result = results[0]
          const location = result.geometry.location
          
          // Parse address components
          const addressComponents: AddressResult['addressComponents'] = {}
          result.address_components.forEach((component: any) => {
            const types = component.types
            if (types.includes('street_number')) {
              addressComponents.streetNumber = component.long_name
            } else if (types.includes('route')) {
              addressComponents.route = component.long_name
            } else if (types.includes('locality')) {
              addressComponents.locality = component.long_name
            } else if (types.includes('administrative_area_level_1')) {
              addressComponents.administrativeAreaLevel1 = component.short_name
            } else if (types.includes('postal_code')) {
              addressComponents.postalCode = component.long_name
            } else if (types.includes('country')) {
              addressComponents.country = component.long_name
            }
          })

          resolve({
            formattedAddress: result.formatted_address,
            lat: location.lat(),
            lng: location.lng(),
            placeId: result.place_id,
            addressComponents
          })
        } else {
          console.warn('⚠️ Geocoding failed:', status)
          resolve(null)
        }
      })
    })
  } catch (error) {
    console.error('❌ Address validation error:', error)
    return null
  }
}

// Create autocomplete for address input
export const createAddressAutocomplete = async (
  input: HTMLInputElement,
  onPlaceSelected: (result: AddressResult) => void
): Promise<any> => {
  console.log('🔄 Creating address autocomplete...')
  
  await initializeGoogleMaps()
  
  // Double-check that Places is available
  if (!window.google?.maps?.places?.Autocomplete) {
    console.error('❌ Places Autocomplete not available')
    throw new Error('Google Maps Places Autocomplete is not available')
  }
  
  console.log('✅ Creating autocomplete instance...')
  
  const autocomplete = new window.google.maps.places.Autocomplete(input, {
    types: ['address'],
    componentRestrictions: { country: 'us' },
    fields: ['formatted_address', 'geometry', 'place_id', 'address_components']
  })

  console.log('✅ Autocomplete instance created')

  autocomplete.addListener('place_changed', () => {
    console.log('📍 Place changed event triggered')
    const place = autocomplete.getPlace()
    console.log('📍 Selected place:', place)
    
    if (place.geometry?.location && place.formatted_address) {
      const addressComponents: AddressResult['addressComponents'] = {}
      
      if (place.address_components) {
        place.address_components.forEach((component: any) => {
          const types = component.types
          if (types.includes('street_number')) {
            addressComponents.streetNumber = component.long_name
          } else if (types.includes('route')) {
            addressComponents.route = component.long_name
          } else if (types.includes('locality')) {
            addressComponents.locality = component.long_name
          } else if (types.includes('administrative_area_level_1')) {
            addressComponents.administrativeAreaLevel1 = component.short_name
          } else if (types.includes('postal_code')) {
            addressComponents.postalCode = component.long_name
          } else if (types.includes('country')) {
            addressComponents.country = component.long_name
          }
        })
      }

      console.log('✅ Calling onPlaceSelected')

      onPlaceSelected({
        formattedAddress: place.formatted_address,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        placeId: place.place_id || '',
        addressComponents
      })
    } else {
      console.warn('⚠️ Place missing required data:', {
        hasGeometry: !!place.geometry?.location,
        hasAddress: !!place.formatted_address
      })
    }
  })

  console.log('✅ Autocomplete setup complete')
  return autocomplete
} 