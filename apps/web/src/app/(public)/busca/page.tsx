import { Suspense } from 'react'
import { SearchResults } from '@/components/search/SearchResults'
import { UniversitySearchResults } from '@/components/search/UniversitySearchResults'
import { SearchFilters } from '@/components/search/SearchFilters'
import { BuscaSearchBar } from '@/components/search/BuscaSearchBar'

interface SearchPageProps {
  searchParams: {
    modo?: string
    q?: string
    modality?: string
    shift?: string
    degree?: string
    type?: string
    area?: string
    city?: string
    state?: string
    page?: string
  }
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const modo = searchParams.modo === 'universidades' ? 'universidades' : 'cursos'

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="flex items-center px-6 py-4 border-b bg-white shadow-sm">
        <a href="/" className="text-xl font-bold text-blue-600 mr-8">InfoUni</a>
        <span className="text-gray-400">/ Busca</span>
      </nav>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <BuscaSearchBar
          initialModo={modo}
          initialQuery={searchParams.q ?? ''}
          initialCity={searchParams.city}
        />
        <div className="flex gap-8 mt-6">
          <aside className="w-64 shrink-0">
            <SearchFilters params={searchParams} modo={modo} />
          </aside>
          <div className="flex-1">
            <Suspense fallback={<div className="text-gray-400 py-8 text-center">Carregando...</div>}>
              {modo === 'universidades' ? (
                <UniversitySearchResults params={searchParams} />
              ) : (
                <SearchResults params={searchParams} />
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  )
}
