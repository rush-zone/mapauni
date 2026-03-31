'use client'
import { useState } from 'react'

interface PerfilClientProps {
  university: any
  token: string
}

export function PerfilClient({ university, token }: PerfilClientProps) {
  const [form, setForm] = useState({
    description: university?.description ?? '',
    phone: university?.phone ?? '',
    whatsapp: university?.whatsapp ?? '',
    website: university?.website ?? '',
    address: university?.address ?? '',
    foundedYear: university?.foundedYear ?? '',
    logoUrl: university?.logoUrl ?? '',
    coverUrl: university?.coverUrl ?? '',
    instagram: university?.instagram ?? '',
    facebook: university?.facebook ?? '',
    linkedin: university?.linkedin ?? '',
    youtube: university?.youtube ?? '',
    galleryImages: (university?.galleryImages ?? []).join('\n'),
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const galleryImages = form.galleryImages
      .split('\n')
      .map((u: string) => u.trim())
      .filter((u: string) => u.startsWith('http'))
      .slice(0, 6)

    const payload: any = {
      description: form.description || undefined,
      phone: form.phone || undefined,
      whatsapp: form.whatsapp || undefined,
      website: form.website || undefined,
      address: form.address || undefined,
      logoUrl: form.logoUrl || undefined,
      coverUrl: form.coverUrl || undefined,
      instagram: form.instagram || undefined,
      facebook: form.facebook || undefined,
      linkedin: form.linkedin || undefined,
      youtube: form.youtube || undefined,
      galleryImages,
    }
    if (form.foundedYear) payload.foundedYear = Number(form.foundedYear)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/universities/${university.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erro ao salvar.')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  if (!university) {
    return <p className="text-gray-400">Erro ao carregar perfil.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">

      {/* Status */}
      <div className="flex items-center gap-4">
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
          university.plan === 'PRO' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
        }`}>Plano {university.plan}</span>
        <a
          href={`/universidades/${university.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          Ver perfil público →
        </a>
      </div>

      {/* Imagens */}
      <section className="bg-white border rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Imagens</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL da foto de perfil (logo)</label>
            <input
              type="url"
              placeholder="https://..."
              value={form.logoUrl}
              onChange={e => set('logoUrl', e.target.value)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
            {form.logoUrl && (
              <img src={form.logoUrl} alt="Logo preview" className="mt-2 w-16 h-16 object-contain rounded-lg border" />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL da foto de capa</label>
            <input
              type="url"
              placeholder="https://..."
              value={form.coverUrl}
              onChange={e => set('coverUrl', e.target.value)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
            {form.coverUrl && (
              <img src={form.coverUrl} alt="Capa preview" className="mt-2 w-full h-20 object-cover rounded-lg border" />
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Galeria de fotos <span className="text-gray-400 font-normal">(máx. 6 — uma URL por linha)</span>
          </label>
          <textarea
            rows={6}
            placeholder={"https://exemplo.com/foto1.jpg\nhttps://exemplo.com/foto2.jpg"}
            value={form.galleryImages}
            onChange={e => set('galleryImages', e.target.value)}
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">
            {form.galleryImages.split('\n').filter((u: string) => u.trim().startsWith('http')).length}/6 fotos
          </p>
        </div>
      </section>

      {/* Informações gerais */}
      <section className="bg-white border rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Informações gerais</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ano de fundação</label>
          <input
            type="number"
            min={1800}
            max={2100}
            placeholder="Ex: 1972"
            value={form.foundedYear}
            onChange={e => set('foundedYear', e.target.value)}
            className="w-40 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea
            rows={4}
            placeholder="Conte sobre a história e diferenciais da instituição..."
            value={form.description}
            onChange={e => set('description', e.target.value)}
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
          <input
            type="text"
            placeholder="Rua, número, bairro, cidade"
            value={form.address}
            onChange={e => set('address', e.target.value)}
            className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </section>

      {/* Contato */}
      <section className="bg-white border rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Contato</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              type="text"
              placeholder="(11) 3333-0000"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <input
              type="text"
              placeholder="(11) 99999-0000"
              value={form.whatsapp}
              onChange={e => set('whatsapp', e.target.value)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Site oficial</label>
            <input
              type="url"
              placeholder="https://www.minhauni.edu.br"
              value={form.website}
              onChange={e => set('website', e.target.value)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Redes sociais */}
      <section className="bg-white border rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Redes sociais</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
            <input
              type="text"
              placeholder="@minhauni"
              value={form.instagram}
              onChange={e => set('instagram', e.target.value)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook (URL)</label>
            <input
              type="url"
              placeholder="https://facebook.com/minhauni"
              value={form.facebook}
              onChange={e => set('facebook', e.target.value)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn (URL)</label>
            <input
              type="url"
              placeholder="https://linkedin.com/school/minhauni"
              value={form.linkedin}
              onChange={e => set('linkedin', e.target.value)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">YouTube (URL)</label>
            <input
              type="url"
              placeholder="https://youtube.com/@minhauni"
              value={form.youtube}
              onChange={e => set('youtube', e.target.value)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600">Perfil salvo com sucesso!</p>}

      <button
        type="submit"
        disabled={loading}
        className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {loading ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </form>
  )
}
