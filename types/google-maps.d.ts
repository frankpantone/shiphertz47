// Google Maps TypeScript declarations
declare global {
  interface Window {
    google: typeof google
  }
}

declare namespace google {
  namespace maps {
    class Geocoder {
      geocode(
        request: GeocoderRequest,
        callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void
      ): void
    }

    interface GeocoderRequest {
      address?: string
      location?: LatLng
      placeId?: string
    }

    interface GeocoderResult {
      formatted_address: string
      geometry: {
        location: LatLng
      }
      place_id: string
      address_components: GeocoderAddressComponent[]
    }

    interface GeocoderAddressComponent {
      long_name: string
      short_name: string
      types: string[]
    }

    type GeocoderStatus = 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR'

    class LatLng {
      lat(): number
      lng(): number
    }

    namespace places {
      class Autocomplete {
        constructor(inputField: HTMLInputElement, opts?: AutocompleteOptions)
        addListener(eventName: string, handler: () => void): void
        getPlace(): PlaceResult
      }

      interface AutocompleteOptions {
        types?: string[]
        componentRestrictions?: { country: string }
        fields?: string[]
      }

      interface PlaceResult {
        formatted_address?: string
        geometry?: {
          location?: LatLng
        }
        place_id?: string
        address_components?: GeocoderAddressComponent[]
      }
    }

    namespace event {
      function clearInstanceListeners(instance: any): void
    }
  }
}

export {} 