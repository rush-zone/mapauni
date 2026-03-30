import Link from 'next/link'
import { SearchBar } from '@/components/search/SearchBar'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b bg-white shadow-sm">
        <Link href="/" className="text-2xl font-bold text-blue-600">MapaUni</Link>
        <div className="flex gap-4">
          <Link href="/universidades" className="text-gray-600 hover:text-blue-600 transition">Universidades</Link>
          <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
            Área da Universidade
          </Link>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Encontre o curso ideal para você
        </h1>
        <p className="text-xl text-gray-500 mb-10">
          Compare universidades, cursos e vagas em todo o Brasil
        </p>
        <SearchBar />
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Áreas populares</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Saúde', 'Exatas', 'Humanas', 'Tecnologia', 'Direito', 'Artes e Design', 'Negócios', 'Educação'].map((area) => (
            <Link
              key={area}
              href={`/busca?area=${encodeURIComponent(area)}`}
              className="p-4 bg-white border rounded-xl text-center font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 transition shadow-sm"
            >
              {area}
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
