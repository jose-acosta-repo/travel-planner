'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string, placeDetails?: { lat: number; lng: number }) => void
  placeholder?: string
  className?: string
  id?: string
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Search for a location...',
  className,
  id,
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      setIsScriptLoaded(true)
      setIsLoading(false)
      return
    }

    // Load Google Maps script
    const loadScript = () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

      if (!apiKey) {
        console.warn('Google Maps API key not found. Location autocomplete will not work.')
        setIsLoading(false)
        return
      }

      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        setIsLoading(false)
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => {
        setIsScriptLoaded(true)
        setIsLoading(false)
      }
      script.onerror = () => {
        console.error('Failed to load Google Maps script')
        setIsLoading(false)
      }
      document.head.appendChild(script)
    }

    loadScript()
  }, [])

  useEffect(() => {
    if (!isScriptLoaded || !inputRef.current || autocompleteRef.current) {
      return
    }

    try {
      // Initialize Google Places Autocomplete
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['establishment', 'geocode'],
        fields: ['name', 'formatted_address', 'geometry', 'place_id'],
      })

      // Listen for place selection
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace()
        if (place?.formatted_address) {
          const lat = place.geometry?.location?.lat()
          const lng = place.geometry?.location?.lng()

          onChange(
            place.formatted_address,
            lat && lng ? { lat, lng } : undefined
          )
        }
      })
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error)
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [isScriptLoaded, onChange])

  if (isLoading) {
    return (
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
          id={id}
          disabled
        />
        <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      id={id}
    />
  )
}
