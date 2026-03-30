import Link from 'next/link'
import { api } from '@/lib/api'
import { LeadForm } from '@/components/lead/LeadForm'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const uni: any = await api.get(`/universities/${params.slug}`)
    return {
      title: `${uni.name} — MapaUni`,
      description: uni.description || `Conheça os cursos da ${uni.name}`,
    }
  } catch {
    return { title: 'Universidade — MapaUni' }
  }
}

export default async function UniversityPage({ params }: { params: { slug: string } }) {
  let uni: any
  try {
    uni = await api.get(`/universities/${params.slug}`)
  } catch {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    name: uni.name,
    url: uni.website,
    address: {
      '@type': 'PostalAddress',
      addressLocality: uni.city,
      addressRegion: uni.state,
      addressCountry: 'BR',
    },
    ...(uni._count?.reviews > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.0',
        reviewCount: uni._count.reviews,
      },
    } : {}),
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="flex items-center px-6 py-4 border-b bg-white shadow-sm">
        <Link href="/" className="text-xl font-bold text-blue-600 mr-4">MapaUni</Link>
        <span className="text-gray-400 mr-2">/ <Link href="/universidades" className="hover:text-blue-600">Universidades</Link></span>
        <span className="text-gray-400">/ {uni.name}</span>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-2xl">
                  {uni.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">{uni.name}</h1>
                  <p className="text-gray-500">{uni.city}, {uni.state} &bull; {uni.type}</p>
                  <div className="flex gap-2 mt-2">
                    {uni.igc && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">IGC {uni.igc}</span>}
                    {uni.ci && <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">CI {uni.ci}</span>}
                  </div>
                </div>
              </div>
              {uni.description && <p className="text-gray-600 mt-4">{uni.description}</p>}
              <div className="mt-4 flex gap-4 text-sm">
                {uni.website && <a href={uni.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Site oficial</a>}
                {uni.email && <a href={`mailto:${uni.email}`} className="text-blue-600 hover:underline">{uni.email}</a>}
              </div>
            </div>

            <div className="bg-white border rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Cursos oferecidos</h2>
              {uni.courses?.length === 0 ? (
                <p className="text-gray-400">Nenhum curso cadastrado.</p>
              ) : (
                <div className="space-y-3">
                  {uni.courses?.map((course: any) => (
                    <Link
                      key={course.id}
                      href={`/cursos/${course.slug}`}
                      className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-400 transition"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{course.name}</p>
                        <p className="text-sm text-gray-500">{course.modality} &bull; {course.degree} &bull; {course.duration} semestres</p>
                      </div>
                      {course.priceMonthly ? (
                        <p className="text-sm font-semibold text-gray-700">R$ {course.priceMonthly.toLocaleString('pt-BR')}/mês</p>
                      ) : (
                        <p className="text-sm font-medium text-green-600">Gratuito</p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white border rounded-xl p-6 sticky top-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Solicitar informações</h2>
              <LeadForm universityId={uni.id} universityName={uni.name} />
              {uni.phone && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium text-gray-900">{uni.phone}</p>
                </div>
              )}
              {uni.whatsapp && (
                <a
                  href={`https://wa.me/${uni.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
