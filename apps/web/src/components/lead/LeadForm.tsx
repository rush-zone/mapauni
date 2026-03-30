'use client'
import { useState } from 'react'
import { api } from '@/lib/api'

interface LeadFormProps {
  universityId: string
  universityName: string
  courseId?: string
}

export function LeadForm({ universityId, universityName, courseId }: LeadFormProps) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      await api.post('/leads', {
        ...form,
        universityId,
        courseId,
        source: 'perfil_universidade',
      })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-3">✓</div>
        <p className="font-semibold text-gray-900">Mensagem enviada!</p>
        <p className="text-sm text-gray-500 mt-1">{universityName} entrará em contato em breve.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="Seu nome"
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
      />
      <input
        type="email"
        placeholder="Seu email"
        required
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
      />
      <input
        type="tel"
        placeholder="Seu telefone/WhatsApp"
        required
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
      />
      <textarea
        placeholder="Mensagem (opcional)"
        rows={3}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
      />
      {status === 'error' && <p className="text-sm text-red-500">Erro ao enviar. Tente novamente.</p>}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        {status === 'loading' ? 'Enviando...' : 'Quero mais informações'}
      </button>
    </form>
  )
}
