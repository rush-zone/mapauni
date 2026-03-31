import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { api } from '@/lib/api'
import { LeadsClient } from './LeadsClient'

export default async function LeadsPage({ searchParams }: { searchParams: { status?: string; page?: string } }) {
  const session = await getServerSession(authOptions)
  const token = (session as any)?.accessToken

  const status = searchParams.status ?? ''
  const page = searchParams.page ?? '1'

  const query = new URLSearchParams({ limit: '20', page })
  if (status) query.set('status', status)

  let leads: any = { data: [], meta: { total: 0 } }
  try {
    leads = await api.get<any>(`/leads?${query}`, { Authorization: `Bearer ${token}` })
  } catch {}

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Leads</h1>
      <LeadsClient
        initialLeads={leads.data}
        meta={leads.meta}
        token={token}
        currentStatus={status}
        currentPage={Number(page)}
      />
    </div>
  )
}
