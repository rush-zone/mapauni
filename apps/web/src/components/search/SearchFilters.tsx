'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import { useState, useEffect } from 'react'

const STATES = [
  ['AC','Acre'],['AL','Alagoas'],['AP','Amapá'],['AM','Amazonas'],['BA','Bahia'],
  ['CE','Ceará'],['DF','Distrito Federal'],['ES','Espírito Santo'],['GO','Goiás'],
  ['MA','Maranhão'],['MT','Mato Grosso'],['MS','Mato Grosso do Sul'],['MG','Minas Gerais'],
  ['PA','Pará'],['PB','Paraíba'],['PR','Paraná'],['PE','Pernambuco'],['PI','Piauí'],
  ['RJ','Rio de Janeiro'],['RN','Rio Grande do Norte'],['RS','Rio Grande do Sul'],
  ['RO','Rondônia'],['RR','Roraima'],['SC','Santa Catarina'],['SP','São Paulo'],
  ['SE','Sergipe'],['TO','Tocantins'],
]

const STATE_NAME_TO_UF: Record<string, string> = Object.fromEntries(
  STATES.map(([uf, nome]) => [nome.toLowerCase(), uf])
)

interface Props {
  params: Record<string, string | undefined>
  modo: 'cursos' | 'universidades'
}

function SelectFilter({ label, value, onChange, options }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      >
        <option value="">Todos</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function ChipFilter({ label, options, value, onChange }: {
  label: string
  options: [string, string][]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([v, l]) => (
          <button key={v} onClick={() => onChange(v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
              value === v
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'
            }`}>
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}

export function SearchFilters({ params, modo }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [cityInput, setCityInput] = useState(params.city || '')

  // Sync city input when URL param changes (e.g. after geo-detection)
  useEffect(() => { setCityInput(params.city || '') }, [params.city])

  // Auto-detect user location if no state/city set
  useEffect(() => {
    if (params.state || params.city) return

    function applyLocation(state: string | null, city: string) {
      const current = new URLSearchParams(searchParams.toString())
      if (state) current.set('state', state)
      if (city)  current.set('city', city)
      if (state || city) router.replace(`/busca?${current.toString()}`)
    }

    function saveCache(state: string | null, city: string) {
      try { localStorage.setItem('infouni_geo', JSON.stringify({ state, city, ts: Date.now() })) } catch {}
    }

    async function fromIp() {
      try {
        const res  = await fetch('https://ipapi.co/json/')
        const data = await res.json()
        if (data.country_code !== 'BR') return
        const stateUf = data.region_code as string || null
        const city    = (data.city as string) || ''
        saveCache(stateUf, city)
        applyLocation(stateUf, city)
      } catch {}
    }

    // Check cache (24h)
    try {
      const raw = localStorage.getItem('infouni_geo')
      if (raw) {
        const cached = JSON.parse(raw)
        if (Date.now() - cached.ts < 24 * 60 * 60 * 1000 && (cached.state || cached.city)) {
          applyLocation(cached.state, cached.city || '')
          return
        }
      }
    } catch {}

    // Try browser geolocation (more precise), fall back to IP on denial/error
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`,
              { headers: { 'Accept-Language': 'pt-BR' } }
            )
            const data = await res.json()
            const rawState = (data.address?.state ?? '').replace(/^Estado d[eo] /i, '').trim()
            const stateUf  = STATE_NAME_TO_UF[rawState.toLowerCase()] ?? null
            const city: string = data.address?.city || data.address?.town || data.address?.municipality || ''
            saveCache(stateUf, city)
            applyLocation(stateUf, city)
          } catch { fromIp() }
        },
        () => fromIp(), // denied or unavailable → IP fallback
        { timeout: 6000 }
      )
    } else {
      fromIp()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function updateFilter(key: string, value: string) {
    const current = new URLSearchParams(searchParams.toString())
    if (value) current.set(key, value)
    else current.delete(key)
    current.delete('page')
    router.push(`/busca?${current.toString()}`)
  }

  function clearAll() {
    // preserve city/state if present — only clear filter params
    const current = new URLSearchParams(searchParams.toString())
    ;['type', 'modality', 'shift', 'degree', 'orgAcademica', 'comCursos', 'city', 'page'].forEach(k => current.delete(k))
    router.push(`/busca?${current.toString()}`)
  }

  const hasFilters = ['state', 'city', 'type', 'modality', 'shift', 'degree', 'orgAcademica', 'comCursos']
    .some(k => !!params[k])

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-5 sticky top-6"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={13} className="text-slate-400" />
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Filtros</h3>
        </div>
        {hasFilters && (
          <button onClick={clearAll}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
            Limpar
          </button>
        )}
      </div>

      {/* Cidade — texto livre com submit em Enter */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cidade</label>
        <form onSubmit={e => { e.preventDefault(); updateFilter('city', cityInput.trim()) }}>
          <input
            type="text"
            value={cityInput}
            onChange={e => setCityInput(e.target.value)}
            onBlur={() => updateFilter('city', cityInput.trim())}
            placeholder="Ex: Rio de Janeiro"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-slate-300"
          />
        </form>
      </div>

      <SelectFilter
        label="Estado"
        value={params.state || ''}
        onChange={v => updateFilter('state', v)}
        options={STATES.map(([uf, nome]) => ({ value: uf, label: nome }))}
      />

      <SelectFilter
        label="Tipo de instituição"
        value={params.type || ''}
        onChange={v => updateFilter('type', v)}
        options={[
          { value: 'FEDERAL', label: 'Federal' },
          { value: 'ESTADUAL', label: 'Estadual' },
          { value: 'MUNICIPAL', label: 'Municipal' },
          { value: 'PRIVADA', label: 'Privada' },
        ]}
      />

      {modo === 'universidades' && (
        <>
          <SelectFilter
            label="Organização Acadêmica"
            value={params.orgAcademica || ''}
            onChange={v => updateFilter('orgAcademica', v)}
            options={[
              { value: 'Universidade', label: 'Universidade' },
              { value: 'Centro Universitário', label: 'Centro Universitário' },
              { value: 'Faculdade', label: 'Faculdade' },
              { value: 'Instituto Federal de Educação, Ciência e Tecnologia', label: 'Instituto Federal' },
            ]}
          />
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={params.comCursos === 'true'}
              onChange={e => updateFilter('comCursos', e.target.checked ? 'true' : '')}
              className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-600 font-medium group-hover:text-slate-900 transition-colors">
              Com cursos cadastrados
            </span>
          </label>
        </>
      )}

      {modo === 'cursos' && (
        <>
          <ChipFilter
            label="Modalidade"
            value={params.modality || ''}
            onChange={v => updateFilter('modality', v)}
            options={[['', 'Todas'], ['PRESENCIAL', 'Presencial'], ['EAD', 'EaD'], ['HIBRIDO', 'Híbrido']]}
          />

          <ChipFilter
            label="Turno"
            value={params.shift || ''}
            onChange={v => updateFilter('shift', v)}
            options={[['', 'Todos'], ['MANHA', 'Manhã'], ['TARDE', 'Tarde'], ['NOITE', 'Noite'], ['INTEGRAL', 'Integral']]}
          />

          <SelectFilter
            label="Grau"
            value={params.degree || ''}
            onChange={v => updateFilter('degree', v)}
            options={[
              { value: 'BACHARELADO', label: 'Bacharelado' },
              { value: 'LICENCIATURA', label: 'Licenciatura' },
              { value: 'TECNOLOGO', label: 'Tecnólogo' },
              { value: 'MBA', label: 'MBA' },
            ]}
          />
        </>
      )}
    </div>
  )
}
