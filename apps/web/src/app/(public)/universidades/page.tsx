import Link from 'next/link'
import { api } from '@/lib/api'

export default async function UniversidadesPage() {
  let result: any = { data: [] }
  try {
    result = await api.get('/universities?limit=50')
  } catch {}

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="flex items-center px-6 py-4 border-b bg-white shadow-sm">
        <Link href="/" className="text-xl font-bold text-blue-600 mr-8">MapaUni</Link>
        <span className="text-gray-400">/ Universidades</span>
      </nav>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Universidades</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {result.data.map((uni: any) => (
            <Link
              key={uni.id}
              href={`/universidades/${uni.slug}`}
              className="bg-white border rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-lg">
                  {uni.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 leading-tight">{uni.name}</h3>
                  <p className="text-sm text-gray-500">{uni.city}, {uni.state}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{uni.type}</span>
                {uni.igc && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">IGC {uni.igc}</span>}
                <span className="text-xs text-gray-400">{uni._count?.courses} cursos</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
