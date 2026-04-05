'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window { google: any }
}

interface MiniMapProps {
  address: string
  lat?: number | null
  lng?: number | null
}

export function MiniMap({ address, lat, lng }: MiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    async function init() {
      if (!address && !lat) return

      if (!window.google?.maps) {
        await new Promise<void>((resolve, reject) => {
          if (document.querySelector('script[src*="maps.googleapis.com"]')) {
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
      }

      if (!mapRef.current) return

      async function showMap(position: { lat: number; lng: number }) {
        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current!, {
            center: position,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            styles: [
              { elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
              { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
              { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
              { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e5e7eb' }] },
              { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bfdbfe' }] },
              { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            ],
          })
        } else {
          mapInstanceRef.current.setCenter(position)
        }

        if (markerRef.current) markerRef.current.setMap(null)
        markerRef.current = new window.google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#2563EB',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
        })
      }

      if (lat && lng) {
        await showMap({ lat, lng })
      } else if (address) {
        const geocoder = new window.google.maps.Geocoder()
        const result = await geocoder.geocode({ address: `${address}, Brasil` })
        if (result.results[0]) {
          const loc = result.results[0].geometry.location
          await showMap({ lat: loc.lat(), lng: loc.lng() })
        }
      }
    }

    init().catch(() => {})
  }, [address, lat, lng])

  if (!address && !lat) return null

  return (
    <div
      ref={mapRef}
      className="w-full h-48 rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
    />
  )
}
