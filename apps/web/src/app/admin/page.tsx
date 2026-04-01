'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Stats {
  universities: number
  active: number
  leads: number
  reviews: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Falha ao carregar stats')
        return r.json()
      })
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const cards = stats
    ? [
        { label: 'Total de IES', value: stats.universities.toLocaleString('pt-BR') },
        { label: 'IES Ativas', value: stats.active.toLocaleString('pt-BR') },
        { label: 'Leads captados', value: stats.leads.toLocaleString('pt-BR') },
        { label: 'Avaliações', value: stats.reviews.toLocaleString('pt-BR') },
      ]
    : []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral da plataforma InfoUni</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/importar"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6 shadow-sm transition-colors"
        >
          <p className="text-lg font-semibold mb-1">Importar CSV MEC/INEP</p>
          <p className="text-blue-100 text-sm">
            Importe a lista oficial de Instituições de Ensino Superior do e-MEC
          </p>
        </Link>

        <Link
          href="/admin/universidades"
          className="bg-white hover:bg-gray-50 text-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 transition-colors"
        >
          <p className="text-lg font-semibold mb-1">Gerenciar Universidades</p>
          <p className="text-gray-500 text-sm">
            Visualize, filtre e gerencie todas as IES cadastradas
          </p>
        </Link>
      </div>
    </div>
  )
}
