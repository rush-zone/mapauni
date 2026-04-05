'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Check, Search, MapPin, BookOpen, X, Loader2 } from 'lucide-react'

const STATES = [
  ['AC','Acre'],['AL','Alagoas'],['AP','Amapá'],['AM','Amazonas'],['BA','Bahia'],
  ['CE','Ceará'],['DF','Distrito Federal'],['ES','Espírito Santo'],['GO','Goiás'],
  ['MA','Maranhão'],['MT','Mato Grosso'],['MS','Mato Grosso do Sul'],['MG','Minas Gerais'],
  ['PA','Pará'],['PB','Paraíba'],['PR','Paraná'],['PE','Pernambuco'],['PI','Piauí'],
  ['RJ','Rio de Janeiro'],['RN','Rio Grande do Norte'],['RS','Rio Grande do Sul'],
  ['RO','Rondônia'],['RR','Roraima'],['SC','Santa Catarina'],['SP','São Paulo'],
  ['SE','Sergipe'],['TO','Tocantins'],
]

export function StepSearch() {
  const router = useRouter()

  const [state, setState]   = useState<[string, string] | null>(null)
  const [city, setCity]     = useState<string | null>(null)
  const [course, setCourse] = useState('')

  const [stateQuery, setStateQuery] = useState('')
  const [cityQuery, setCityQuery]   = useState('')
  const [courseQuery, setCourseQuery] = useState('')

  const [cities, setCities]           = useState<string[]>([])
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [courseSuggestions, setCourseSuggestions] = useState<string[]>([])
  const [topAreas, setTopAreas]       = useState<string[]>([])

  const [stateOpen, setStateOpen]   = useState(false)
  const [cityOpen, setCityOpen]     = useState(false)
  const [courseOpen, setCourseOpen] = useState(false)

  const stateRef  = useRef<HTMLDivElement>(null)
  const cityRef   = useRef<HTMLDivElement>(null)
  const courseRef = useRef<HTMLDivElement>(null)

  // Auto-fill state/city from geolocation (cache first, then IP fallback)
  useEffect(() => {
    async function detect() {
      let stateUf: string | null = null
      let cityName = ''

      // Try cache first
      try {
        const raw = localStorage.getItem('infouni_geo')
        if (raw) {
          const cached = JSON.parse(raw)
          if (Date.now() - cached.ts < 24 * 60 * 60 * 1000) {
            stateUf  = cached.state || null
            cityName = cached.city  || ''
          }
        }
      } catch {}

      // If cache missing or incomplete, detect via IP
      if (!stateUf || !cityName) {
        const ip = await fromIp()
        if (!stateUf) stateUf  = ip.state
        if (!cityName) cityName = ip.city
        try { localStorage.setItem('infouni_geo', JSON.stringify({ state: stateUf, city: cityName, ts: Date.now() })) } catch {}
      }

      if (stateUf) {
        const found = STATES.find(([u]) => u === stateUf)
        if (found) setState([found[0], found[1]])
      }
      if (cityName) setCity(cityName)
    }

    async function fromIp(): Promise<{ state: string | null; city: string }> {
      const ufMap: Record<string,string> = Object.fromEntries(STATES.map(([u,n]) => [n.toLowerCase(), u]))

      // ipinfo.io — returns region (full name) and city
      try {
        const res  = await fetch('https://ipinfo.io/json')
        const data = await res.json()
        if (data.country === 'BR' && !data.bogon) {
          const stateUf = ufMap[data.region?.toLowerCase()] ?? null
          return { state: stateUf, city: data.city || '' }
        }
      } catch {}

      // Fallback: freeipapi.com — returns regionName and cityName
      try {
        const res  = await fetch('https://freeipapi.com/api/json')
        const data = await res.json()
        if (data.countryCode === 'BR') {
          const stateUf = ufMap[data.regionName?.toLowerCase()] ?? null
          return { state: stateUf, city: data.cityName || '' }
        }
      } catch {}

      return { state: null, city: '' }
    }

    detect()
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (stateRef.current && !stateRef.current.contains(e.target as Node))  setStateOpen(false)
      if (cityRef.current  && !cityRef.current.contains(e.target as Node))   setCityOpen(false)
      if (courseRef.current && !courseRef.current.contains(e.target as Node)) setCourseOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Fetch cities when state changes, then normalize auto-detected city to exact API spelling
  useEffect(() => {
    if (!state) { setCities([]); return }
    setCitiesLoading(true)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/universities/cities?state=${state[0]}`)
      .then(r => r.json())
      .then(data => {
        const list: string[] = Array.isArray(data) ? data : []
        setCities(list)
        // Normalize: match auto-detected city to exact API city name
        setCity(prev => {
          if (!prev) return prev
          const exact = list.find(c => c.toLowerCase() === prev.toLowerCase())
          if (exact) return exact
          const partial = list.find(c =>
            c.toLowerCase().includes(prev.toLowerCase()) ||
            prev.toLowerCase().includes(c.toLowerCase())
          )
          return partial ?? prev // keep original IP city if no match
        })
      })
      .catch(() => setCities([]))
      .finally(() => setCitiesLoading(false))
  }, [state])

  // Fetch popular areas filtered by selected state/city
  async function loadTopAreas() {
    setTopAreas([])
    try {
      const p = new URLSearchParams()
      if (state) p.set('state', state[0])
      if (city)  p.set('city', city)
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/search/areas?${p.toString()}`)
      const data = await res.json()
      setTopAreas((data as any[]).slice(0, 10).map((a: any) => a.area).filter(Boolean))
    } catch {}
  }

  // Fetch course suggestions (debounced), filtered by state/city
  useEffect(() => {
    if (courseQuery.length < 2) { setCourseSuggestions([]); return }
    const t = setTimeout(async () => {
      try {
        const p = new URLSearchParams({ q: courseQuery, modo: 'cursos' })
        if (state) p.set('state', state[0])
        if (city)  p.set('city', city)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/search/autocomplete?${p.toString()}`)
        const data = await res.json()
        const courses = (data.suggestions || [])
          .filter((s: any) => s.type === 'course')
          .map((s: any) => s.label)
        setCourseSuggestions(courses)
      } catch { setCourseSuggestions([]) }
    }, 250)
    return () => clearTimeout(t)
  }, [courseQuery, state, city])

  function selectState(abbr: string, name: string) {
    setState([abbr, name])
    setStateQuery('')
    setStateOpen(false)
    setCity(null)
    setCityQuery('')
    setCourse('')
    setCourseQuery('')
    setTopAreas([])
  }

  function selectCity(c: string) {
    setCity(c)
    setCityQuery('')
    setCityOpen(false)
    setCourse('')
    setCourseQuery('')
    setTopAreas([])
  }

  function selectCourse(c: string) {
    setCourse(c)
    setCourseQuery(c)
    setCourseOpen(false)
  }

  function clearState() {
    setState(null); setStateQuery('')
    setCity(null); setCityQuery('')
    setCourse(''); setCourseQuery('')
  }

  function clearCity() {
    setCity(null); setCityQuery('')
    setCourse(''); setCourseQuery('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const p = new URLSearchParams()
    if (state) p.set('state', state[0])
    if (city)  p.set('city', city)
    const q = course || courseQuery
    if (q.trim()) p.set('q', q.trim())
    router.push(`/busca?${p.toString()}`)
  }

  const filteredStates = stateQuery
    ? STATES.filter(([abbr, name]) =>
        name.toLowerCase().includes(stateQuery.toLowerCase()) ||
        abbr.toLowerCase().includes(stateQuery.toLowerCase()))
    : STATES

  const filteredCities = cityQuery
    ? cities.filter(c => c.toLowerCase().includes(cityQuery.toLowerCase()))
    : cities

  const step = !state ? 1 : !city ? 2 : 3

  return (
    <form onSubmit={handleSubmit}>
      {/* Mobile: vertical stack — Desktop: horizontal row */}
      <div className="flex flex-col md:flex-row md:items-end gap-3">

        {/* ── Step 1: Estado ─────────────────────────────────────── */}
        <div ref={stateRef} className="relative md:w-40 flex-shrink-0">
          <StepLabel step={1} active={step >= 1} done={!!state} label="Estado" />
          <div className="relative">
            <button
              type="button"
              onClick={() => { setStateOpen(o => !o); setCityOpen(false); setCourseOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-3 rounded-xl border-2 bg-white text-left transition-all ${
                stateOpen
                  ? 'border-blue-500 ring-4 ring-blue-50'
                  : state ? 'border-slate-200 hover:border-blue-300' : 'border-blue-500 ring-4 ring-blue-50'
              }`}
            >
              <MapPin size={15} className={state ? 'text-blue-600 flex-shrink-0' : 'text-slate-400 flex-shrink-0'} />
              {state ? (
                <span className="flex-1 text-sm font-semibold text-slate-900 truncate pr-4">{state[1]}</span>
              ) : (
                <span className="flex-1 text-sm text-slate-400">Selecione...</span>
              )}
              {!state && (
                <ChevronDown size={15} className={`text-slate-400 flex-shrink-0 transition-transform ${stateOpen ? 'rotate-180' : ''}`} />
              )}
            </button>
            {state && (
              <button type="button" onClick={e => { e.stopPropagation(); clearState() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-0.5">
                <X size={13} />
              </button>
            )}
          </div>

          {stateOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden w-56">
              <div className="p-2 border-b border-slate-100">
                <input
                  autoFocus
                  type="text"
                  value={stateQuery}
                  onChange={e => setStateQuery(e.target.value)}
                  placeholder="Buscar estado..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 bg-slate-50"
                />
              </div>
              <div className="max-h-52 overflow-y-auto">
                {filteredStates.map(([abbr, name]) => (
                  <button key={abbr} type="button" onClick={() => selectState(abbr, name)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors ${
                      state?.[0] === abbr ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
                    }`}>
                    <span className="w-7 text-xs font-bold text-slate-400">{abbr}</span>
                    <span className="flex-1">{name}</span>
                    {state?.[0] === abbr && <Check size={13} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Step 2: Cidade ─────────────────────────────────────── */}
        <div
          ref={cityRef}
          className={`relative md:w-48 flex-shrink-0 transition-all duration-300 ${state ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}
        >
          <StepLabel step={2} active={step >= 2} done={!!city} label="Cidade" />
          <div className="relative">
            <button
              type="button"
              onClick={() => { setCityOpen(o => !o); setStateOpen(false); setCourseOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-3 rounded-xl border-2 bg-white text-left transition-all ${
                !state ? 'border-slate-200 bg-slate-50'
                : cityOpen ? 'border-blue-500 ring-4 ring-blue-50'
                : city ? 'border-slate-200 hover:border-blue-300'
                : 'border-blue-500 ring-4 ring-blue-50'
              }`}
            >
              <MapPin size={15} className={city ? 'text-teal-600 flex-shrink-0' : 'text-slate-400 flex-shrink-0'} />
              {city ? (
                <span className="flex-1 text-sm font-semibold text-slate-900 truncate pr-4">{city}</span>
              ) : (
                <span className="flex-1 text-sm text-slate-400 truncate">
                  {state ? 'Selecione...' : 'Primeiro o estado'}
                </span>
              )}
              {!city && (citiesLoading ? (
                <Loader2 size={13} className="text-slate-400 flex-shrink-0 animate-spin" />
              ) : (
                <ChevronDown size={15} className={`text-slate-400 flex-shrink-0 transition-transform ${cityOpen ? 'rotate-180' : ''}`} />
              ))}
            </button>
            {city && (
              <button type="button" onClick={e => { e.stopPropagation(); clearCity() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-0.5">
                <X size={13} />
              </button>
            )}
          </div>

          {cityOpen && state && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden w-64">
              <div className="p-2 border-b border-slate-100">
                <input
                  autoFocus
                  type="text"
                  value={cityQuery}
                  onChange={e => setCityQuery(e.target.value)}
                  placeholder="Buscar cidade..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 bg-slate-50"
                />
              </div>
              <div className="max-h-52 overflow-y-auto">
                {citiesLoading ? (
                  <div className="px-4 py-3 flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 size={12} className="animate-spin" /> Carregando cidades...
                  </div>
                ) : filteredCities.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-slate-400">Nenhuma cidade encontrada</p>
                ) : filteredCities.map(c => (
                  <button key={c} type="button" onClick={() => selectCity(c)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-teal-50 transition-colors ${
                      city === c ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-700'
                    }`}>
                    <MapPin size={11} className="text-slate-300 flex-shrink-0" />
                    <span className="flex-1">{c}</span>
                    {city === c && <Check size={13} className="text-teal-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Step 3: Curso ──────────────────────────────────────── */}
        <div
          ref={courseRef}
          className={`relative md:flex-1 transition-all duration-300 ${state ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}
        >
          <StepLabel step={3} active={step >= 3} done={!!course} label="Curso ou Universidade" />
          <div className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 bg-white transition-all ${
            !state ? 'border-slate-200 bg-slate-50'
            : courseOpen ? 'border-blue-500 ring-4 ring-blue-50'
            : 'border-blue-500 ring-4 ring-blue-50'
          }`}>
            <BookOpen size={15} className={`flex-shrink-0 ${course ? 'text-blue-600' : 'text-slate-400'}`} />
            <input
              type="text"
              value={courseQuery}
              onChange={e => { setCourseQuery(e.target.value); setCourse(''); setCourseOpen(true) }}
              onFocus={() => { setCourseOpen(true); loadTopAreas() }}
              placeholder={state ? 'Ex: Medicina, Direito, Engenharia...' : 'Primeiro o estado'}
              disabled={!state}
              className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-900 placeholder-slate-400 disabled:cursor-not-allowed min-w-0"
            />
            {courseQuery && (
              <button type="button" onClick={() => { setCourse(''); setCourseQuery(''); setCourseSuggestions([]) }}
                className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 flex-shrink-0">
                <X size={13} />
              </button>
            )}
          </div>

          {courseOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
              {courseQuery.length >= 2 ? (
                courseSuggestions.length > 0
                  ? courseSuggestions.map((c, i) => (
                      <button key={i} type="button" onClick={() => selectCourse(c)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors text-slate-700">
                        <BookOpen size={13} className="text-blue-400 flex-shrink-0" />
                        <span className="flex-1">{c}</span>
                      </button>
                    ))
                  : <p className="px-4 py-3 text-xs text-slate-400">Nenhum curso encontrado</p>
              ) : topAreas.length > 0 ? (
                <>
                  <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Áreas populares</p>
                  {topAreas.map((area, i) => (
                    <button key={i} type="button" onClick={() => selectCourse(area)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors text-slate-700">
                      <BookOpen size={13} className="text-blue-300 flex-shrink-0" />
                      <span className="flex-1">{area}</span>
                    </button>
                  ))}
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* ── Submit ─────────────────────────────────────────────── */}
        <div className="md:flex-shrink-0">
          {/* Mobile label spacer to align with other step labels */}
          <div className="hidden md:block mb-1.5 h-5" />
          <button
            type="submit"
            disabled={!state}
            className={`w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
              state
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Search size={15} />
            {/* Mobile: contextual label */}
            <span className="md:hidden">
              {city && (courseQuery || course)
                ? `Buscar ${course || courseQuery} em ${city}`
                : city
                  ? `Ver universidades em ${city}`
                  : state
                    ? `Ver universidades em ${state[1]}`
                    : 'Selecione o estado para começar'
              }
            </span>
            {/* Desktop: compact label */}
            <span className="hidden md:inline">Buscar</span>
          </button>
        </div>

      </div>
    </form>
  )
}

function StepLabel({ step, active, done, label }: {
  step: number
  active: boolean
  done: boolean
  label: string
}) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
        done
          ? 'bg-teal-500 text-white'
          : active
            ? 'bg-blue-600 text-white'
            : 'bg-slate-200 text-slate-400'
      }`}>
        {done ? <Check size={10} /> : step}
      </div>
      <span className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
        done ? 'text-teal-600' : active ? 'text-blue-600' : 'text-slate-400'
      }`}>
        {label}
      </span>
    </div>
  )
}
