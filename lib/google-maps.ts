import { Loader } from '@googlemaps/js-api-loader'

let googleMapsLoader: Loader | null = null
let googleMaps: any = null

// Initialize Google Maps
export const initializeGoogleMaps = async (): Promise<any> => {
  if (googleMaps) return googleMaps

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  console.log('🗺️ Google Maps API Key present:', !!apiKey)
  console.log('🗺️ API Key length:', apiKey?.length || 0)
  
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
    googleMaps = await googleMapsLoader.load()
    console.log('✅ Google Maps loaded successfully!')
    
    // Wait a moment for all libraries to be fully loaded
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Verify libraries are loaded
    console.log('🔍 Checking loaded libraries...')
    console.log('Maps object keys:', Object.keys(googleMaps))
    console.log('Places available:', !!googleMaps.places)
    console.log('Geocoding available:', !!googleMaps.Geocoder)
    
    if (!googleMaps.places) {
      throw new Error('Places library failed to load')
    }
    
    console.log('✅ All libraries confirmed loaded!')
    return googleMaps
  } catch (error) {
    console.error('❌ Failed to load Google Maps:', error)
    throw error
  }
}

// Validate and geocode an address
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

export const validateAddress = async (address: string): Promise<AddressResult | null> => {
  try {
    const maps = await initializeGoogleMaps()
    const geocoder = new maps.Geocoder()

    return new Promise((resolve, reject) => {
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
): Promise<google.maps.places.Autocomplete> => {
  console.log('🔄 Creating address autocomplete...')
  
  const maps = await initializeGoogleMaps()
  
  console.log('✅ Google Maps loaded, checking Places library...')
  
  // Check if Places library is loaded
  if (!maps.places || !maps.places.Autocomplete) {
    console.error('❌ Places library not loaded. Available maps properties:', Object.keys(maps))
    throw new Error('Google Maps Places library not loaded. Please check your API configuration.')
  }
  
  console.log('✅ Places library confirmed, creating autocomplete instance...')
  
  const autocomplete = new maps.places.Autocomplete(input, {
    types: ['address'],
    componentRestrictions: { country: 'us' }, // Restrict to US addresses
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

      console.log('✅ Calling onPlaceSelected with:', {
        formattedAddress: place.formatted_address,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      })

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