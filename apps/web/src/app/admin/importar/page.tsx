'use client'

import { useRef, useState } from 'react'

interface ImportResult {
  message: string
  total: number
  created: number
  updated: number
  skipped: number
  errors: string[]
  detectedColumns: string[]
}

export default function ImportarPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null
    setFile(f)
    setResult(null)
    setError('')
  }

  async function handleImport() {
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const token = localStorage.getItem('admin_token')
      const form = new FormData()
      form.append('file', file)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/import/universities`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Erro na importação')
        return
      }

      setResult(data)
    } catch {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Importar CSV MEC/INEP</h1>
        <p className="text-gray-500 text-sm mt-1">
          Importe a lista oficial de IES do e-MEC (
          <a
            href="https://emec.mec.gov.br/emec/nova"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            PDA_Lista_Instituicoes_Ensino_Superior_do_Brasil_EMEC.csv
          </a>
          )
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Selecionar arquivo</h2>

        <div
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            file
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          {file ? (
            <div>
              <p className="font-medium text-blue-700">{file.name}</p>
              <p className="text-sm text-blue-500 mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB — clique para trocar
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-500">Arraste ou clique para selecionar o CSV</p>
              <p className="text-xs text-gray-400 mt-1">Somente arquivos .csv (até 50 MB)</p>
            </div>
          )}
        </div>

        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <strong>Atenção:</strong> O arquivo deve ser o CSV oficial do e-MEC com separador{' '}
          <code className="bg-amber-100 px-1 rounded">;</code>. O processo pode levar alguns
          minutos dependendo do número de registros.
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={!file || loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-3 text-sm transition-colors mb-6"
      >
        {loading ? 'Importando... aguarde' : 'Iniciar importação'}
      </button>

      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-blue-700 font-medium">Processando registros...</p>
          <p className="text-blue-500 text-sm mt-1">Isso pode levar alguns minutos</p>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Resultado da importação</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total lidos', value: result.total, color: 'text-gray-900' },
              { label: 'Criados', value: result.created, color: 'text-green-600' },
              { label: 'Atualizados', value: result.updated, color: 'text-blue-600' },
              { label: 'Ignorados', value: result.skipped, color: 'text-amber-600' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>

          {result.errors.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-700 mb-2">
                {result.errors.length} erro(s) encontrado(s):
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-700 font-mono leading-5">
                    {e}
                  </p>
                ))}
              </div>
            </div>
          )}

          {result.errors.length === 0 && (
            <p className="text-sm text-green-600 font-medium">Importação concluída sem erros.</p>
          )}

          {result.detectedColumns?.length > 0 && (
            <details className="mt-4">
              <summary className="text-xs text-gray-400 cursor-pointer">Colunas detectadas no CSV ({result.detectedColumns.length})</summary>
              <p className="text-xs text-gray-500 mt-1 font-mono break-all">{result.detectedColumns.join(' | ')}</p>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
