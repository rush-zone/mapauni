import { Suspense } from 'react'
import { SearchResults } from '@/components/search/SearchResults'
import { SearchFilters } from '@/components/search/SearchFilters'
import { BuscaSearchBar } from '@/components/search/BuscaSearchBar'

interface SearchPageProps {
  searchParams: { q?: string; modality?: string; shift?: string; degree?: string; type?: string; area?: string; city?: string; state?: string; page?: string }
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="flex items-center px-6 py-4 border-b bg-white shadow-sm">
        <a href="/" className="text-xl font-bold text-blue-600 mr-8">MapaUni</a>
        <span className="text-gray-400">/ Busca</span>
      </nav>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <BuscaSearchBar initialQuery={searchParams.q ?? ''} />
        <div className="flex gap-8 mt-6">
          <aside className="w-64 shrink-0">
            <SearchFilters params={searchParams} />
          </aside>
          <div className="flex-1">
            <Suspense fallback={<div className="text-gray-400">Carregando...</div>}>
              <SearchResults params={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  )
}
