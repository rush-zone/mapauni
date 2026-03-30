'use client'
import { useState, useEffect } from 'react'

const AREAS = ['Saúde', 'Exatas', 'Humanas', 'Ciências Sociais Aplicadas', 'Artes e Design', 'Tecnologia', 'Educação', 'Direito', 'Negócios', 'Engenharia']
const DEGREES = [
  { value: 'BACHARELADO', label: 'Bacharelado' },
  { value: 'LICENCIATURA', label: 'Licenciatura' },
  { value: 'TECNOLOGO', label: 'Tecnólogo' },
  { value: 'POS_GRADUACAO', label: 'Pós-Graduação' },
  { value: 'MBA', label: 'MBA' },
  { value: 'MESTRADO', label: 'Mestrado' },
  { value: 'DOUTORADO', label: 'Doutorado' },
]
const MODALITIES = [
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'EAD', label: 'EAD' },
  { value: 'HIBRIDO', label: 'Híbrido' },
]
const SHIFTS = [
  { value: 'MANHA', label: 'Manhã' },
  { value: 'TARDE', label: 'Tarde' },
  { value: 'NOITE', label: 'Noite' },
  { value: 'INTEGRAL', label: 'Integral' },
]

interface CourseFormModalProps {
  course?: any
  token: string
  onClose: () => void
  onSave: (course: any) => void
}

const EMPTY = {
  name: '', area: 'Saúde', subArea: '', degree: 'BACHARELADO',
  modality: 'PRESENCIAL', shift: [] as string[], duration: 8,
  priceMonthly: '', description: '',
}

export function CourseFormModal({ course, token, onClose, onSave }: CourseFormModalProps) {
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isEdit = !!course

  useEffect(() => {
    if (course) {
      setForm({
        name: course.name,
        area: course.area,
        subArea: course.subArea ?? '',
        degree: course.degree,
        modality: course.modality,
        shift: course.shift ?? [],
        duration: course.duration,
        priceMonthly: course.priceMonthly ?? '',
        description: course.description ?? '',
      })
    }
  }, [course])

  function set(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleShift(s: string) {
    setForm(prev => ({
      ...prev,
      shift: prev.shift.includes(s) ? prev.shift.filter(x => x !== s) : [...prev.shift, s],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.shift.length === 0) { setError('Selecione ao menos um turno.'); return }

    setLoading(true)
    try {
      const payload: any = {
        name: form.name,
        area: form.area,
        degree: form.degree,
        modality: form.modality,
        shift: form.shift,
        duration: Number(form.duration),
      }
      if (form.subArea) payload.subArea = form.subArea
      if (form.priceMonthly) payload.priceMonthly = Number(form.priceMonthly)
      if (form.description) payload.description = form.description

      const url = `${process.env.NEXT_PUBLIC_API_URL}/courses${isEdit ? `/${course.id}` : ''}`
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao salvar.'); return }
      onSave(data)
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Editar curso' : 'Novo curso'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input
            type="text" placeholder="Nome do curso" required
            value={form.name} onChange={e => set('name', e.target.value)}
            className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Área</label>
              <select value={form.area} onChange={e => set('area', e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                {AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Sub-área (opcional)</label>
              <input type="text" placeholder="Ex: Medicina" value={form.subArea}
                onChange={e => set('subArea', e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Grau</label>
              <select value={form.degree} onChange={e => set('degree', e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                {DEGREES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Modalidade</label>
              <select value={form.modality} onChange={e => set('modality', e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                {MODALITIES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Turnos</label>
            <div className="flex gap-2 flex-wrap">
              {SHIFTS.map(s => (
                <button key={s.value} type="button" onClick={() => toggleShift(s.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                    form.shift.includes(s.value) ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Duração (semestres)</label>
              <input type="number" min={1} max={20} required value={form.duration}
                onChange={e => set('duration', e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Mensalidade (opcional)</label>
              <input type="number" min={0} placeholder="R$ 0,00" value={form.priceMonthly}
                onChange={e => set('priceMonthly', e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <textarea placeholder="Descrição (opcional)" rows={3} value={form.description}
            onChange={e => set('description', e.target.value)}
            className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none" />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
