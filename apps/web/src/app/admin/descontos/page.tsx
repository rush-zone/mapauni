'use client'

import { useCallback, useEffect, useState } from 'react'

interface Rule {
  id: string
  scoreMin: number
  scoreMax: number | null
  discountPercent: number
  modalityRestriction: string | null
  vacanciesLimit: number | null
  validFrom: string
  validUntil: string | null
  active: boolean
  approvedAt: string | null
  createdAt: string
  university: { id: string; name: string; slug: string }
  course: { id: string; name: string } | null
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1'

export default function AdminDescontosPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [actionId, setActionId] = useState<string | null>(null)

  const fetchRules = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem('admin_token')
    const url = filter === 'pending'
      ? `${API}/discount-rules/admin/all?pending=true`
      : `${API}/discount-rules/admin/all`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setRules(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [filter])

  useEffect(() => { fetchRules() }, [fetchRules])

  async function handleApprove(id: string) {
    setActionId(id)
    const token = localStorage.getItem('admin_token')
    const res = await fetch(`${API}/discount-rules/admin/${id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      setRules(prev => prev.map(r => r.id === id ? { ...r, active: true, approvedAt: new Date().toISOString() } : r))
      if (filter === 'pending') setRules(prev => prev.filter(r => r.id !== id))
    }
    setActionId(null)
  }

  async function handleReject(id: string) {
    if (!confirm('Rejeitar esta regra de desconto?')) return
    setActionId(id)
    const token = localStorage.getItem('admin_token')
    await fetch(`${API}/discount-rules/admin/${id}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
    setRules(prev => prev.filter(r => r.id !== id))
    setActionId(null)
  }

  const pending = rules.filter(r => !r.approvedAt)

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Descontos ENEM</h1>
          <p className="text-gray-500 text-sm mt-1">Aprovação de regras cadastradas pelas universidades</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter('pending')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition ${filter === 'pending' ? 'bg-orange-500 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            Pendentes {pending.length > 0 && <span className="ml-1 bg-white text-orange-600 rounded-full px-1.5 text-xs">{pending.length}</span>}
          </button>
          <button onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition ${filter === 'all' ? 'bg-slate-700 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            Todas
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400 text-sm">Carregando...</div>
      ) : rules.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <p className="text-gray-400 text-sm">{filter === 'pending' ? 'Nenhuma regra pendente de aprovação.' : 'Nenhuma regra encontrada.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Universidade</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Curso</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Faixa ENEM</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Desconto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vigência</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rules.map(rule => (
                <tr key={rule.id} className={`hover:bg-gray-50 transition ${!rule.approvedAt ? 'bg-orange-50/40' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{rule.university.name}</p>
                    <p className="text-xs text-gray-400">{new Date(rule.createdAt).toLocaleDateString('pt-BR')}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {rule.course?.name ?? <span className="italic text-gray-400">Todos os cursos</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {rule.scoreMax ? `${rule.scoreMin}–${rule.scoreMax}` : `${rule.scoreMin}+`}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-green-700">{rule.discountPercent}%</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(rule.validFrom).toLocaleDateString('pt-BR')}
                    {rule.validUntil && ` → ${new Date(rule.validUntil).toLocaleDateString('pt-BR')}`}
                    {!rule.validUntil && ' → sem prazo'}
                  </td>
                  <td className="px-4 py-3">
                    {rule.approvedAt
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Aprovada</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Pendente</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {!rule.approvedAt && (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleApprove(rule.id)} disabled={actionId === rule.id}
                          className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-medium">
                          Aprovar
                        </button>
                        <button onClick={() => handleReject(rule.id)} disabled={actionId === rule.id}
                          className="text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition">
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
