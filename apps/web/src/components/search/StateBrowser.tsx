import Link from 'next/link'
import { api } from '@/lib/api'
import { MapPin, ChevronRight } from 'lucide-react'

const STATE_NAMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
  PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
  RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
  SE: 'Sergipe', TO: 'Tocantins',
}

interface StateData {
  state: string
  count: number
  cities: string[]
}

export async function StateBrowser({ selectedState }: { selectedState?: string }) {
  let states: StateData[] = []
  try {
    states = await api.get('/search/states')
  } catch {
    return <div className="text-sm text-red-500 p-4">Erro ao carregar estados.</div>
  }

  const displayStates = selectedState
    ? states.filter(s => s.state === selectedState)
    : states

  return (
    <div>
      <p className="text-xs text-slate-400 mb-4 font-medium">
        {selectedState
          ? <>Cidades em <span className="text-slate-700 font-semibold">{STATE_NAMES[selectedState] ?? selectedState}</span> — escolha uma cidade</>
          : <><span className="text-slate-700 font-semibold">{states.length}</span> estados com instituições cadastradas</>
        }
      </p>

      <div className="space-y-3">
        {displayStates.map(({ state, count, cities }) => (
          <div key={state} className="bg-white border border-slate-100 rounded-xl overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

            {/* State header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-50">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-blue-600">{state}</span>
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-slate-900">{STATE_NAMES[state] ?? state}</span>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-2.5 py-1">
                {count.toLocaleString('pt-BR')} IES
              </span>
            </div>

            {/* Cities grid */}
            <div className="px-5 py-3 flex flex-wrap gap-2">
              {cities.map(city => (
                <Link
                  key={city}
                  href={`/busca?city=${encodeURIComponent(city)}&state=${state}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all"
                >
                  <MapPin size={10} className="text-slate-400" />
                  {city}
                  <ChevronRight size={10} className="text-slate-300" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
