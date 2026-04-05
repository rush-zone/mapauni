'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
  email: string | null
  phone: string | null
  website: string | null
  description: string | null
  _count: { leads: number; courses: number }
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1'

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
  const router = useRouter()
  const [data, setData] = useState<University[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [state, setState] = useState('')
  const [type, setType] = useState('')

  // Edit modal
  const [editing, setEditing] = useState<University | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem('admin_token')
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (q) params.set('q', q)
    if (state) params.set('state', state)
    if (type) params.set('type', type)

    try {
      const res = await fetch(`${API}/admin/universities?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        localStorage.removeItem('admin_token')
        router.replace('/admin/login')
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json.data ?? [])
      setTotal(json.total ?? 0)
      setPages(json.pages ?? 1)
    } catch {
      // keep previous state, don't crash
    } finally {
      setLoading(false)
    }
  }, [page, q, state, type, router])

  useEffect(() => { fetchData() }, [fetchData])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    fetchData()
  }

  function openEdit(u: University) {
    setEditing(u)
    setEditForm({
      name: u.name,
      sigla: u.sigla ?? '',
      type: u.type,
      city: u.city,
      state: u.state,
      plan: u.plan,
      isActive: u.isActive,
      email: u.email ?? '',
      phone: u.phone ?? '',
      website: u.website ?? '',
    })
    setSaveError('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    setSaveError('')
    const token = localStorage.getItem('admin_token')
    const payload = {
      ...editForm,
      sigla: editForm.sigla || null,
      email: editForm.email || null,
      phone: editForm.phone || null,
      website: editForm.website || null,
    }
    const res = await fetch(`${API}/admin/universities/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setSaveError(data.error || 'Erro ao salvar')
      setSaving(false)
      return
    }
    const updated = await res.json()
    setData(prev => prev.map(u => u.id === editing.id ? { ...u, ...updated } : u))
    setEditing(null)
    setSaving(false)
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
        <input type="text" placeholder="Buscar por nome, sigla, cidade..."
          value={q} onChange={(e) => setQ(e.target.value)}
          className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={state} onChange={(e) => setState(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos os estados</option>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos os tipos</option>
          {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
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
                <th className="px-4 py-3" />
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
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.type === 'FEDERAL' ? 'bg-blue-100 text-blue-700' :
                      u.type === 'ESTADUAL' ? 'bg-purple-100 text-purple-700' :
                      u.type === 'MUNICIPAL' ? 'bg-green-100 text-green-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {TYPES[u.type] || u.type}
                    </span>
                    <span className={`ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.plan === 'PRO' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'
                    }`}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.city}, {u.state}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {u.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u._count.leads} leads · {u._count.courses} cursos</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(u)}
                      className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition">
                      Editar
                    </button>
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
          <p className="text-sm text-gray-500">Página {page} de {pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors">
              Anterior
            </button>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors">
              Próxima
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Editar universidade</h2>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{editing.name}</p>
              </div>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome completo</label>
                  <input type="text" required value={editForm.name}
                    onChange={e => setEditForm((p: any) => ({ ...p, name: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Sigla</label>
                  <input type="text" value={editForm.sigla}
                    onChange={e => setEditForm((p: any) => ({ ...p, sigla: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                  <select value={editForm.type} onChange={e => setEditForm((p: any) => ({ ...p, type: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label>
                  <input type="text" value={editForm.city}
                    onChange={e => setEditForm((p: any) => ({ ...p, city: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                  <select value={editForm.state} onChange={e => setEditForm((p: any) => ({ ...p, state: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Plano</label>
                  <select value={editForm.plan} onChange={e => setEditForm((p: any) => ({ ...p, plan: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="PREMIUM">PREMIUM</option>
                    <option value="PRO">PRO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select value={String(editForm.isActive)} onChange={e => setEditForm((p: any) => ({ ...p, isActive: e.target.value === 'true' }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="true">Ativa</option>
                    <option value="false">Inativa</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
                  <input type="email" value={editForm.email}
                    onChange={e => setEditForm((p: any) => ({ ...p, email: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
                  <input type="text" value={editForm.phone}
                    onChange={e => setEditForm((p: any) => ({ ...p, phone: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Site</label>
                  <input type="text" value={editForm.website}
                    onChange={e => setEditForm((p: any) => ({ ...p, website: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {saveError && <p className="text-sm text-red-500">{saveError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition">
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </button>
                <button type="button" onClick={() => setEditing(null)}
                  className="px-6 py-2.5 border text-sm font-medium rounded-xl hover:bg-gray-50 transition text-gray-700">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
