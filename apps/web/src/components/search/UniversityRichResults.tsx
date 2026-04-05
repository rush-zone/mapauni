import Link from 'next/link'
import { api } from '@/lib/api'
import { Search, ArrowRight, BookOpen, Globe, Sun, GraduationCap } from 'lucide-react'

const LIMIT = 15

const TYPE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  FEDERAL:  { bg: '#EFF6FF', color: '#1D4ED8', label: 'Federal' },
  ESTADUAL: { bg: '#FAF5FF', color: '#7C3AED', label: 'Estadual' },
  MUNICIPAL:{ bg: '#F0FDF4', color: '#15803D', label: 'Municipal' },
  PRIVADA:  { bg: '#FFF7ED', color: '#C2410C', label: 'Privada' },
}

const MODALITY_LABEL: Record<string, string> = {
  PRESENCIAL: 'Presencial', EAD: 'EaD', HIBRIDO: 'Híbrido',
}
const SHIFT_LABEL: Record<string, string> = {
  MANHA: 'Manhã', TARDE: 'Tarde', NOITE: 'Noite', INTEGRAL: 'Integral',
}
const DEGREE_LABEL: Record<string, string> = {
  BACHARELADO: 'Bacharelado', LICENCIATURA: 'Licenciatura',
  TECNOLOGO: 'Tecnólogo', MBA: 'MBA', MESTRADO: 'Mestrado', DOUTORADO: 'Doutorado',
}

interface Params {
  q?: string
  city?: string
  state?: string
  type?: string
  modality?: string
  shift?: string
  degree?: string
  orgAcademica?: string
  page?: string
}

function buildContextLabel(params: Params): string {
  const parts: string[] = []
  if (params.city)     parts.push(params.city)
  if (params.state)    parts.push(params.state)
  if (params.q)        parts.push(params.q)
  if (params.modality) parts.push(MODALITY_LABEL[params.modality] ?? params.modality)
  if (params.shift)    parts.push(SHIFT_LABEL[params.shift] ?? params.shift)
  if (params.degree)   parts.push(DEGREE_LABEL[params.degree] ?? params.degree)
  return parts.join(' · ')
}

export async function UniversityRichResults({ params }: { params: Params }) {
  const page = Number(params.page ?? '1')
  const query = new URLSearchParams()
  if (params.q)          query.set('q', params.q)
  if (params.city)       query.set('city', params.city)
  if (params.state)      query.set('state', params.state)
  if (params.type)       query.set('type', params.type)
  if (params.modality)   query.set('modality', params.modality)
  if (params.shift)      query.set('shift', params.shift)
  if (params.degree)     query.set('degree', params.degree)
  if (params.orgAcademica) query.set('orgAcademica', params.orgAcademica)
  query.set('limit', String(LIMIT))
  query.set('page', String(page))

  let results: any = { data: [], meta: { total: 0 } }
  try {
    results = await api.get(`/universities/search-rich?${query.toString()}`)
  } catch {
    return <div className="text-sm text-red-500 p-4">Erro ao carregar resultados.</div>
  }

  const totalPages = Math.ceil(results.meta.total / LIMIT)
  const hasCourseFilter = !!(params.q || params.modality || params.shift || params.degree)
  const contextLabel = buildContextLabel(params)

  const pageUrl = (p: number) => {
    const q = new URLSearchParams(query.toString())
    q.set('page', String(p))
    return `/busca?${q.toString()}`
  }

  if (results.data.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-4">
          <Search size={18} className="text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-700">Nenhuma instituição encontrada</p>
        <p className="text-xs text-slate-400 mt-1">
          {contextLabel ? `Sem resultados para "${contextLabel}"` : 'Tente outros filtros'}
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Count + context */}
      <p className="text-xs text-slate-400 mb-4 font-medium">
        <span className="text-slate-700 font-semibold">{results.meta.total.toLocaleString('pt-BR')}</span>
        {' '}instituição{results.meta.total !== 1 ? 'ões' : ''}
        {contextLabel && <> — <span className="text-slate-500">{contextLabel}</span></>}
      </p>

      <div className="space-y-3">
        {results.data.map((u: any) => {
          const typeStyle = TYPE_STYLE[u.type]
          const matched: any[] = u.matchedCourses ?? []

          // Deduplicate course names for display
          const courseNames = [...new Set(matched.map((c: any) => c.name))].slice(0, 4)
          // Deduplicate modalities
          const modalities = [...new Set(matched.map((c: any) => MODALITY_LABEL[c.modality]).filter(Boolean))]
          // Deduplicate shifts
          const shifts = [...new Set(matched.flatMap((c: any) => (c.shift || []).map((s: string) => SHIFT_LABEL[s])).filter(Boolean))]
          // Deduplicated degrees
          const degrees = [...new Set(matched.map((c: any) => DEGREE_LABEL[c.degree]).filter(Boolean))]

          return (
            <Link
              key={u.id}
              href={`/universidades/${u.slug}`}
              className="bg-white border border-slate-100 rounded-xl p-5 hover:border-blue-200 hover:shadow-hover transition-all group flex gap-4 items-start"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              {/* Logo */}
              <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {u.logoUrl
                  ? <img src={u.logoUrl} alt={u.name} className="w-full h-full object-contain p-1.5" />
                  : <span className="text-base font-bold text-slate-400">{(u.sigla || u.name).charAt(0)}</span>
                }
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">

                {/* Row 1: name + type badge */}
                <div className="flex items-start gap-2 justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-blue-700 transition-colors">
                      {u.name}
                    </h3>
                    {u.sigla && (
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{u.sigla}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                    {typeStyle && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide"
                        style={{ background: typeStyle.bg, color: typeStyle.color }}>
                        {typeStyle.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 2: city + stats */}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-xs text-slate-500 font-medium">{u.city}, {u.state}</span>
                  {u._count?.courses > 0 && (
                    <span className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-600">{u._count.courses}</span> cursos
                    </span>
                  )}
                  {u.igc && (
                    <span className="text-xs text-slate-400">
                      IGC <span className="font-semibold text-slate-600">{u.igc.toFixed(1)}</span>
                    </span>
                  )}
                </div>

                {/* Row 3: course match badges (only when filter active) */}
                {hasCourseFilter && matched.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {/* Course names */}
                    {courseNames.map(name => (
                      <span key={name}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                        style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                        <BookOpen size={10} />
                        {name}
                      </span>
                    ))}
                    {/* Modality badges */}
                    {modalities.map(m => (
                      <span key={m}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                        style={{ background: '#F0FDFA', color: '#0F766E' }}>
                        <Globe size={10} />
                        {m}
                      </span>
                    ))}
                    {/* Shift badges */}
                    {shifts.map(s => (
                      <span key={s}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                        style={{ background: '#FFFBEB', color: '#B45309' }}>
                        <Sun size={10} />
                        {s}
                      </span>
                    ))}
                    {/* Degree badges */}
                    {degrees.map(d => (
                      <span key={d}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                        style={{ background: '#FAF5FF', color: '#7C3AED' }}>
                        <GraduationCap size={10} />
                        {d}
                      </span>
                    ))}
                    {matched.length > courseNames.length && (
                      <span className="text-[11px] text-slate-400 px-1 py-1">
                        +{matched.length - courseNames.length} mais
                      </span>
                    )}
                  </div>
                )}
              </div>

              <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1" />
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
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
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
