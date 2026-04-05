'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window { google: any }
}

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string, lat?: number, lng?: number) => void
  placeholder?: string
}

export function AddressAutocomplete({ value, onChange, placeholder = 'Rua, número, bairro, cidade' }: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function init() {
      if (window.google?.maps?.places) { setLoaded(true); return }
      await new Promise<void>((resolve, reject) => {
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
          // Script já foi carregado por outro componente — aguarda
          const interval = setInterval(() => {
            if (window.google?.maps) { clearInterval(interval); resolve() }
          }, 100)
          return
        }
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject()
        document.head.appendChild(script)
      })
      setLoaded(true)
    }
    init().catch(() => {})
  }, [])

  useEffect(() => {
    if (!loaded || !inputRef.current || autocompleteRef.current) return

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'br' },
      fields: ['formatted_address', 'geometry'],
    })

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace()
      const address = place.formatted_address || inputRef.current?.value || ''
      const lat = place.geometry?.location?.lat()
      const lng = place.geometry?.location?.lng()
      onChange(address, lat, lng)
    })
  }, [loaded])

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
      autoComplete="off"
    />
  )
}
