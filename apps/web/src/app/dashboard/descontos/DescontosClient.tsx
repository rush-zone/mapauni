'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DiscountRule {
  id: string
  courseId: string | null
  course: { id: string; name: string; degree: string } | null
  scoreMin: number
  scoreMax: number | null
  discountPercent: number
  modalityRestriction: string | null
  vacanciesLimit: number | null
  vacanciesUsed: number
  validFrom: string
  validUntil: string | null
  active: boolean
  approvedAt: string | null
}

interface Course {
  id: string
  name: string
  degree: string
  modality: string
}

interface Props {
  rules: DiscountRule[]
  courses: Course[]
  token: string
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1'

const DEGREE_LABEL: Record<string, string> = {
  BACHARELADO: 'Bach.',
  LICENCIATURA: 'Lic.',
  TECNOLOGO: 'Tec.',
  POS_GRADUACAO: 'Pós',
  MBA: 'MBA',
  MESTRADO: 'Mest.',
  DOUTORADO: 'Dout.',
}

const emptyForm = {
  courseId: '',
  scoreMin: '',
  scoreMax: '',
  discountPercent: '',
  modalityRestriction: '',
  vacanciesLimit: '',
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: '',
}

export function DescontosClient({ rules: initialRules, courses, token }: Props) {
  const router = useRouter()
  const [rules, setRules] = useState<DiscountRule[]>(initialRules)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    const res = await fetch(`${API}/discount-rules`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setRules(Array.isArray(data) ? data : [])
    }
    setRefreshing(false)
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  function openEdit(rule: DiscountRule) {
    setEditingId(rule.id)
    setForm({
      courseId: rule.courseId ?? '',
      scoreMin: String(rule.scoreMin),
      scoreMax: rule.scoreMax != null ? String(rule.scoreMax) : '',
      discountPercent: String(rule.discountPercent),
      modalityRestriction: rule.modalityRestriction ?? '',
      vacanciesLimit: rule.vacanciesLimit != null ? String(rule.vacanciesLimit) : '',
      validFrom: rule.validFrom.slice(0, 10),
      validUntil: rule.validUntil ? rule.validUntil.slice(0, 10) : '',
    })
    setError('')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload: any = {
      scoreMin: Number(form.scoreMin),
      discountPercent: Number(form.discountPercent),
      validFrom: form.validFrom,
      courseId: form.courseId || null,
      scoreMax: form.scoreMax ? Number(form.scoreMax) : null,
      modalityRestriction: form.modalityRestriction || null,
      vacanciesLimit: form.vacanciesLimit ? Number(form.vacanciesLimit) : null,
      validUntil: form.validUntil || null,
    }

    const url = editingId ? `${API}/discount-rules/${editingId}` : `${API}/discount-rules`
    const method = editingId ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Erro ao salvar regra.')
      setSaving(false)
      return
    }

    setShowForm(false)
    setSaving(false)
    router.refresh()
    // Optimistic update
    const saved = await res.json().catch(() => null)
    if (saved) {
      setRules(prev =>
        editingId ? prev.map(r => r.id === editingId ? saved : r) : [saved, ...prev]
      )
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover esta regra de desconto?')) return
    setDeletingId(id)
    await fetch(`${API}/discount-rules/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setRules(prev => prev.filter(r => r.id !== id))
    setDeletingId(null)
  }

  async function handleToggle(rule: DiscountRule) {
    if (!rule.approvedAt && !rule.active) {
      alert('Esta regra ainda não foi aprovada pelo administrador.')
      return
    }
    setTogglingId(rule.id)
    const res = await fetch(`${API}/discount-rules/${rule.id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const updated = await res.json()
      setRules(prev => prev.map(r => r.id === rule.id ? updated : r))
    }
    setTogglingId(null)
  }

  const statusBadge = (rule: DiscountRule) => {
    if (rule.active) return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Ativa</span>
    if (rule.approvedAt) return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Pausada</span>
    return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">Aguardando aprovação</span>
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{rules.length} regra{rules.length !== 1 ? 's' : ''} cadastrada{rules.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <button onClick={handleRefresh} disabled={refreshing}
            className="px-3 py-2 border text-sm rounded-xl hover:bg-gray-50 text-gray-600 transition disabled:opacity-50">
            {refreshing ? '...' : '↻ Atualizar'}
          </button>
          <button onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition">
            + Nova regra
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">
            {editingId ? 'Editar regra' : 'Nova regra de desconto'}
          </h2>
          <p className="text-xs text-gray-500">
            Regras novas ou editadas ficam pendentes até aprovação do administrador.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Curso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
              <select value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}
                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900">
                <option value="">Todos os cursos da universidade</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {DEGREE_LABEL[c.degree] ?? c.degree}</option>
                ))}
              </select>
            </div>

            {/* Faixa de nota */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nota mínima ENEM *</label>
                <input type="number" min={0} max={1000} required placeholder="Ex: 600"
                  value={form.scoreMin} onChange={e => setForm(p => ({ ...p, scoreMin: e.target.value }))}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nota máxima ENEM</label>
                <input type="number" min={0} max={1000} placeholder="Ex: 699 (vazio = sem limite)"
                  value={form.scoreMax} onChange={e => setForm(p => ({ ...p, scoreMax: e.target.value }))}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900" />
              </div>
            </div>

            {/* Desconto e modalidade */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desconto (%) *</label>
                <input type="number" min={1} max={100} required placeholder="Ex: 25"
                  value={form.discountPercent} onChange={e => setForm(p => ({ ...p, discountPercent: e.target.value }))}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade</label>
                <select value={form.modalityRestriction} onChange={e => setForm(p => ({ ...p, modalityRestriction: e.target.value }))}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900">
                  <option value="">Todas</option>
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="EAD">EaD</option>
                  <option value="HIBRIDO">Híbrido</option>
                </select>
              </div>
            </div>

            {/* Vagas e vigência */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vagas com desconto</label>
                <input type="number" min={1} placeholder="Vazio = ilimitado"
                  value={form.vacanciesLimit} onChange={e => setForm(p => ({ ...p, vacanciesLimit: e.target.value }))}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Válido de *</label>
                <input type="date" required
                  value={form.validFrom} onChange={e => setForm(p => ({ ...p, validFrom: e.target.value }))}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Válido até</label>
                <input type="date"
                  value={form.validUntil} onChange={e => setForm(p => ({ ...p, validUntil: e.target.value }))}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900" />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition">
                {saving ? 'Salvando...' : 'Salvar e enviar para aprovação'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-2.5 border text-sm font-medium rounded-xl hover:bg-gray-50 transition text-gray-700">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rules table */}
      {rules.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center">
          <p className="text-gray-400 text-sm">Nenhuma regra cadastrada ainda.</p>
          <p className="text-gray-400 text-xs mt-1">Crie sua primeira faixa de desconto ENEM.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Curso</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nota ENEM</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Desconto</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vagas</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vigência</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rules.map(rule => (
                <tr key={rule.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 text-gray-900">
                    {rule.course ? (
                      <span>{rule.course.name} <span className="text-gray-400">({DEGREE_LABEL[rule.course.degree] ?? rule.course.degree})</span></span>
                    ) : (
                      <span className="text-gray-500 italic">Todos os cursos</span>
                    )}
                    {rule.modalityRestriction && (
                      <span className="ml-2 text-xs text-blue-600">{rule.modalityRestriction}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    {rule.scoreMax ? `${rule.scoreMin}–${rule.scoreMax}` : `${rule.scoreMin}+`}
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-semibold text-green-700">{rule.discountPercent}%</span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {rule.vacanciesLimit != null
                      ? `${rule.vacanciesUsed}/${rule.vacanciesLimit}`
                      : '∞'}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(rule.validFrom).toLocaleDateString('pt-BR')}
                    {rule.validUntil && ` → ${new Date(rule.validUntil).toLocaleDateString('pt-BR')}`}
                  </td>
                  <td className="px-5 py-3">{statusBadge(rule)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {rule.approvedAt && (
                        <button onClick={() => handleToggle(rule)} disabled={togglingId === rule.id}
                          className="text-xs text-gray-500 hover:text-gray-800 border rounded-lg px-2 py-1 transition disabled:opacity-40">
                          {rule.active ? 'Pausar' : 'Ativar'}
                        </button>
                      )}
                      <button onClick={() => openEdit(rule)}
                        className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg px-2 py-1 transition">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(rule.id)} disabled={deletingId === rule.id}
                        className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-2 py-1 transition disabled:opacity-40">
                        {deletingId === rule.id ? '...' : 'Remover'}
                      </button>
                    </div>
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
