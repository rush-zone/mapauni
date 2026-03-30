import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-white border-r flex flex-col p-4">
        <Link href="/" className="text-xl font-bold text-blue-600 mb-8 block">MapaUni</Link>
        <nav className="space-y-1 flex-1">
          <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">
            Visão Geral
          </Link>
          <Link href="/dashboard/leads" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">
            Leads
          </Link>
          <Link href="/dashboard/cursos" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">
            Cursos
          </Link>
          <Link href="/dashboard/avaliacoes" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">
            Avaliações
          </Link>
          <Link href="/dashboard/perfil" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">
            Perfil
          </Link>
        </nav>
        <div className="text-xs text-gray-400 mt-auto">{session.user?.email}</div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
