'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUpload } from '@/components/ImageUpload'
import { GalleryUpload } from '@/components/GalleryUpload'
import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import { MiniMap } from '@/components/MiniMap'

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
    galleryImages: university?.galleryImages ?? [] as string[],
    lat: university?.lat ?? null as number | null,
    lng: university?.lng ?? null as number | null,
  })
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

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
      galleryImages: form.galleryImages.slice(0, 6),
      lat: form.lat || undefined,
      lng: form.lng || undefined,
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
        router.refresh() // recarrega os dados do Server Component
      }
    } catch {
      setError('Erro de conexão.')
    } finally {
      setSaving(false)
    }
  }

  if (!university) {
    return <p className="text-gray-400 text-sm">Universidade não encontrada.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">

      {/* Status */}
      <div className="flex items-center gap-4">
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
          university.plan === 'PRO' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
        }`}>Plano {university.plan}</span>
        <a href={`/universidades/${university.slug}`} target="_blank" rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline">
          Ver perfil público →
        </a>
      </div>

      {/* Imagens */}
      <section className="bg-white border rounded-2xl p-6 space-y-6">
        <h2 className="text-base font-semibold text-gray-900">Imagens</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ImageUpload
            label="Logo / Foto de perfil"
            hint="400×400px · quadrado · JPG, PNG ou WebP · máx. 10MB"
            value={form.logoUrl}
            onChange={(url) => set('logoUrl', url)}
            token={token}
            previewShape="square"
          />
          <ImageUpload
            label="Foto de capa"
            hint="1200×300px · banner · JPG, PNG ou WebP · máx. 10MB"
            value={form.coverUrl}
            onChange={(url) => set('coverUrl', url)}
            token={token}
            previewShape="wide"
          />
        </div>
        <GalleryUpload
          value={form.galleryImages}
          onChange={(urls) => setForm(prev => ({ ...prev, galleryImages: urls }))}
          token={token}
          max={6}
        />
      </section>

      {/* Informações gerais */}
      <section className="bg-white border rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Informações gerais</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ano de fundação</label>
          <input type="number" min={1800} max={2100} placeholder="Ex: 1972"
            value={form.foundedYear} onChange={e => set('foundedYear', e.target.value)}
            className="w-40 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea rows={4} placeholder="Conte sobre a história e diferenciais da instituição..."
            value={form.description} onChange={e => set('description', e.target.value)}
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <AddressAutocomplete
              value={form.address}
              onChange={(address, lat, lng) =>
                setForm(prev => ({ ...prev, address, lat: lat ?? prev.lat, lng: lng ?? prev.lng }))
              }
            />
            <MiniMap address={form.address} lat={form.lat} lng={form.lng} />
          </div>
        </div>
      </section>

      {/* Contato */}
      <section className="bg-white border rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Contato</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input type="text" placeholder="(11) 3333-0000" value={form.phone}
              onChange={e => set('phone', e.target.value)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <input type="text" placeholder="(11) 99999-0000" value={form.whatsapp}
              onChange={e => set('whatsapp', e.target.value)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Site oficial</label>
            <input type="url" placeholder="https://www.minhauni.edu.br" value={form.website}
              onChange={e => set('website', e.target.value)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
          </div>
        </div>
      </section>

      {/* Redes sociais */}
      <section className="bg-white border rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Redes sociais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { field: 'instagram', label: 'Instagram', type: 'text', placeholder: '@minhauni' },
            { field: 'facebook', label: 'Facebook', type: 'url', placeholder: 'https://facebook.com/minhauni' },
            { field: 'linkedin', label: 'LinkedIn', type: 'url', placeholder: 'https://linkedin.com/school/minhauni' },
            { field: 'youtube', label: 'YouTube', type: 'url', placeholder: 'https://youtube.com/@minhauni' },
          ].map(({ field, label, type, placeholder }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type={type} placeholder={placeholder} value={(form as any)[field]}
                onChange={e => set(field, e.target.value)}
                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          ))}
        </div>
      </section>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600">Perfil salvo com sucesso!</p>}

      <button type="submit" disabled={saving}
        className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition">
        {saving ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </form>
  )
}
