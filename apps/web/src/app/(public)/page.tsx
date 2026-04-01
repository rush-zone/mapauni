import Link from 'next/link'
import { SearchBar } from '@/components/search/SearchBar'
import { api } from '@/lib/api'

const AREAS = [
  { label: 'Saúde', emoji: '🏥' },
  { label: 'Exatas', emoji: '📐' },
  { label: 'Humanas', emoji: '📚' },
  { label: 'Tecnologia', emoji: '💻' },
  { label: 'Direito', emoji: '⚖️' },
  { label: 'Negócios', emoji: '📊' },
  { label: 'Educação', emoji: '🎓' },
  { label: 'Artes e Design', emoji: '🎨' },
]

const UF_DESTAQUE = ['SP', 'RJ', 'MG', 'RS', 'PR', 'BA', 'CE', 'PE']

async function getStats() {
  try {
    const data = await api.get<{ universities: number; active: number; leads: number; reviews: number }>(
      '/admin/stats'
    )
    return data
  } catch {
    return null
  }
}

export default async function HomePage() {
  const stats = await getStats()

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b bg-white shadow-sm">
        <Link href="/" className="text-2xl font-bold text-blue-600">InfoUni</Link>
        <div className="flex items-center gap-4">
          <Link href="/busca?modo=universidades" className="text-sm text-gray-600 hover:text-blue-600 transition">
            Universidades
          </Link>
          <Link href="/busca?modo=cursos" className="text-sm text-gray-600 hover:text-blue-600 transition">
            Cursos
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            Área da Universidade
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Encontre a universidade ideal para você
        </h1>
        <p className="text-xl text-gray-500 mb-10">
          Compare {stats ? stats.active.toLocaleString('pt-BR') : 'milhares de'} instituições de ensino superior em todo o Brasil
        </p>
        <SearchBar />
      </section>

      {/* Stats */}
      {stats && (
        <section className="max-w-4xl mx-auto px-6 pb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Instituições cadastradas', value: stats.universities.toLocaleString('pt-BR') },
              { label: 'IES ativas', value: stats.active.toLocaleString('pt-BR') },
              { label: 'Leads captados', value: stats.leads.toLocaleString('pt-BR') },
              { label: 'Avaliações', value: stats.reviews.toLocaleString('pt-BR') },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border p-5 text-center shadow-sm">
                <p className="text-2xl font-bold text-blue-600">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Áreas */}
      <section className="max-w-6xl mx-auto px-6 py-12 border-t">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Buscar por área</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {AREAS.map(({ label, emoji }) => (
            <Link
              key={label}
              href={`/busca?modo=cursos&area=${encodeURIComponent(label)}`}
              className="p-4 bg-white border rounded-xl text-center font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 transition shadow-sm"
            >
              <span className="block text-2xl mb-1">{emoji}</span>
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* Estados */}
      <section className="max-w-6xl mx-auto px-6 py-12 border-t">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Universidades por estado</h2>
        <div className="flex flex-wrap gap-3">
          {UF_DESTAQUE.map((uf) => (
            <Link
              key={uf}
              href={`/busca?modo=universidades&state=${uf}`}
              className="px-5 py-2.5 bg-white border rounded-full text-sm font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-600 transition shadow-sm"
            >
              {uf}
            </Link>
          ))}
          <Link
            href="/busca?modo=universidades"
            className="px-5 py-2.5 bg-blue-50 border border-blue-200 rounded-full text-sm font-semibold text-blue-600 hover:bg-blue-100 transition"
          >
            Ver todos →
          </Link>
        </div>
      </section>
    </main>
  )
}
