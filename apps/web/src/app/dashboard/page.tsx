import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { api } from '@/lib/api'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const token = (session as any)?.accessToken

  let leads: any = { data: [], meta: { total: 0 } }
  let stats: any = { total: 0, thisMonth: 0, responseRate: 0, enrolled: 0 }

  try {
    [leads, stats] = await Promise.all([
      api.get('/leads?limit=5', { Authorization: `Bearer ${token}` }),
      api.get('/leads/stats', { Authorization: `Bearer ${token}` }),
    ])
  } catch {}

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Visão Geral</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border rounded-xl p-6">
          <p className="text-sm text-gray-500">Total de leads</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border rounded-xl p-6">
          <p className="text-sm text-gray-500">Leads este mês</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.thisMonth}</p>
        </div>
        <div className="bg-white border rounded-xl p-6">
          <p className="text-sm text-gray-500">Taxa de resposta</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.responseRate}%</p>
        </div>
        <div className="bg-white border rounded-xl p-6">
          <p className="text-sm text-gray-500">Matrículas</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{stats.enrolled}</p>
        </div>
      </div>
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Últimos leads</h2>
        {leads.data.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhum lead ainda.</p>
        ) : (
          <div className="space-y-3">
            {leads.data.map((lead: any) => (
              <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{lead.name}</p>
                  <p className="text-sm text-gray-500">{lead.email} &bull; {lead.phone}</p>
                  {lead.course && <p className="text-xs text-blue-600 mt-1">{lead.course.name}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  lead.status === 'NEW' ? 'bg-blue-50 text-blue-700' :
                  lead.status === 'OPENED' ? 'bg-yellow-50 text-yellow-700' :
                  lead.status === 'CONTACTED' ? 'bg-purple-50 text-purple-700' :
                  lead.status === 'ENROLLED' ? 'bg-green-50 text-green-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{lead.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
