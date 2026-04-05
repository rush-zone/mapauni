import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PerfilClient } from './PerfilClient'

export default async function PerfilPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const token = (session as any)?.accessToken ?? ''

  let university: any = null
  let fetchError = ''

  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
  try {
    const res = await fetch(`${apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      university = data?.university ?? null
    } else {
      fetchError = `Erro ${res.status} ao carregar perfil`
    }
  } catch (e: any) {
    fetchError = `Erro de conexão: ${e?.message ?? String(e)} | URL: ${apiUrl}`
  }

  if (fetchError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Perfil da Universidade</h1>
        <p className="text-red-500 text-sm">{fetchError}</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Perfil da Universidade</h1>
      <PerfilClient university={university} token={token} />
    </div>
  )
}
