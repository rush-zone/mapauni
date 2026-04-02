'use client'

import { useRef, useState } from 'react'

interface ImportResult {
  message: string
  total: number
  created: number
  updated: number
  skipped: number
  parseErrors: number
  errors: string[]
  detectedColumns: string[]
}

interface FileStatus {
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  result?: ImportResult
  error?: string
}

export default function ImportarCursosPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<FileStatus[]>([])
  const [running, setRunning] = useState(false)
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    setFiles(selected.map((f) => ({ file: f, status: 'pending' })))
    if (fileRef.current) fileRef.current.value = ''
  }

  const totals = files.reduce(
    (acc, f) => {
      if (f.result) {
        acc.total += f.result.total
        acc.created += f.result.created
        acc.updated += f.result.updated
        acc.skipped += f.result.skipped
      }
      return acc
    },
    { total: 0, created: 0, updated: 0, skipped: 0 },
  )

  const allErrors = files.flatMap((f) => f.result?.errors ?? [])
  const doneCount = files.filter((f) => f.status === 'done').length
  const errorCount = files.filter((f) => f.status === 'error').length

  async function handleImport() {
    if (files.length === 0) return
    setRunning(true)

    const token = localStorage.getItem('admin_token')

    for (let i = 0; i < files.length; i++) {
      const entry = files[i]
      if (entry.status === 'done') continue

      setCurrentIndex(i)
      setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' } : f)))

      try {
        const form = new FormData()
        form.append('file', entry.file)

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/import/courses`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        })

        const data = await res.json()

        if (!res.ok) {
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, status: 'error', error: data.message || 'Erro na importação' } : f,
            ),
          )
        } else {
          setFiles((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, status: 'done', result: data } : f)),
          )
        }
      } catch {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: 'error', error: 'Erro ao conectar com o servidor' } : f,
          ),
        )
      }
    }

    setCurrentIndex(null)
    setRunning(false)
  }

  const statusIcon = (s: FileStatus['status']) => {
    if (s === 'pending') return <span className="text-gray-400">⏳</span>
    if (s === 'uploading') return <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    if (s === 'done') return <span className="text-green-500">✓</span>
    return <span className="text-red-500">✗</span>
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Importar Cursos e-MEC</h1>
        <p className="text-gray-500 text-sm mt-1">
          Selecione um ou mais arquivos CSV. Eles serão processados em sequência automaticamente.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
        <p className="font-semibold mb-1">Como obter os arquivos</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-700">
          <li>Acesse <strong>dados.gov.br</strong> e busque por <strong>"Cursos de Graduação e-MEC"</strong></li>
          <li>Baixe o CSV mais recente e divida em partes se necessário</li>
          <li>Certifique-se de importar as IES primeiro</li>
        </ol>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Selecionar arquivos</h2>
        <div
          onClick={() => !running && fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            running
              ? 'opacity-50 cursor-not-allowed border-gray-200'
              : 'cursor-pointer border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <input ref={fileRef} type="file" accept=".csv" multiple onChange={handleFileChange} className="hidden" />
          {files.length > 0 ? (
            <div>
              <p className="font-medium text-blue-700">{files.length} arquivo(s) selecionado(s)</p>
              <p className="text-sm text-blue-500 mt-1">
                {(files.reduce((a, f) => a + f.file.size, 0) / 1024 / 1024).toFixed(1)} MB total — clique para trocar
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-500">Arraste ou clique para selecionar os CSVs</p>
              <p className="text-xs text-gray-400 mt-1">Múltiplos arquivos permitidos</p>
            </div>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3 text-sm">Arquivos ({files.length})</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm py-1.5 border-b border-gray-100 last:border-0">
                <div className="w-5 flex justify-center flex-shrink-0">{statusIcon(f.status)}</div>
                <span className="flex-1 truncate text-gray-700">{f.file.name}</span>
                <span className="text-gray-400 text-xs flex-shrink-0">{(f.file.size / 1024 / 1024).toFixed(1)} MB</span>
                {f.result && (
                  <span className="text-xs text-green-600 flex-shrink-0">
                    +{f.result.created.toLocaleString('pt-BR')} criados
                  </span>
                )}
                {f.error && <span className="text-xs text-red-500 flex-shrink-0">{f.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={files.length === 0 || running}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-3 text-sm transition-colors mb-6"
      >
        {running
          ? `Importando arquivo ${(currentIndex ?? 0) + 1} de ${files.length}...`
          : `Importar ${files.length > 0 ? files.length + ' arquivo(s)' : ''}`}
      </button>

      {running && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center mb-6">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-blue-700 font-medium">
            Processando {currentIndex !== null ? files[currentIndex]?.file.name : ''}...
          </p>
          <p className="text-blue-500 text-sm mt-1">
            {doneCount} de {files.length} concluídos
          </p>
        </div>
      )}

      {doneCount > 0 && !running && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Resultado final
            {errorCount > 0 && <span className="ml-2 text-sm text-red-500">({errorCount} arquivo(s) com erro)</span>}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total lidos', value: totals.total, color: 'text-gray-900' },
              { label: 'Criados', value: totals.created, color: 'text-green-600' },
              { label: 'Atualizados', value: totals.updated, color: 'text-blue-600' },
              { label: 'Ignorados', value: totals.skipped, color: 'text-amber-600' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className={`text-2xl font-bold ${item.color}`}>{item.value.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>

          {allErrors.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-700 mb-2">{allErrors.length} erro(s):</p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                {allErrors.map((e, i) => (
                  <p key={i} className="text-xs text-red-700 font-mono leading-5">{e}</p>
                ))}
              </div>
            </div>
          )}

          {allErrors.length === 0 && (
            <p className="text-sm text-green-600 font-medium">Todas as importações concluídas sem erros.</p>
          )}
        </div>
      )}
    </div>
  )
}
