import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { api } from '@/lib/api'

export default async function PerfilPage() {
  const session = await getServerSession(authOptions)
  const token = (session as any)?.accessToken
  const universityId = (session as any)?.universityId

  let university: any = null
  try {
    const result: any = await api.get(`/universities?limit=1`, {
      Authorization: `Bearer ${token}`,
    })
    university = result?.data?.find((u: any) => u.id === universityId) ?? null
  } catch {}

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Perfil da Universidade</h1>
      <div className="bg-white border rounded-xl p-6 max-w-2xl">
        {!university ? (
          <p className="text-gray-400">Carregando informações...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Nome</p>
              <p className="font-semibold text-gray-900">{university.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cidade / Estado</p>
              <p className="font-medium text-gray-700">{university.city}, {university.state}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tipo</p>
              <p className="font-medium text-gray-700">{university.type}</p>
            </div>
            {university.email && (
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-700">{university.email}</p>
              </div>
            )}
            {university.phone && (
              <div>
                <p className="text-sm text-gray-500">Telefone</p>
                <p className="font-medium text-gray-700">{university.phone}</p>
              </div>
            )}
            {university.website && (
              <div>
                <p className="text-sm text-gray-500">Site</p>
                <a href={university.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{university.website}</a>
              </div>
            )}
            <div className="pt-2">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                university.plan === 'PRO' ? 'bg-purple-100 text-purple-700' :
                university.plan === 'PREMIUM' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>Plano {university.plan}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
