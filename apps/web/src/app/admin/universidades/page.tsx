'use client'

import { useCallback, useEffect, useState } from 'react'

interface University {
  id: string
  slug: string
  name: string
  sigla: string | null
  mecCode: string | null
  type: string
  category: string | null
  academicOrg: string | null
  city: string
  state: string
  isActive: boolean
  plan: string
  _count: { leads: number; courses: number }
}

const TYPES: Record<string, string> = {
  FEDERAL: 'Federal',
  ESTADUAL: 'Estadual',
  MUNICIPAL: 'Municipal',
  PRIVADA: 'Privada',
}

const STATES = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
]

export default function UniversidadesPage() {
  const [data, setData] = useState<University[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [q, setQ] = useState('')
  const [state, setState] = useState('')
  const [type, setType] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem('admin_token')
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (q) params.set('q', q)
    if (state) params.set('state', state)
    if (type) params.set('type', type)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/universities?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      setData(json.data)
      setTotal(json.total)
      setPages(json.pages)
    } finally {
      setLoading(false)
    }
  }, [page, q, state, type])

  useEffect(() => { fetchData() }, [fetchData])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    fetchData()
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Universidades</h1>
          <p className="text-gray-500 text-sm mt-1">{total.toLocaleString('pt-BR')} IES cadastradas</p>
        </div>
      </div>

      {/* Filtros */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por nome, sigla, cidade..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os estados</option>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os tipos</option>
          {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Filtrar
        </button>
      </form>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Carregando...</div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">Nenhuma universidade encontrada</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Instituição</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Localização</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Leads / Cursos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 leading-tight">{u.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {u.sigla && <span>{u.sigla} · </span>}
                      {u.mecCode && <span>e-MEC {u.mecCode}</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.type === 'FEDERAL' ? 'bg-blue-100 text-blue-700' :
                      u.type === 'ESTADUAL' ? 'bg-purple-100 text-purple-700' :
                      u.type === 'MUNICIPAL' ? 'bg-green-100 text-green-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {TYPES[u.type] || u.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {u.city}, {u.state}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {u.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {u._count.leads} leads · {u._count.courses} cursos
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Página {page} de {pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
