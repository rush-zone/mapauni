'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, BookOpen, Building2, Loader2, GraduationCap, Globe, Navigation } from 'lucide-react'
import Link from 'next/link'

interface Suggestion {
  type: 'city' | 'course' | 'university' | 'modality' | 'degree' | 'state'
  label: string
  sublabel?: string
  value: string
}

interface Props {
  compact?: boolean
  initialValue?: string
  initialModo?: 'cursos' | 'universidades'
}

const SUGGESTION_ICON: Record<string, React.ElementType> = {
  city: MapPin, course: BookOpen, university: Building2,
  modality: Globe, degree: GraduationCap, state: MapPin,
}
const SUGGESTION_COLOR: Record<string, string> = {
  city: '#0D9488', course: '#2563EB', university: '#7C3AED',
  modality: '#B45309', degree: '#B45309', state: '#0D9488',
}
const SUGGESTION_GROUP: Record<string, string> = {
  city: 'Cidade', course: 'Curso', university: 'Universidade',
  modality: 'Modalidade', degree: 'Graduação', state: 'Estado',
}
const TYPE_ORDER = ['city', 'university', 'course', 'modality', 'degree', 'state']

function suggestionUrl(s: Suggestion): string {
  const p = new URLSearchParams()
  if (s.type === 'city') {
    // City → show universities in that city
    p.set('city', s.value)
    if (s.sublabel) p.set('state', s.sublabel) // sublabel is the state abbr
  } else if (s.type === 'university') {
    p.set('q', s.value)
  } else if (s.type === 'state') {
    // State only → state browser (cities list)
    p.set('state', s.value)
  } else if (s.type === 'modality') {
    p.set('modality', s.label === 'Presencial' ? 'PRESENCIAL' : s.label === 'EaD' ? 'EAD' : 'HIBRIDO')
  } else if (s.type === 'degree') {
    p.set('degree', s.value)
  } else {
    // course name → university rich results filtered by that course
    p.set('q', s.value)
  }
  return `/busca?${p.toString()}`
}

export function SmartSearchBar({ compact = false, initialValue = '', initialModo = 'cursos' }: Props) {
  const [input, setInput] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [fetching, setFetching] = useState(false)
  const [geoCity, setGeoCity] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  // Geolocation — full mode only, pre-fill city if no initialValue
  useEffect(() => {
    if (compact || initialValue || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=pt-BR`,
            { headers: { 'User-Agent': 'InfoUni/1.0' } }
          )
          const data = await res.json()
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.municipality
          if (city) {
            setGeoCity(city)
            setInput(city + ', ')
          }
        } catch { /* ignore */ }
      },
      () => {},
      { timeout: 6000, maximumAge: 300_000 }
    )
  }, [compact, initialValue])

  // Close dropdown on outside click — clear suggestions (no `open` state needed)
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setSuggestions([])
        setFetching(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Debounced fetch
  function handleInput(value: string) {
    setInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    // Use only the last segment after a comma for autocomplete
    const parts = value.split(',')
    const term = parts[parts.length - 1].trim()
    if (term.length < 2) {
      setSuggestions([])
      setFetching(false)
      return
    }

    setFetching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/search/autocomplete?q=${encodeURIComponent(term)}&modo=${initialModo}`
        )
        const data = await res.json()
        setSuggestions(data.suggestions || [])
      } catch {
        setSuggestions([])
      } finally {
        setFetching(false)
      }
    }, 280)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSuggestions([])
    setFetching(false)
    const raw = input.trim()
    if (!raw) return
    const p = new URLSearchParams()
    // If input has comma → first part = city, rest = query
    if (raw.includes(',')) {
      const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
      if (parts[0]) p.set('city', parts[0])
      if (parts[1]) p.set('q', parts.slice(1).join(' ').trim())
    } else {
      p.set('q', raw)
    }
    router.push(`/busca?${p.toString()}`)
  }

  const showDropdown = fetching || suggestions.length > 0

  const grouped = suggestions.reduce<Record<string, Suggestion[]>>((acc, s) => {
    ;(acc[s.type] = acc[s.type] || []).push(s)
    return acc
  }, {})

  const dropdownEl = showDropdown ? (
    <div
      className="absolute top-full mt-2 z-50 bg-white border border-slate-200 rounded-2xl overflow-hidden"
      style={{
        left: '-1rem', right: '-1rem',   // wider than the input — bleeds 1rem each side
        maxHeight: 400, overflowY: 'auto',
        boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
      }}
    >
      {fetching && suggestions.length === 0 ? (
        <div className="px-5 py-4 flex items-center gap-2 text-xs text-slate-400">
          <Loader2 size={12} className="animate-spin" /> Buscando...
        </div>
      ) : (
        TYPE_ORDER.filter(t => grouped[t]).map((type, tIdx) => {
          const items = grouped[type]
          const Icon = SUGGESTION_ICON[type] || Search
          const color = SUGGESTION_COLOR[type]
          const isPrimary = type === 'city' || type === 'course' || type === 'university'
          return (
            <div key={type}>
              {tIdx > 0 && <div className="border-t border-slate-100" />}

              {/* Group label */}
              <div className="px-5 pt-3 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: color }}>{SUGGESTION_GROUP[type]}</span>
              </div>

              {items.map((s, idx) => (
                <Link
                  key={s.label + idx}
                  href={suggestionUrl(s)}
                  onClick={() => { setSuggestions([]); setFetching(false) }}
                  className="group flex items-center gap-4 px-5 py-3 transition-all duration-150 hover:bg-slate-50"
                >
                  {/* Icon bubble */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150 group-hover:scale-110"
                    style={{ background: color + '15' }}
                  >
                    <Icon size={15} style={{ color }} />
                  </div>

                  {/* Label + sublabel */}
                  <div className="flex-1 min-w-0">
                    <span
                      className={`block text-sm font-semibold truncate transition-colors duration-150 group-hover:text-blue-700 ${isPrimary ? 'text-slate-900' : 'text-slate-600'}`}
                    >
                      {s.label}
                    </span>
                    {s.sublabel && (
                      <span className="block text-xs text-slate-400 mt-0.5 truncate">{s.sublabel}</span>
                    )}
                  </div>

                  {/* Right pill tag */}
                  <span
                    className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                    style={{ background: color + '12', color }}
                  >
                    {SUGGESTION_GROUP[type]}
                  </span>
                </Link>
              ))}

              {/* Bottom spacing after last item in group */}
              <div className="pb-1" />
            </div>
          )
        })
      )}
    </div>
  ) : null

  // ── Compact ───────────────────────────────────────────────────────────────
  if (compact) {
    return (
      <div ref={wrapperRef} className="relative w-full">
        <form onSubmit={handleSubmit}
          className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:border-blue-400 transition-colors">
          <Search size={13} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={input}
            onChange={e => handleInput(e.target.value)}
            placeholder="Curso, universidade, cidade..."
            className="flex-1 bg-transparent border-0 outline-none text-xs text-slate-800 placeholder-slate-400 min-w-0"
          />
          {fetching && <Loader2 size={12} className="animate-spin text-slate-400 flex-shrink-0" />}
          <button type="submit"
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1 rounded transition-colors">
            Buscar
          </button>
        </form>
        {/* Compact dropdown — slightly wider than the bar */}
        {showDropdown && (
          <div
            className="absolute top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl overflow-hidden"
            style={{ left: '-0.5rem', right: '-0.5rem', maxHeight: 320, overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          >
            {fetching && suggestions.length === 0 ? (
              <div className="px-4 py-3 flex items-center gap-2 text-xs text-slate-400">
                <Loader2 size={12} className="animate-spin" /> Buscando...
              </div>
            ) : (
              TYPE_ORDER.filter(t => grouped[t]).map((type, tIdx) => {
                const items = grouped[type]
                const Icon = SUGGESTION_ICON[type] || Search
                const color = SUGGESTION_COLOR[type]
                return (
                  <div key={type}>
                    {tIdx > 0 && <div className="border-t border-slate-100" />}
                    <div className="px-4 pt-2 pb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{SUGGESTION_GROUP[type]}</span>
                    </div>
                    {items.map((s, idx) => (
                      <Link
                        key={s.label + idx}
                        href={suggestionUrl(s)}
                        onClick={() => { setSuggestions([]); setFetching(false) }}
                        className="group flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '15' }}>
                          <Icon size={13} style={{ color }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 flex-1 min-w-0 truncate group-hover:text-blue-700 transition-colors">{s.label}</span>
                        {s.sublabel && <span className="text-[10px] text-slate-400 flex-shrink-0">{s.sublabel}</span>}
                      </Link>
                    ))}
                    <div className="pb-1" />
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Full ──────────────────────────────────────────────────────────────────
  return (
    <div ref={wrapperRef} className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            {fetching
              ? <Loader2 size={16} className="text-slate-400 animate-spin" />
              : <Search size={16} className="text-slate-400" />
            }
          </div>
          <input
            type="text"
            value={input}
            onChange={e => handleInput(e.target.value)}
            placeholder={geoCity ? `${geoCity}, curso ou universidade...` : 'Digite seu curso ou universidade...'}
            className="w-full pl-11 pr-4 py-4 text-base text-slate-900 placeholder-slate-400 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white transition-colors"
            style={{ caretColor: '#0f172a' }}
          />
          {/* Inline ghost hint — shown when input ends with ", " and last segment is empty */}
          {input && /,\s*$/.test(input) && (
            <div
              aria-hidden
              className="absolute inset-0 pl-11 pr-4 py-4 pointer-events-none flex items-center overflow-hidden"
            >
              {/* Invisible spacer that matches the typed text width */}
              <span className="text-base text-transparent whitespace-pre select-none">{input}</span>
              <span className="text-base text-slate-300 whitespace-nowrap select-none">
                Digite o curso ou a universidade
              </span>
            </div>
          )}
          {geoCity && !input && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-teal-600 font-medium bg-teal-50 border border-teal-100 rounded-full px-2 py-0.5 pointer-events-none">
              <Navigation size={10} />
              {geoCity}
            </div>
          )}
        </div>
        <button type="submit"
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-xl transition-colors flex-shrink-0">
          Buscar
        </button>
      </form>

      {!input && (
        <p className="text-xs text-slate-400 mt-2">
          Ex: <span className="text-slate-500">Medicina</span> · <span className="text-slate-500">Engenharia EaD</span> · <span className="text-slate-500">USP</span> · <span className="text-slate-500">Volta Redonda</span>
        </p>
      )}

      {dropdownEl}
    </div>
  )
}
