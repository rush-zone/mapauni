import Link from 'next/link'
import { api } from '@/lib/api'

const LIMIT = 10

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
  try {
    results = await api.get(`/search?${query.toString()}`)
  } catch {
    return <div className="text-red-500">Erro ao carregar resultados.</div>
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
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">Nenhum curso encontrado.</p>
        <p className="text-sm mt-2">Tente outros filtros ou termos de busca.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">{results.meta.total} resultado(s) encontrado(s)</p>
      <div className="space-y-4">
        {results.data.map((course: any) => (
          <Link
            key={course.id}
            href={`/cursos/${course.slug}`}
            className="block bg-white border rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg">{course.name}</h3>
                <p className="text-blue-600 font-medium">{course.university.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {course.university.city}, {course.university.state} &bull; {course.modality} &bull; {course.degree}
                </p>
                <div className="flex gap-3 mt-2 flex-wrap">
                  {course.shift?.map((s: string) => (
                    <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{s}</span>
                  ))}
                  {course.enade && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">ENADE {course.enade}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                {course.priceMonthly ? (
                  <p className="text-lg font-bold text-gray-900">R$ {course.priceMonthly.toLocaleString('pt-BR')}/mês</p>
                ) : (
                  <p className="text-sm font-medium text-green-600">Gratuito</p>
                )}
                {course.offers?.[0]?.prouni && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full mt-1 inline-block">ProUni</span>
                )}
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
                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
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
