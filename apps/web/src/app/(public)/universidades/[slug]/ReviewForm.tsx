'use client'
import { useState } from 'react'

export function ReviewForm({ universitySlug }: { universitySlug: string }) {
  const [form, setForm] = useState({ authorName: '', authorEmail: '', courseStudied: '', comment: '', rating: 0 })
  const [hover, setHover] = useState(0)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.rating === 0) return
    setStatus('loading')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/universities/${universitySlug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rating: form.rating }),
      })
      if (res.ok) {
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-3">⭐</div>
        <p className="font-semibold text-gray-900">Avaliação enviada!</p>
        <p className="text-sm text-gray-500 mt-1">Obrigado pelo seu feedback.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Stars */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Sua nota</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setForm(prev => ({ ...prev, rating: star }))}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="text-3xl transition"
            >
              <span className={(hover || form.rating) >= star ? 'text-yellow-400' : 'text-gray-300'}>★</span>
            </button>
          ))}
        </div>
        {form.rating === 0 && status === 'error' && (
          <p className="text-xs text-red-500 mt-1">Selecione uma nota.</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text" placeholder="Seu nome" required
          value={form.authorName} onChange={e => set('authorName', e.target.value)}
          className="border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
        />
        <input
          type="email" placeholder="Seu email (não será exibido)" required
          value={form.authorEmail} onChange={e => set('authorEmail', e.target.value)}
          className="border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      <input
        type="text" placeholder="Curso que estudou (opcional)"
        value={form.courseStudied} onChange={e => set('courseStudied', e.target.value)}
        className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
      />

      <textarea
        placeholder="Conte sua experiência (opcional)"
        rows={3} value={form.comment} onChange={e => set('comment', e.target.value)}
        className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none"
      />

      {status === 'error' && <p className="text-sm text-red-500">Erro ao enviar. Tente novamente.</p>}

      <button
        type="submit"
        disabled={status === 'loading' || form.rating === 0}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {status === 'loading' ? 'Enviando...' : 'Publicar avaliação'}
      </button>
    </form>
  )
}
