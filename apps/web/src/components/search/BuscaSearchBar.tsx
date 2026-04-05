'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TABS = [
  { modo: 'cursos', label: 'Cursos', placeholder: 'Ex: Medicina, Engenharia, Direito...' },
  { modo: 'universidades', label: 'Universidades', placeholder: 'Ex: USP, PUC, UFMG...' },
  { modo: 'universidades', label: 'Cidade', placeholder: 'Ex: São Paulo, Campinas, Rio de Janeiro...', useCity: true },
]

interface Props {
  initialModo: string
  initialQuery: string
  initialCity?: string
  compact?: boolean
}

export function BuscaSearchBar({ initialModo, initialQuery, initialCity, compact }: Props) {
  const isCity = !!initialCity && !initialQuery
  const getInitialTab = () => {
    if (isCity) return 2
    if (initialModo === 'universidades') return 1
    return 0
  }
  const [activeTab, setActiveTab] = useState(getInitialTab)
  const [query, setQuery] = useState(isCity ? initialCity : initialQuery)
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const tab = TABS[activeTab]
    const params = new URLSearchParams()
    params.set('modo', tab.modo)
    if (query.trim()) params.set(tab.useCity ? 'city' : 'q', query.trim())
    router.push(`/busca?${params.toString()}`)
  }

  if (compact) {
    return (
      <form onSubmit={handleSearch} className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
        <div className="flex gap-0.5 flex-shrink-0">
          {TABS.map((tab, i) => (
            <button key={tab.label} type="button" onClick={() => { setActiveTab(i); setQuery('') }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === i ? 'bg-primary-500 text-white' : 'text-gray-500 hover:text-gray-800'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder={TABS[activeTab].placeholder}
          className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-800 placeholder-gray-400 px-2 min-w-0" />
        <button type="submit"
          className="flex-shrink-0 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors">
          Buscar
        </button>
      </form>
    )
  }

  return (
    <div>
      <div className="flex border-b border-gray-200">
        {TABS.map((tab, i) => (
          <button key={tab.label} type="button"
            onClick={() => { setActiveTab(i); setQuery('') }}
            className={`px-5 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === i
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>
      <form onSubmit={handleSearch} className="flex gap-2 mt-3">
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder={TABS[activeTab].placeholder}
          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 bg-white text-sm transition-colors" />
        <button type="submit"
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors text-sm">
          Buscar
        </button>
      </form>
    </div>
  )
}
