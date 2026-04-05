import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DescontosClient } from './DescontosClient'

const API = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1'

export default async function DescontosPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const token = (session as any).accessToken
  const universityId = (session as any).universityId

  const [rulesRes, coursesRes] = await Promise.all([
    fetch(`${API}/discount-rules`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
    fetch(`${API}/courses?universityId=${universityId}&limit=200`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
  ])

  const rules = rulesRes.ok ? await rulesRes.json() : []
  const coursesData = coursesRes.ok ? await coursesRes.json() : { data: [] }
  const courses = Array.isArray(coursesData) ? coursesData : (coursesData.data ?? [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Descontos ENEM</h1>
      <p className="text-sm text-gray-500 mb-8">
        Cadastre faixas de desconto baseadas na nota do ENEM. Novas regras ficam pendentes até aprovação.
      </p>
      <DescontosClient rules={rules} courses={courses} token={token} />
    </div>
  )
}
