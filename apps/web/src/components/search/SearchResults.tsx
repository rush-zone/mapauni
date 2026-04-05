import Link from 'next/link'
import { api } from '@/lib/api'
import { ArrowRight, Search } from 'lucide-react'

const LIMIT = 10

const MODALITY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PRESENCIAL: { bg: '#F0FDFA', color: '#0F766E', label: 'Presencial' },
  EAD:        { bg: '#FFFBEB', color: '#B45309', label: 'EaD' },
  HIBRIDO:    { bg: '#FAF5FF', color: '#7C3AED', label: 'Híbrido' },
}

const DEGREE_LABEL: Record<string, string> = {
  BACHARELADO: 'Bacharelado', LICENCIATURA: 'Licenciatura',
  TECNOLOGO: 'Tecnólogo', MBA: 'MBA', MESTRADO: 'Mestrado', DOUTORADO: 'Doutorado',
}

interface SearchResultsProps {
  params: Record<string, string | undefined>
}

export async function SearchResults({ params }: SearchResultsProps) {
  const page = Number(params.page ?? '1')
  const query = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v && k !== 'page') query.set(k, v) })
  query.set('limit', String(LIMIT))
  query.set('page', String(page))

  let results: any = { data: [], meta: { total: 0 } }
  let broadenedToState = false

  try {
    results = await api.get(`/search?${query.toString()}`)
  } catch {
    return <div className="text-sm text-red-500 p-4">Erro ao carregar resultados.</div>
  }

  // If city filter returned nothing, retry with state only
  if (results.meta.total === 0 && params.city && params.state) {
    try {
      const fallback = new URLSearchParams(query.toString())
      fallback.delete('city')
      const r = await api.get(`/search?${fallback.toString()}`)
      if (r.meta.total > 0) { results = r; broadenedToState = true }
    } catch {}
  }

  const totalPages = Math.ceil(results.meta.total / LIMIT)

  const pageUrl = (p: number) => {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v && k !== 'page') q.set(k, v) })
    q.set('page', String(p))
    return `/busca?${q.toString()}`
  }

  if (results.data.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-4">
          <Search size={18} className="text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-700">Nenhum curso encontrado</p>
        <p className="text-xs text-slate-400 mt-1">Tente outros filtros ou termos de busca</p>
      </div>
    )
  }

  return (
    <div>
      {broadenedToState && params.city && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-700">
          <span>Nenhum curso encontrado em <strong>{params.city}</strong> — mostrando cursos disponíveis no estado.</span>
        </div>
      )}
      <p className="text-xs text-slate-400 mb-4 font-medium">
        <span className="text-slate-700 font-semibold">{results.meta.total.toLocaleString('pt-BR')}</span>
        {' '}resultado{results.meta.total !== 1 ? 's' : ''} encontrado{results.meta.total !== 1 ? 's' : ''}
      </p>

      <div className="space-y-2">
        {results.data.map((course: any) => {
          const mod = MODALITY_STYLE[course.modality]
          return (
            <Link key={course.id} href={`/cursos/${course.slug}`}
              className="flex gap-4 bg-white rounded-xl border border-slate-100 p-4 hover:border-blue-200 hover:shadow-hover transition-all group"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

              {/* Logo */}
              <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {course.university?.logoUrl
                  ? <img src={course.university.logoUrl} alt="" className="w-full h-full object-contain p-1.5" />
                  : <span className="text-sm font-bold text-slate-400">{course.university?.name?.[0]}</span>
                }
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm group-hover:text-blue-700 transition-colors truncate leading-tight">
                      {course.name}
                    </h3>
                    <p className="text-xs text-blue-600 font-medium truncate mt-0.5">{course.university?.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {course.university?.city}, {course.university?.state}
                      {course.degree && <> · {DEGREE_LABEL[course.degree] ?? course.degree}</>}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    {course.priceMonthly
                      ? <>
                          <p className="text-sm font-bold text-slate-900 tabular-nums">
                            R$ {course.priceMonthly.toLocaleString('pt-BR')}
                          </p>
                          <p className="text-xs text-slate-400">/mês</p>
                        </>
                      : <p className="text-xs font-semibold text-teal-600">Consulte</p>
                    }
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  {mod && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: mod.bg, color: mod.color }}>
                      {mod.label}
                    </span>
                  )}
                  {course.enade && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                      ENADE {course.enade}
                    </span>
                  )}
                  {course.offers?.[0]?.prouni && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: '#F0FDF4', color: '#15803D' }}>ProUni</span>
                  )}
                  {course.offers?.[0]?.fies && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: '#EFF6FF', color: '#1E40AF' }}>FIES</span>
                  )}
                  <span className="text-xs text-slate-400 ml-auto flex items-center gap-1 group-hover:text-blue-600 font-medium transition-colors">
                    Ver curso <ArrowRight size={11} />
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-8">
          {page > 1 && (
            <Link href={pageUrl(page - 1)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-500 hover:bg-slate-50 transition-colors font-medium">
              Anterior
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis')
              acc.push(p)
              return acc
            }, [])
            .map((p, idx) =>
              p === 'ellipsis' ? (
                <span key={`e-${idx}`} className="px-2 text-xs text-slate-400">…</span>
              ) : (
                <Link key={p} href={pageUrl(p as number)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-semibold border transition-colors ${
                    p === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}>
                  {p}
                </Link>
              )
            )}
          {page < totalPages && (
            <Link href={pageUrl(page + 1)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-500 hover:bg-slate-50 transition-colors font-medium">
              Próxima
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
