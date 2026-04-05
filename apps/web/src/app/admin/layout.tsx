'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [adminName, setAdminName] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token && pathname !== '/admin/login') {
      router.replace('/admin/login')
      return
    }
    setAdminName(localStorage.getItem('admin_name') || 'Admin')
    setReady(true)
  }, [pathname, router])

  if (pathname === '/admin/login') return <>{children}</>
  if (!ready) return null

  function logout() {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_name')
    router.push('/admin/login')
  }

  const links = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/universidades', label: 'Universidades' },
    { href: '/admin/descontos', label: 'Descontos ENEM' },
    { href: '/admin/importar', label: 'Importar IES (CSV)' },
    { href: '/admin/importar-cursos', label: 'Importar Cursos (CSV)' },
  ]

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="w-56 bg-slate-900 text-white flex flex-col p-4">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-0.5">InfoUni Central</p>
          <p className="text-lg font-bold">Admin Master</p>
        </div>

        <nav className="space-y-1 flex-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-700 pt-4 mt-4">
          <p className="text-xs text-slate-400 mb-2">{adminName}</p>
          <button
            onClick={logout}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
