import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { api } from '@/lib/api'
import { PerfilClient } from './PerfilClient'

export default async function PerfilPage() {
  const session = await getServerSession(authOptions)
  const token = (session as any)?.accessToken

  let university: any = null
  try {
    const me = await api.get<any>('/auth/me', { Authorization: `Bearer ${token}` })
    university = me?.university ?? null
  } catch {}

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Perfil da Universidade</h1>
      <PerfilClient university={university} token={token} />
    </div>
  )
}
