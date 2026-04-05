'use client'

import { useRef, useState } from 'react'

interface ImageUploadProps {
  label: string
  hint: string
  value: string
  onChange: (url: string) => void
  token: string
  previewClass?: string
  previewShape?: 'square' | 'wide'
}

export function ImageUpload({ label, hint, value, onChange, token, previewShape = 'square' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file: File) {
    setError('')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Use JPG, PNG ou WebP.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Máximo 10MB.')
      return
    }

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Erro no upload'); return }
      onChange(data.url)
    } catch {
      setError('Erro ao enviar. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function handleRemove() {
    onChange('')
    setError('')
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <p className="text-xs text-gray-400 mb-2">{hint}</p>

      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt={label}
            className={`object-cover rounded-xl border border-gray-200 ${
              previewShape === 'wide' ? 'w-full h-28' : 'w-24 h-24'
            }`}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 shadow"
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
            uploading
              ? 'border-blue-300 bg-blue-50 cursor-wait'
              : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
          } ${previewShape === 'wide' ? 'h-28 w-full' : 'h-24 w-24'}`}
        >
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleChange} className="hidden" />
          {uploading ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-gray-400 text-center px-1">Clique ou arraste</span>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
