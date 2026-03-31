'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'NEW', label: 'Novo' },
  { value: 'OPENED', label: 'Aberto' },
  { value: 'CONTACTED', label: 'Contatado' },
  { value: 'ENROLLED', label: 'Matriculado' },
  { value: 'LOST', label: 'Perdido' },
]

const STATUS_STYLE: Record<string, string> = {
  NEW: 'bg-blue-50 text-blue-700',
  OPENED: 'bg-yellow-50 text-yellow-700',
  CONTACTED: 'bg-purple-50 text-purple-700',
  ENROLLED: 'bg-green-50 text-green-700',
  LOST: 'bg-gray-100 text-gray-500',
}

const STATUS_LABEL: Record<string, string> = {
  NEW: 'Novo', OPENED: 'Aberto', CONTACTED: 'Contatado', ENROLLED: 'Matriculado', LOST: 'Perdido',
}

interface Props {
  initialLeads: any[]
  meta: { total: number; page: number; limit: number }
  token: string
  currentStatus: string
  currentPage: number
}

export function LeadsClient({ initialLeads, meta, token, currentStatus, currentPage }: Props) {
  const router = useRouter()
  const [leads, setLeads] = useState(initialLeads)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const totalPages = Math.ceil(meta.total / meta.limit)

  function navigate(status: string, page: number) {
    const q = new URLSearchParams()
    if (status) q.set('status', status)
    if (page > 1) q.set('page', String(page))
    router.push(`/dashboard/leads?${q.toString()}`)
  }

  async function updateStatus(leadId: string, status: string) {
    setUpdatingId(leadId)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l))
        if (selectedLead?.id === leadId) setSelectedLead((l: any) => ({ ...l, status }))
      }
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="flex gap-6">
      {/* List */}
      <div className="flex-1 min-w-0">
        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => navigate(opt.value, 1)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
                currentStatus === opt.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-400 self-center">{meta.total} resultado(s)</span>
        </div>

        {/* Table */}
        <div className="bg-white border rounded-2xl overflow-hidden">
          {leads.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="text-lg">Nenhum lead encontrado.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Curso</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Data</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leads.map((lead: any) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`hover:bg-gray-50 cursor-pointer transition ${selectedLead?.id === lead.id ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{lead.name}</p>
                      <p className="text-xs text-gray-400">{lead.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {lead.course?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLE[lead.status]}`}>
                        {STATUS_LABEL[lead.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">
                      {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <select
                        value={lead.status}
                        disabled={updatingId === lead.id}
                        onChange={e => updateStatus(lead.id, e.target.value)}
                        className="text-xs border rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.filter(o => o.value).map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {currentPage > 1 && (
              <button onClick={() => navigate(currentStatus, currentPage - 1)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                ← Anterior
              </button>
            )}
            <span className="text-sm text-gray-500">Página {currentPage} de {totalPages}</span>
            {currentPage < totalPages && (
              <button onClick={() => navigate(currentStatus, currentPage + 1)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Próxima →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedLead && (
        <div className="w-80 shrink-0">
          <div className="bg-white border rounded-2xl p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Detalhes</h2>
              <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Nome</p>
                <p className="font-medium text-gray-900">{selectedLead.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Email</p>
                <a href={`mailto:${selectedLead.email}`} className="text-blue-600 hover:underline">{selectedLead.email}</a>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Telefone</p>
                <a href={`tel:${selectedLead.phone}`} className="text-gray-700">{selectedLead.phone}</a>
              </div>
              {selectedLead.course?.name && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Curso de interesse</p>
                  <p className="text-gray-700">{selectedLead.course.name}</p>
                </div>
              )}
              {selectedLead.message && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Mensagem</p>
                  <p className="text-gray-600 bg-gray-50 rounded-lg p-3 text-xs leading-relaxed">{selectedLead.message}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Recebido em</p>
                <p className="text-gray-600">{new Date(selectedLead.createdAt).toLocaleString('pt-BR')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Status</p>
                <select
                  value={selectedLead.status}
                  disabled={updatingId === selectedLead.id}
                  onChange={e => updateStatus(selectedLead.id, e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
                >
                  {STATUS_OPTIONS.filter(o => o.value).map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <a
                href={`mailto:${selectedLead.email}`}
                className="flex-1 py-2.5 text-center text-sm font-medium border rounded-xl hover:bg-gray-50 transition"
              >
                Enviar email
              </a>
              <a
                href={`https://wa.me/55${selectedLead.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 text-center text-sm font-medium bg-green-500 text-white rounded-xl hover:bg-green-600 transition"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
