import { Suspense } from 'react'
import Link from 'next/link'
import { UniversityRichResults } from '@/components/search/UniversityRichResults'
import { SearchResults } from '@/components/search/SearchResults'
import { StateBrowser } from '@/components/search/StateBrowser'
import { SearchFilters } from '@/components/search/SearchFilters'
import { SmartSearchBar } from '@/components/search/SmartSearchBar'

interface SearchPageProps {
  searchParams: {
    q?: string
    modality?: string
    shift?: string
    degree?: string
    type?: string
    area?: string
    city?: string
    state?: string
    orgAcademica?: string
    page?: string
    modo?: string
  }
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const hasCity    = !!searchParams.city
  const hasState   = !!searchParams.state
  const hasQ       = !!searchParams.q
  const hasCourse  = !!(searchParams.modality || searchParams.shift || searchParams.degree)

  // When q or city is set, default to courses; otherwise universities
  const modo = searchParams.modo ?? (hasQ || hasCity ? 'cursos' : 'universidades')

  // State-only → show state browser (click city to drill down)
  const showStateBrowser = hasState && !hasCity && !hasQ && !hasCourse

  // Reconstruct navbar search bar initial value
  const initialParts: string[] = []
  if (searchParams.city)     initialParts.push(searchParams.city)
  if (searchParams.q)        initialParts.push(searchParams.q)
  if (searchParams.modality === 'EAD')       initialParts.push('EaD')
  else if (searchParams.modality === 'PRESENCIAL') initialParts.push('Presencial')
  else if (searchParams.modality === 'HIBRIDO')    initialParts.push('Híbrido')
  const initialValue = initialParts.join(', ')

  // Breadcrumb context
  const crumbs: string[] = []
  if (searchParams.city)  crumbs.push(searchParams.city)
  if (searchParams.state && !searchParams.city) crumbs.push(searchParams.state)
  if (searchParams.q)     crumbs.push(searchParams.q)

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
          <Link href="/" className="text-sm font-bold text-slate-900 tracking-tight flex-shrink-0">InfoUni</Link>
          <div className="flex-1 max-w-2xl">
            <SmartSearchBar compact initialValue={initialValue} />
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Entrar
            </Link>
            <Link href="/registro"
              className="text-sm font-semibold px-4 py-1.5 rounded-lg text-white transition-colors"
              style={{ background: '#0F172A' }}>
              Para universidades
            </Link>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-3">
        <p className="text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-600 transition-colors">Início</Link>
          {' / '}
          {showStateBrowser
            ? <span className="text-slate-500">Estados</span>
            : <span className="text-slate-500">Universidades</span>
          }
          {crumbs.length > 0 && (
            <span className="text-slate-500"> / {crumbs.join(' · ')}</span>
          )}
        </p>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="flex gap-6">

          {/* Sidebar filters — hidden on state browser view */}
          {!showStateBrowser && (
            <aside className="w-56 flex-shrink-0 hidden md:block">
              <Suspense>
                <SearchFilters params={searchParams} modo={modo === 'cursos' ? 'cursos' : 'universidades'} />
              </Suspense>
            </aside>
          )}

          {/* Results */}
          <div className="flex-1 min-w-0">

            {/* Tabs — when q or city is set */}
            {(hasQ || hasCity) && !showStateBrowser && (
              <div className="flex gap-1 mb-5 border-b border-slate-100">
                {[
                  { key: 'cursos', label: 'Cursos' },
                  { key: 'universidades', label: 'Universidades' },
                ].map(tab => {
                  const p = new URLSearchParams()
                  Object.entries(searchParams).forEach(([k, v]) => { if (v && k !== 'page' && k !== 'modo') p.set(k, v) })
                  p.set('modo', tab.key)
                  return (
                    <Link
                      key={tab.key}
                      href={`/busca?${p.toString()}`}
                      className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                        modo === tab.key
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {tab.label}
                    </Link>
                  )
                })}
              </div>
            )}

            <Suspense fallback={
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-24 bg-white rounded-xl border border-slate-100 animate-pulse" />
                ))}
              </div>
            }>
              {showStateBrowser
                ? <StateBrowser selectedState={searchParams.state} />
                : modo === 'cursos'
                  ? <SearchResults params={searchParams} />
                  : <UniversityRichResults params={searchParams} />
              }
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
