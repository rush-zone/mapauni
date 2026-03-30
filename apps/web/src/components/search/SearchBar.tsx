'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    router.push(`/busca?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar curso ou universidade..."
        className="flex-1 px-5 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
      />
      <button
        type="submit"
        className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition"
      >
        Buscar
      </button>
    </form>
  )
}
