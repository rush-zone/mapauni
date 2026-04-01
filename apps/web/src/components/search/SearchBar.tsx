'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TABS = [
  { modo: 'cursos', label: 'Cursos', placeholder: 'Ex: Medicina, Engenharia, Direito...' },
  { modo: 'universidades', label: 'Universidades', placeholder: 'Ex: USP, PUC, UFMG...' },
  { modo: 'universidades', label: 'Cidade', placeholder: 'Ex: São Paulo, Campinas, Rio de Janeiro...', useCity: true },
]

export function SearchBar() {
  const [activeTab, setActiveTab] = useState(0)
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const tab = TABS[activeTab]
    const params = new URLSearchParams()
    params.set('modo', tab.modo)
    if (query.trim()) params.set(tab.useCity ? 'city' : 'q', query.trim())
    router.push(`/busca?${params.toString()}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex border-b border-gray-200 mb-0">
        {TABS.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => { setActiveTab(i); setQuery('') }}
            className={`px-5 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === i
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <form onSubmit={handleSearch} className="flex gap-2 mt-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={TABS[activeTab].placeholder}
          className="flex-1 px-5 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
        />
        <button
          type="submit"
          className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition"
        >
          Buscar
        </button>
      </form>
    </div>
  )
}
