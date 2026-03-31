import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { api } from '@/lib/api'
import { ReviewModerationList } from './ReviewModerationList'

export default async function AvaliacoesPage() {
  const session = await getServerSession(authOptions)
  const token = (session as any)?.accessToken

  let reviews: any[] = []
  let plan = 'PREMIUM'
  try {
    const [reviewsRes, me] = await Promise.all([
      api.get<{ data: any[] }>('/reviews', { Authorization: `Bearer ${token}` }),
      api.get<any>('/auth/me', { Authorization: `Bearer ${token}` }),
    ])
    reviews = reviewsRes.data
    plan = me?.university?.plan ?? 'PREMIUM'
  } catch {}

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Avaliações</h1>
      <ReviewModerationList reviews={reviews} token={token} plan={plan} />
    </div>
  )
}
