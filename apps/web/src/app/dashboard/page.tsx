import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { api } from '@/lib/api'
import { TrendingUp, Users, MessageSquare, GraduationCap } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  NEW: 'Novo', OPENED: 'Aberto', CONTACTED: 'Contatado', ENROLLED: 'Matriculado', LOST: 'Perdido',
}
const STATUS_DOT: Record<string, string> = {
  NEW: '#3B82F6', OPENED: '#F59E0B', CONTACTED: '#8B5CF6', ENROLLED: '#10B981', LOST: '#94A3B8',
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const token = (session as any)?.accessToken

  let leads: any = { data: [], meta: { total: 0 } }
  let stats: any = { total: 0, thisMonth: 0, responseRate: 0, enrolled: 0 }

  try {
    [leads, stats] = await Promise.all([
      api.get('/leads?limit=8', { Authorization: `Bearer ${token}` }),
      api.get('/leads/stats', { Authorization: `Bearer ${token}` }),
    ])
  } catch {}

  const METRICS = [
    { label: 'Total de leads',   value: stats.total,        icon: Users,         delta: null },
    { label: 'Este mês',         value: stats.thisMonth,    icon: TrendingUp,    delta: null },
    { label: 'Taxa de resposta', value: `${stats.responseRate}%`, icon: MessageSquare, delta: null },
    { label: 'Matrículas',       value: stats.enrolled,     icon: GraduationCap, delta: null },
  ]

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Visão Geral</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map(({ label, value, icon: Icon }) => (
          <div key={label}
            className="bg-white rounded-xl border p-5 transition-shadow hover:shadow-hover"
            style={{ borderColor: '#E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
              <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                <Icon size={13} className="text-slate-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent leads */}
      <div className="bg-white rounded-xl border overflow-hidden"
        style={{ borderColor: '#E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#F1F5F9' }}>
          <h2 className="text-sm font-semibold text-slate-900">Leads recentes</h2>
          <a href="/dashboard/leads"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
            Ver todos →
          </a>
        </div>

        {leads.data.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
              <Users size={16} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-400">Nenhum lead ainda</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #F8FAFC' }}>
                {['Nome', 'Curso', 'Contato', 'ENEM', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#94A3B8', background: '#FAFBFC' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.data.map((lead: any, i: number) => (
                <tr key={lead.id}
                  className="transition-colors hover:bg-slate-50"
                  style={{ borderBottom: i < leads.data.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                  <td className="px-6 py-3.5">
                    <span className="font-medium text-slate-800">{lead.name}</span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-500 max-w-[180px] truncate">
                    {lead.course?.name ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-6 py-3.5 text-slate-400 text-xs">{lead.email}</td>
                  <td className="px-6 py-3.5 text-slate-500">
                    {lead.enemScore
                      ? <span className="font-medium tabular-nums">{lead.enemScore}</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: STATUS_DOT[lead.status] ?? '#94A3B8' }} />
                      <span style={{ color: STATUS_DOT[lead.status] ?? '#94A3B8' }}>
                        {STATUS_LABEL[lead.status] ?? lead.status}
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
