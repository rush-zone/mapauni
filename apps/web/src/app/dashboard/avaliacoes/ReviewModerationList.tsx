'use client'
import { useState } from 'react'

const STATUS_COLOR: Record<string, string> = {
  APPROVED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
}

export function ReviewModerationList({ reviews: initial, token, plan }: {
  reviews: any[]
  token: string
  plan: string
}) {
  const [reviews, setReviews] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const canHide = plan === 'PREMIUM' || plan === 'PRO'

  async function toggleHide(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'REJECTED' ? 'APPROVED' : 'REJECTED'
    setLoading(id)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) setReviews(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
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

  if (reviews.length === 0) {
    return <p className="text-gray-400 text-sm">Nenhuma avaliação ainda.</p>
  }

  const visible = reviews.filter(r => r.status !== 'REJECTED')
  const hidden = reviews.filter(r => r.status === 'REJECTED')

  return (
    <div className="space-y-6">
      {!canHide && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
          Upgrade para Premium ou PRO+ para ocultar avaliações indesejadas.
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Visíveis ({visible.length})
        </h2>
        <div className="space-y-3">
          {visible.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              loading={loading}
              canHide={canHide}
              onToggleHide={toggleHide}
              onReply={submitReply}
            />
          ))}
          {visible.length === 0 && <p className="text-gray-400 text-sm">Nenhuma avaliação visível.</p>}
        </div>
      </div>

      {hidden.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Ocultas ({hidden.length})
          </h2>
          <div className="space-y-3">
            {hidden.map(review => (
              <ReviewCard
                key={review.id}
                review={review}
                loading={loading}
                canHide={canHide}
                onToggleHide={toggleHide}
                onReply={submitReply}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewCard({ review, loading, canHide, onToggleHide, onReply }: {
  review: any
  loading: string | null
  canHide: boolean
  onToggleHide: (id: string, status: string) => void
  onReply: (id: string, text: string) => Promise<void>
}) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState(review.replyText ?? '')
  const [saving, setSaving] = useState(false)
  const isHidden = review.status === 'REJECTED'

  async function handleReply() {
    if (!replyText.trim()) return
    setSaving(true)
    await onReply(review.id, replyText)
    setSaving(false)
    setShowReply(false)
  }

  return (
    <div className={`bg-white border rounded-xl p-5 ${isHidden ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-gray-900">{review.authorName}</span>
            <span className="text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
            {isHidden && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-700">Oculta</span>
            )}
          </div>
          {review.courseStudied && <p className="text-xs text-blue-600 mb-1">{review.courseStudied}</p>}
          {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
          <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</p>

          {review.replyText && (
            <div className="mt-3 pl-4 border-l-2 border-blue-200">
              <p className="text-xs text-blue-600 font-medium mb-1">Resposta da universidade</p>
              <p className="text-sm text-gray-600">{review.replyText}</p>
            </div>
          )}

          {!isHidden && showReply && (
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
          {!isHidden && !showReply && (
            <button onClick={() => setShowReply(true)}
              className="px-3 py-1.5 text-sm border rounded-lg text-blue-600 hover:bg-blue-50">
              {review.replyText ? 'Editar resposta' : 'Responder'}
            </button>
          )}
          {canHide && (
            <button
              onClick={() => onToggleHide(review.id, review.status)}
              disabled={loading === review.id}
              className={`px-3 py-1.5 text-sm rounded-lg disabled:opacity-50 ${
                isHidden
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {loading === review.id ? '...' : isHidden ? 'Tornar visível' : 'Ocultar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
