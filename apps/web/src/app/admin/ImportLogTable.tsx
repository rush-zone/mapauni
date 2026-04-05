'use client'

import { useEffect, useState } from 'react'

interface ImportLog {
  id: string
  type: string
  fileName: string | null
  created: number
  updated: number
  skipped: number
  total: number
  createdAt: string
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1'

export function ImportLogTable({ type }: { type: 'universities' | 'courses' }) {
  const [logs, setLogs] = useState<ImportLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    fetch(`${API}/admin/import-logs`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const filtered = Array.isArray(data) ? data.filter((l: ImportLog) => l.type === type) : []
        setLogs(filtered)
      })
      .finally(() => setLoading(false))
  }, [type])

  if (loading) return <p className="text-sm text-gray-400 mt-6">Carregando histórico...</p>
  if (logs.length === 0) return <p className="text-sm text-gray-400 mt-6">Nenhuma importação registrada ainda.</p>

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Histórico de importações</h3>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Data</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Arquivo</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">Total</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-green-600">Criados</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-blue-600">Atualizados</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-400">Ignorados</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="px-4 py-2.5 text-gray-500 max-w-xs truncate">
                  {log.fileName || <span className="italic text-gray-300">—</span>}
                </td>
                <td className="px-4 py-2.5 text-right text-gray-700 font-medium">
                  {log.total.toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-2.5 text-right text-green-700 font-semibold">
                  +{log.created.toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-2.5 text-right text-blue-700">
                  ~{log.updated.toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-2.5 text-right text-gray-400">
                  {log.skipped.toLocaleString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
