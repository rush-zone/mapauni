import Link from 'next/link'
import { api } from '@/lib/api'
import { LeadForm } from '@/components/lead/LeadForm'
import { UniversityGallery } from './UniversityGallery'
import { ReviewForm } from './ReviewForm'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const uni: any = await api.get(`/universities/${params.slug}`)
    return {
      title: `${uni.name} — MapaUni`,
      description: uni.description || `Conheça os cursos da ${uni.name} em ${uni.city}, ${uni.state}.`,
    }
  } catch {
    return { title: 'Universidade — MapaUni' }
  }
}

const TYPE_LABEL: Record<string, string> = {
  FEDERAL: 'Federal', ESTADUAL: 'Estadual', MUNICIPAL: 'Municipal', PRIVADA: 'Privada',
}

export default async function UniversityPage({ params }: { params: { slug: string } }) {
  let uni: any
  try {
    uni = await api.get(`/universities/${params.slug}`)
  } catch {
    notFound()
  }

  const approvedReviews = (uni.reviews ?? []).filter((r: any) => r.status !== 'REJECTED')
  const avgRating = approvedReviews.length
    ? (approvedReviews.reduce((acc: number, r: any) => acc + r.rating, 0) / approvedReviews.length).toFixed(1)
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    name: uni.name,
    url: uni.website,
    foundingDate: uni.foundedYear,
    address: {
      '@type': 'PostalAddress',
      addressLocality: uni.city,
      addressRegion: uni.state,
      addressCountry: 'BR',
    },
    ...(avgRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating,
        reviewCount: approvedReviews.length,
      },
    }),
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <nav className="flex items-center px-6 py-4 border-b bg-white shadow-sm">
        <Link href="/" className="text-xl font-bold text-blue-600 mr-4">MapaUni</Link>
        <span className="text-gray-400">/ <Link href="/busca" className="hover:text-blue-600">Busca</Link></span>
        <span className="text-gray-400 ml-2">/ {uni.name}</span>
      </nav>

      {/* Cover + Profile header */}
      <div className="bg-white border-b">
        {uni.coverUrl && (
          <div className="h-48 overflow-hidden">
            <img src={uni.coverUrl} alt="Capa" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
              {uni.logoUrl
                ? <img src={uni.logoUrl} alt={uni.name} className="w-full h-full object-contain p-2" />
                : <span className="text-2xl font-bold text-blue-600">{uni.name[0]}</span>
              }
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{uni.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {TYPE_LABEL[uni.type]}
                {uni.category ? ` • ${uni.category}` : ''}
                {` • ${uni.city}, ${uni.state}`}
                {uni.foundedYear ? ` • Fundada em ${uni.foundedYear}` : ''}
              </p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {uni.igc && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">IGC {uni.igc}</span>}
                {uni.ci && <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">CI {uni.ci}</span>}
                {avgRating && (
                  <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full">
                    ★ {avgRating} ({approvedReviews.length} avaliações)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-8 pb-16">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Gallery */}
            {uni.galleryImages?.length > 0 && (
              <div className="bg-white border rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Galeria</h2>
                <UniversityGallery images={uni.galleryImages} />
              </div>
            )}

            {/* About */}
            {uni.description && (
              <div className="bg-white border rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Sobre a instituição</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{uni.description}</p>
              </div>
            )}

            {/* Courses */}
            <div className="bg-white border rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Cursos oferecidos {uni.courses?.length > 0 && <span className="text-gray-400 font-normal text-base">({uni.courses.length})</span>}
              </h2>
              {!uni.courses?.length ? (
                <p className="text-gray-400 text-sm">Nenhum curso cadastrado.</p>
              ) : (
                <div className="space-y-3">
                  {uni.courses.map((course: any) => (
                    <Link
                      key={course.id}
                      href={`/cursos/${course.slug}`}
                      className="flex items-center justify-between p-4 border rounded-xl hover:border-blue-400 hover:bg-blue-50 transition group"
                    >
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-blue-700">{course.name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {course.modality} • {course.degree} • {course.duration} semestres
                          {course.enade ? ` • ENADE ${course.enade}` : ''}
                        </p>
                      </div>
                      {course.priceMonthly ? (
                        <p className="text-sm font-semibold text-gray-800 shrink-0 ml-4">
                          R$ {course.priceMonthly.toLocaleString('pt-BR')}/mês
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-green-600 shrink-0 ml-4">Gratuito</p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-lg font-semibold text-gray-900">Avaliações de alunos</h2>
                {avgRating && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400 text-xl">★</span>
                    <span className="text-lg font-bold">{avgRating}</span>
                    <span className="text-gray-400 text-sm">/ 5</span>
                  </div>
                )}
              </div>
              {approvedReviews.length > 0 ? (
                <div className="space-y-5 mb-6">
                  {approvedReviews.slice(0, 5).map((review: any) => (
                    <div key={review.id} className="border-b pb-5 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-yellow-400 text-sm">
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </span>
                        <span className="text-sm font-medium text-gray-800">{review.authorName}</span>
                        {review.courseStudied && (
                          <span className="text-xs text-gray-400">• {review.courseStudied}</span>
                        )}
                      </div>
                      {review.comment && (
                        <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                      )}
                      {review.replyText && (
                        <div className="mt-3 ml-4 pl-3 border-l-2 border-blue-200 bg-blue-50 rounded-r-lg py-2 pr-3">
                          <p className="text-xs text-blue-600 font-semibold mb-1">Resposta da instituição</p>
                          <p className="text-sm text-gray-700">{review.replyText}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm mb-6">Nenhuma avaliação ainda. Seja o primeiro!</p>
              )}
              <div className="border-t pt-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Deixe sua avaliação</h3>
                <ReviewForm universitySlug={uni.slug} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Contact */}
            <div className="bg-white border rounded-2xl p-6 space-y-3">
              <h2 className="text-base font-semibold text-gray-900">Contato</h2>
              {uni.phone && (
                <a href={`tel:${uni.phone}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition">
                  <span>📞</span> {uni.phone}
                </a>
              )}
              {uni.whatsapp && (
                <a
                  href={`https://wa.me/55${uni.whatsapp.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-xl transition"
                >
                  💬 Chamar no WhatsApp
                </a>
              )}
              {uni.website && (
                <a href={uni.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  🌐 Site oficial
                </a>
              )}
              {uni.address && (
                <p className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="shrink-0">📍</span> {uni.address}
                </p>
              )}
              {(uni.instagram || uni.facebook || uni.linkedin || uni.youtube) && (
                <div className="flex gap-3 pt-2 flex-wrap">
                  {uni.instagram && (
                    <a href={`https://instagram.com/${uni.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-pink-500 hover:underline">Instagram</a>
                  )}
                  {uni.facebook && (
                    <a href={uni.facebook} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-700 hover:underline">Facebook</a>
                  )}
                  {uni.linkedin && (
                    <a href={uni.linkedin} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline">LinkedIn</a>
                  )}
                  {uni.youtube && (
                    <a href={uni.youtube} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-red-500 hover:underline">YouTube</a>
                  )}
                </div>
              )}
            </div>

            {/* Lead form */}
            <div className="bg-white border rounded-2xl p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Solicitar informações</h2>
              <LeadForm universityId={uni.id} universityName={uni.name} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
