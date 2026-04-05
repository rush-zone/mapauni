'use client'

import { useRef, useState } from 'react'

interface GalleryUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  token: string
  max?: number
}

export function GalleryUpload({ value, onChange, token, max = 6 }: GalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFiles(files: FileList) {
    setError('')
    const remaining = max - value.length
    if (remaining <= 0) { setError(`Máximo ${max} fotos atingido.`); return }

    const toUpload = Array.from(files).slice(0, remaining)
    setUploading(true)

    const uploaded: string[] = []
    const errors: string[] = []

    for (const file of toUpload) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        errors.push(`${file.name}: formato inválido`)
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: maior que 10MB`)
        continue
      }
      try {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        })
        const data = await res.json()
        if (res.ok && data.url) uploaded.push(data.url)
        else errors.push(`${file.name}: ${data.message || 'erro no upload'}`)
      } catch {
        errors.push(`${file.name}: erro de conexão`)
      }
    }

    if (errors.length) setError(errors.join(' · '))
    onChange([...value, ...uploaded])
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">Galeria de fotos</label>
        <span className="text-xs text-gray-400">{value.length}/{max} · JPG, PNG ou WebP · máx. 10MB cada</span>
      </div>
      <p className="text-xs text-gray-400 mb-3">Tamanho recomendado: <strong>1280×720px</strong> (proporção 16:9). Serão exibidas no perfil público.</p>

      <div className="grid grid-cols-3 gap-3">
        {value.map((url, i) => (
          <div key={i} className="relative group aspect-video">
            <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover rounded-xl border border-gray-200" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs items-center justify-center hidden group-hover:flex hover:bg-red-600 shadow"
            >
              ✕
            </button>
          </div>
        ))}

        {value.length < max && (
          <button
            type="button"
            onClick={() => !uploading && inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
            className={`aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1 transition-colors ${
              uploading ? 'border-blue-300 bg-blue-50 cursor-wait' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
            />
            {uploading ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs text-gray-400">Adicionar</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
