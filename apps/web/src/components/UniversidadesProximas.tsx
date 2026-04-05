'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

declare global {
  interface Window { google: any }
}

interface University {
  id: string
  name: string
  sigla: string | null
  city: string
  state: string
  type: string
  plan: string | null
  logoUrl: string | null
  slug: string
  _count: { courses: number; reviews: number }
}

const RADIUS_OPTIONS = [25, 50, 100, 200]

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e5e7eb' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bfdbfe' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
]

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function markerSVG(color: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7.163 0 0 7.163 0 16c0 10.667 16 24 16 24s16-13.333 16-24C32 7.163 24.837 0 16 0z" fill="${color}" stroke="white" stroke-width="1.5"/><circle cx="16" cy="16" r="9" fill="white"/><text x="16" y="21" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="${color}">U</text></svg>`
  )}`
}

export function UniversidadesProximas() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const circleRef = useRef<any>(null)
  const cityCache = useRef(new Map<string, { lat: number; lng: number }>())

  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'denied' | 'error'>('idle')
  const [unis, setUnis] = useState<University[]>([])
  const [visibleUnis, setVisibleUnis] = useState<University[]>([])
  const [radius, setRadius] = useState(50)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)

  async function loadMaps() {
    if (window.google?.maps) return
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Falha ao carregar Google Maps'))
      document.head.appendChild(script)
    })
  }

  async function geocodeCity(city: string, state: string) {
    const key = `${city}-${state}`
    if (cityCache.current.has(key)) return cityCache.current.get(key)!
    try {
      const geocoder = new window.google.maps.Geocoder()
      const result = await geocoder.geocode({ address: `${city}, ${state}, Brasil` })
      if (result.results[0]) {
        const loc = result.results[0].geometry.location
        const coords = { lat: loc.lat(), lng: loc.lng() }
        cityCache.current.set(key, coords)
        return coords
      }
    } catch {}
    return null
  }

  function clearMarkers() {
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []
  }

  async function updateMarkers(allUnis: University[], userLat: number, userLng: number, km: number) {
    if (!mapInstanceRef.current) return
    clearMarkers()
    if (circleRef.current) circleRef.current.setRadius(km * 1000)

    const uniqueCities = [...new Set(allUnis.map((u) => `${u.city}-${u.state}`))]
    await Promise.all(uniqueCities.map((k) => {
      const dash = k.indexOf('-')
      return geocodeCity(k.slice(0, dash), k.slice(dash + 1))
    }))

    const visible: University[] = []
    for (const uni of allUnis) {
      const coords = cityCache.current.get(`${uni.city}-${uni.state}`)
      if (!coords) continue
      if (haversine(userLat, userLng, coords.lat, coords.lng) > km) continue
      visible.push(uni)

      const color = uni.plan === 'PREMIUM' || uni.plan === 'PRO' ? '#7C3AED' : '#2563EB'
      const marker = new window.google.maps.Marker({
        position: coords,
        map: mapInstanceRef.current,
        title: uni.name,
        icon: {
          url: markerSVG(color),
          scaledSize: new window.google.maps.Size(32, 40),
          anchor: new window.google.maps.Point(16, 40),
        },
        optimized: false,
      })
      const info = new window.google.maps.InfoWindow({
        content: '<div style="font-family:sans-serif;padding:2px;max-width:180px"><p style="font-weight:600;font-size:13px;margin:0 0 3px">' + uni.name + '</p><p style="color:#6b7280;font-size:12px;margin:0">' + uni.city + ', ' + uni.state + '</p><p style="color:#6b7280;font-size:12px;margin:0">' + uni._count.courses + ' cursos</p></div>',
      })
      marker.addListener('click', () => info.open(mapInstanceRef.current, marker))
      markersRef.current.push(marker)
    }
    setVisibleUnis(visible)
  }

  async function handleStart() {
    setStatus('loading')
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      )
      await loadMaps()

      const userLat = position.coords.latitude
      const userLng = position.coords.longitude
      setUserCoords({ lat: userLat, lng: userLng })

      const geocoder = new window.google.maps.Geocoder()
      const geoResult = await geocoder.geocode({ location: { lat: userLat, lng: userLng } })
      const stateComp = geoResult.results[0]?.address_components?.find(
        (c: any) => c.types.includes('administrative_area_level_1')
      )
      const state = stateComp?.short_name || ''

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/universities/search?state=${state}&limit=50&comCursos=true`
      )
      const data = await res.json()
      const allUnis: University[] = data.data || []
      setUnis(allUnis)

      // Status 'ready' antes de criar o mapa para o div já estar no DOM
      setStatus('ready')

      // Aguarda o React renderizar o div do mapa
      await new Promise<void>((resolve) => setTimeout(resolve, 50))

      const map = new window.google.maps.Map(mapRef.current!, {
        center: { lat: userLat, lng: userLng },
        zoom: 10,
        styles: MAP_STYLES,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      })
      mapInstanceRef.current = map

      new window.google.maps.Marker({
        position: { lat: userLat, lng: userLng },
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        title: 'Você está aqui',
        zIndex: 999,
      })

      circleRef.current = new window.google.maps.Circle({
        center: { lat: userLat, lng: userLng },
        radius: radius * 1000,
        map,
        fillColor: '#3B82F6',
        fillOpacity: 0.06,
        strokeColor: '#3B82F6',
        strokeOpacity: 0.3,
        strokeWeight: 2,
      })

      await updateMarkers(allUnis, userLat, userLng, radius)
    } catch (err: any) {
      console.error('[UniversidadesProximas] erro:', err)
      if (err?.code === 1) setStatus('denied')
      else setStatus('error')
    }
  }

  useEffect(() => {
    if (status === 'ready' && userCoords) {
      updateMarkers(unis, userCoords.lat, userCoords.lng, radius)
    }
  }, [radius])

  return (
    <section className="max-w-6xl mx-auto px-6 py-12 border-t">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Universidades perto de você</h2>
          {status === 'ready' && (
            <p className="text-sm text-gray-500 mt-0.5">
              {visibleUnis.length} universidade{visibleUnis.length !== 1 ? 's' : ''} em até {radius} km
            </p>
          )}
        </div>
        {status === 'ready' && (
          <div className="flex gap-1">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  radius === r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        )}
      </div>

      {status === 'idle' && (
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-3xl">📍</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Encontre universidades na sua região</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm">
            Compartilhe sua localização para ver universidades próximas no mapa com raio de distância configurável.
          </p>
          <button
            onClick={handleStart}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-sm"
          >
            Encontrar universidades perto de mim
          </button>
        </div>
      )}

      {status === 'loading' && (
        <div className="flex items-center justify-center bg-gray-50 rounded-2xl h-80 border">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Buscando universidades próximas...</p>
          </div>
        </div>
      )}

      {status === 'denied' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <p className="text-amber-700 font-medium mb-2">Permissão de localização negada</p>
          <p className="text-amber-600 text-sm">Habilite a localização no seu navegador e tente novamente.</p>
          <button onClick={() => setStatus('idle')} className="mt-4 text-sm text-amber-700 underline">
            Tentar novamente
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <p className="text-red-700 font-medium mb-2">Erro ao carregar o mapa</p>
          <button onClick={handleStart} className="text-sm text-red-600 underline">Tentar novamente</button>
        </div>
      )}

      {/* div do mapa sempre no DOM — visibilidade controlada por CSS */}
      <div className={status === 'ready' ? 'flex gap-4 h-[520px]' : 'hidden'}>
        <div ref={mapRef} className="flex-1 rounded-2xl overflow-hidden border border-gray-200 shadow-sm" />
        <div className="w-72 flex flex-col gap-2 overflow-y-auto pr-1">
          {visibleUnis.length === 0 ? (
            <div className="text-center text-gray-400 text-sm pt-12">
              Nenhuma universidade nesse raio.
              <br />
              <button onClick={() => setRadius(200)} className="mt-2 text-blue-500 underline text-xs">
                Ampliar para 200 km
              </button>
            </div>
          ) : (
            visibleUnis.map((uni) => (
              <Link
                key={uni.id}
                href={`/universidades/${uni.slug}`}
                className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                {uni.logoUrl ? (
                  <img src={uni.logoUrl} alt={uni.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {(uni.sigla || uni.name).slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">{uni.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{uni.city} · {uni._count.courses} cursos</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {status === 'ready' && (
        <p className="text-xs text-gray-400 mt-3">
          <span className="inline-block w-3 h-3 bg-purple-600 rounded-full mr-1" />Premium/PRO+
          <span className="inline-block w-3 h-3 bg-blue-600 rounded-full ml-3 mr-1" />Padrão
        </p>
      )}
    </section>
  )
}
