'use client'

import { useState } from 'react'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  APPROVED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
}

export function ReviewModerationList({ reviews: initial, token }: { reviews: any[]; token: string }) {
  const [reviews, setReviews] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)

  async function updateStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    setLoading(id)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      if (res.ok) setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    } finally {
      setLoading(null)
    }
  }

  async function submitReply(id: string, replyText: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${id}/reply`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ replyText }),
    })
    if (res.ok) {
      const updated = await res.json()
      setReviews(prev => prev.map(r => r.id === id ? { ...r, replyText: updated.replyText, repliedAt: updated.repliedAt } : r))
    }
  }

  const pending = reviews.filter(r => r.status === 'PENDING')
  const rest = reviews.filter(r => r.status !== 'PENDING')

  if (reviews.length === 0) {
    return <p className="text-gray-400 text-sm">Nenhuma avaliação ainda.</p>
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Aguardando moderação ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map(review => (
              <ReviewCard key={review.id} review={review} loading={loading} onUpdate={updateStatus} onReply={submitReply} />
            ))}
          </div>
        </div>
      )}
      {rest.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Histórico</h2>
          <div className="space-y-3">
            {rest.map(review => (
              <ReviewCard key={review.id} review={review} loading={loading} onUpdate={updateStatus} onReply={submitReply} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewCard({ review, loading, onUpdate, onReply }: {
  review: any
  loading: string | null
  onUpdate: (id: string, status: 'APPROVED' | 'REJECTED') => void
  onReply: (id: string, text: string) => Promise<void>
}) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState(review.replyText ?? '')
  const [saving, setSaving] = useState(false)

  async function handleReply() {
    if (!replyText.trim()) return
    setSaving(true)
    await onReply(review.id, replyText)
    setSaving(false)
    setShowReply(false)
  }

  return (
    <div className="bg-white border rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{review.authorName}</span>
            <span className="text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[review.status]}`}>
              {STATUS_LABEL[review.status]}
            </span>
          </div>
          {review.courseStudied && <p className="text-xs text-blue-600 mb-1">{review.courseStudied}</p>}
          {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
          <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</p>

          {/* Resposta existente */}
          {review.replyText && (
            <div className="mt-3 pl-4 border-l-2 border-blue-200">
              <p className="text-xs text-blue-600 font-medium mb-1">Resposta da universidade</p>
              <p className="text-sm text-gray-600">{review.replyText}</p>
            </div>
          )}

          {/* Formulário de resposta */}
          {review.status === 'APPROVED' && showReply && (
            <div className="mt-3 space-y-2">
              <textarea
                rows={2} placeholder="Escreva sua resposta..."
                value={replyText} onChange={e => setReplyText(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={handleReply} disabled={saving || !replyText.trim()}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Salvando...' : 'Publicar resposta'}
                </button>
                <button onClick={() => setShowReply(false)}
                  className="px-3 py-1.5 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 shrink-0 items-end">
          {review.status === 'PENDING' && (
            <>
              <button onClick={() => onUpdate(review.id, 'APPROVED')} disabled={loading === review.id}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                Aprovar
              </button>
              <button onClick={() => onUpdate(review.id, 'REJECTED')} disabled={loading === review.id}
                className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50">
                Rejeitar
              </button>
            </>
          )}
          {review.status === 'APPROVED' && !showReply && (
            <button onClick={() => setShowReply(true)}
              className="px-3 py-1.5 text-sm border rounded-lg text-blue-600 hover:bg-blue-50">
              {review.replyText ? 'Editar resposta' : 'Responder'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
