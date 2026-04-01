import Link from 'next/link'
import { api } from '@/lib/api'

const LIMIT = 12

const TYPE_LABEL: Record<string, string> = {
  FEDERAL: 'Federal',
  ESTADUAL: 'Estadual',
  MUNICIPAL: 'Municipal',
  PRIVADA: 'Privada',
}

const TYPE_COLOR: Record<string, string> = {
  FEDERAL: 'bg-blue-100 text-blue-700',
  ESTADUAL: 'bg-purple-100 text-purple-700',
  MUNICIPAL: 'bg-green-100 text-green-700',
  PRIVADA: 'bg-orange-100 text-orange-700',
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
  query.set('limit', String(LIMIT))
  query.set('page', String(page))

  let results: any = { data: [], meta: { total: 0 } }
  try {
    results = await api.get(`/universities/search?${query.toString()}`)
  } catch {
    return <div className="text-red-500">Erro ao carregar resultados.</div>
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
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">Nenhuma universidade encontrada.</p>
        <p className="text-sm mt-2">Tente outros filtros ou termos de busca.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">{results.meta.total.toLocaleString('pt-BR')} instituição(ões) encontrada(s)</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.data.map((u: any) => (
          <Link
            key={u.id}
            href={`/universidades/${u.slug}`}
            className="bg-white border rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition flex gap-4"
          >
            {u.logoUrl ? (
              <img src={u.logoUrl} alt={u.name} className="w-14 h-14 object-contain rounded-lg shrink-0 border" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-400 font-bold text-lg">
                {(u.sigla || u.name).charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 leading-tight">{u.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${TYPE_COLOR[u.type] || 'bg-gray-100 text-gray-600'}`}>
                  {TYPE_LABEL[u.type] || u.type}
                </span>
              </div>
              {u.sigla && <p className="text-xs text-gray-400 mt-0.5">{u.sigla}</p>}
              <p className="text-sm text-gray-500 mt-1">{u.city}, {u.state}</p>
              <div className="flex gap-3 mt-2 text-xs text-gray-400">
                {u._count.courses > 0 && <span>{u._count.courses} curso(s)</span>}
                {u._count.reviews > 0 && <span>{u._count.reviews} avaliação(ões)</span>}
                {u.igc && <span>IGC {u.igc.toFixed(1)}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <Link href={pageUrl(page - 1)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              ← Anterior
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
                <span key={`e-${idx}`} className="px-2 text-gray-400">…</span>
              ) : (
                <Link
                  key={p}
                  href={pageUrl(p as number)}
                  className={`px-4 py-2 border rounded-lg text-sm ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {p}
                </Link>
              )
            )}
          {page < totalPages && (
            <Link href={pageUrl(page + 1)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Próxima →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
