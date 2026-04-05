import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, BookOpen, Star, Percent, Building2, ExternalLink,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',            label: 'Visão Geral',    Icon: LayoutDashboard },
  { href: '/dashboard/leads',      label: 'Leads',          Icon: Users           },
  { href: '/dashboard/cursos',     label: 'Cursos',         Icon: BookOpen        },
  { href: '/dashboard/avaliacoes', label: 'Avaliações',     Icon: Star            },
  { href: '/dashboard/descontos',  label: 'Descontos ENEM', Icon: Percent         },
  { href: '/dashboard/perfil',     label: 'Perfil',         Icon: Building2       },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen" style={{ background: '#F8FAFC' }}>

      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 h-screen flex flex-col z-40"
        style={{ width: 220, background: '#0F172A', borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: '#2563EB' }}>
              <span className="text-white font-bold text-xs tracking-tight">IU</span>
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">InfoUni</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, Icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]"
            >
              <Icon size={15} className="flex-shrink-0 opacity-70" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-5 pt-3 border-t space-y-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="px-3 py-2">
            <p className="text-xs font-medium truncate" style={{ color: '#475569' }}>
              {session.user?.name}
            </p>
            <p className="text-xs truncate" style={{ color: '#334155' }}>
              {session.user?.email}
            </p>
          </div>
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 text-slate-600 hover:text-slate-400"
          >
            <ExternalLink size={13} />
            <span className="text-xs">Ver site público</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto" style={{ marginLeft: 220 }}>
        <div className="max-w-5xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
