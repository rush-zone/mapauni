'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const QUICK_AREAS = [
  { label: 'Saúde', icon: '🏥', keyword: 'Saúde' },
  { label: 'Engenharia', icon: '⚙️', keyword: 'Engenharia' },
  { label: 'Tecnologia', icon: '💻', keyword: 'Tecnologia' },
  { label: 'Educação', icon: '🎓', keyword: 'Educação' },
  { label: 'Direito', icon: '⚖️', keyword: 'Direito' },
  { label: 'Administração', icon: '📊', keyword: 'Administração' },
  { label: 'Agronomia', icon: '🌱', keyword: 'Agronomia' },
  { label: 'Artes', icon: '🎨', keyword: 'Artes' },
]

export function AreaSearch() {
  const [q, setQ] = useState('')
  const [areas, setAreas] = useState<{ area: string; count: number }[]>([])
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/search/areas`)
      .then((r) => r.json())
      .then((data) => setAreas(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = q.trim()
    ? areas.filter((a) => a.area.toLowerCase().includes(q.toLowerCase())).slice(0, 10)
    : []

  return (
    <div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-6">
        {QUICK_AREAS.map(({ label, icon, keyword }) => (
          <Link
            key={label}
            href={`/busca?modo=cursos&area=${encodeURIComponent(keyword)}`}
            className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group cursor-pointer"
          >
            <span className="text-2xl">{icon}</span>
            <span className="text-xs font-medium text-gray-600 group-hover:text-blue-600 text-center">{label}</span>
          </Link>
        ))}
      </div>

      <div ref={wrapperRef} className="relative max-w-lg">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar área específica... ex: Farmácia, Arquitetura, Psicologia"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-blue-400 text-sm shadow-sm"
          />
        </div>

        {open && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
            {filtered.map((a) => (
              <Link
                key={a.area}
                href={`/busca?modo=cursos&area=${encodeURIComponent(a.area)}`}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 transition-colors"
                onClick={() => { setQ(''); setOpen(false) }}
              >
                <span className="text-sm text-gray-700">{a.area}</span>
                <span className="text-xs text-gray-400 ml-4 flex-shrink-0">
                  {a.count.toLocaleString('pt-BR')} cursos
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
