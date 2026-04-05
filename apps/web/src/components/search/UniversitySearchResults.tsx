import Link from 'next/link'
import { api } from '@/lib/api'
import { Search, ArrowRight } from 'lucide-react'

const LIMIT = 12

const TYPE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  FEDERAL:  { bg: '#EFF6FF', color: '#1D4ED8', label: 'Federal' },
  ESTADUAL: { bg: '#FAF5FF', color: '#7C3AED', label: 'Estadual' },
  MUNICIPAL:{ bg: '#F0FDF4', color: '#15803D', label: 'Municipal' },
  PRIVADA:  { bg: '#FFF7ED', color: '#C2410C', label: 'Privada' },
}

interface Props {
  params: Record<string, string | undefined>
}

export async function UniversitySearchResults({ params }: Props) {
  const page = Number(params.page ?? '1')
  const query = new URLSearchParams()
  if (params.q) query.set('q', params.q)
  if (params.state) query.set('state', params.state)
  if (params.type) query.set('type', params.type)
  if (params.city) query.set('city', params.city)
  if (params.orgAcademica) query.set('orgAcademica', params.orgAcademica)
  if (params.comCursos) query.set('comCursos', params.comCursos)
  query.set('limit', String(LIMIT))
  query.set('page', String(page))

  let results: any = { data: [], meta: { total: 0 } }
  try {
    results = await api.get(`/universities/search?${query.toString()}`)
  } catch {
    return <div className="text-sm text-red-500 p-4">Erro ao carregar resultados.</div>
  }

  const totalPages = Math.ceil(results.meta.total / LIMIT)

  const pageUrl = (p: number) => {
    const q = new URLSearchParams()
    q.set('modo', 'universidades')
    if (params.q) q.set('q', params.q)
    if (params.state) q.set('state', params.state)
    if (params.type) q.set('type', params.type)
    if (params.city) q.set('city', params.city)
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
        <p className="text-xs text-slate-400 mt-1">Tente outros filtros ou termos de busca</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs text-slate-400 mb-4 font-medium">
        <span className="text-slate-700 font-semibold">{results.meta.total.toLocaleString('pt-BR')}</span>
        {' '}instituição{results.meta.total !== 1 ? 'ões' : ''} encontrada{results.meta.total !== 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {results.data.map((u: any) => {
          const typeStyle = TYPE_STYLE[u.type]
          return (
            <Link key={u.id} href={`/universidades/${u.slug}`}
              className="bg-white border border-slate-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-hover transition-all group flex gap-3"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

              {/* Logo */}
              <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {u.logoUrl
                  ? <img src={u.logoUrl} alt={u.name} className="w-full h-full object-contain p-1.5" />
                  : <span className="text-sm font-bold text-slate-400">{(u.sigla || u.name).charAt(0)}</span>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <h3 className="font-semibold text-slate-900 text-sm leading-tight flex-1 min-w-0 truncate group-hover:text-blue-700 transition-colors">
                    {u.name}
                  </h3>
                  {typeStyle && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                      style={{ background: typeStyle.bg, color: typeStyle.color }}>
                      {typeStyle.label}
                    </span>
                  )}
                </div>
                {u.sigla && <p className="text-xs text-slate-400 mt-0.5 font-medium">{u.sigla}</p>}
                <p className="text-xs text-slate-500 mt-1">{u.city}, {u.state}</p>

                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-3 flex-1 flex-wrap">
                    {u._count?.courses > 0 && (
                      <span className="text-xs text-slate-400">
                        <span className="font-semibold text-slate-600">{u._count.courses}</span> cursos
                      </span>
                    )}
                    {u._count?.reviews > 0 && (
                      <span className="text-xs text-slate-400">
                        <span className="font-semibold text-slate-600">{u._count.reviews}</span> avaliações
                      </span>
                    )}
                    {u.igc && (
                      <span className="text-xs text-slate-400">
                        IGC <span className="font-semibold text-slate-600">{u.igc.toFixed(1)}</span>
                      </span>
                    )}
                  </div>
                  <ArrowRight size={12} className="text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
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
