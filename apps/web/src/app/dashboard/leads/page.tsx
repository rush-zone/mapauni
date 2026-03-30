import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { api } from '@/lib/api'

export default async function LeadsPage() {
  const session = await getServerSession(authOptions)
  const token = (session as any)?.accessToken

  let leads: any = { data: [], meta: { total: 0 } }
  try {
    leads = await api.get('/leads?limit=50', { Authorization: `Bearer ${token}` })
  } catch {}

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Leads ({leads.meta.total})</h1>
      <div className="bg-white border rounded-xl overflow-hidden">
        {leads.data.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhum lead recebido ainda.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Telefone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Curso</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads.data.map((lead: any) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{lead.name}</td>
                  <td className="px-4 py-3 text-gray-600">{lead.email}</td>
                  <td className="px-4 py-3 text-gray-600">{lead.phone}</td>
                  <td className="px-4 py-3 text-gray-500">{lead.course?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      lead.status === 'NEW' ? 'bg-blue-50 text-blue-700' :
                      lead.status === 'OPENED' ? 'bg-yellow-50 text-yellow-700' :
                      lead.status === 'CONTACTED' ? 'bg-purple-50 text-purple-700' :
                      lead.status === 'ENROLLED' ? 'bg-green-50 text-green-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{lead.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
