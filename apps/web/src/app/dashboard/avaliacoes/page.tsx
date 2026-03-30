import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { api } from '@/lib/api'
import { ReviewModerationList } from './ReviewModerationList'

export default async function AvaliacoesPage() {
  const session = await getServerSession(authOptions)
  const token = (session as any)?.accessToken

  let reviews: any[] = []
  try {
    const res = await api.get('/reviews', { Authorization: `Bearer ${token}` })
    reviews = res.data
  } catch {}

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Avaliações</h1>
      <ReviewModerationList reviews={reviews} token={token} />
    </div>
  )
}
