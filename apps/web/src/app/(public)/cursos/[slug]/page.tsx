import Link from 'next/link'
import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { LeadForm } from '@/components/lead/LeadForm'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const course: any = await api.get(`/courses/${params.slug}`)
    return {
      title: `${course.name} — ${course.university.name} | MapaUni`,
      description: course.description ?? `Curso de ${course.name} na ${course.university.name} em ${course.university.city}, ${course.university.state}. ${course.modality} • ${course.degree}.`,
    }
  } catch {
    return { title: 'Curso — MapaUni' }
  }
}

const DEGREE_LABEL: Record<string, string> = {
  BACHARELADO: 'Bacharelado', LICENCIATURA: 'Licenciatura', TECNOLOGO: 'Tecnólogo',
  POS_GRADUACAO: 'Pós-Graduação', MBA: 'MBA', MESTRADO: 'Mestrado', DOUTORADO: 'Doutorado',
}
const MODALITY_LABEL: Record<string, string> = {
  PRESENCIAL: 'Presencial', EAD: 'EAD', HIBRIDO: 'Híbrido',
}
const SHIFT_LABEL: Record<string, string> = {
  MANHA: 'Manhã', TARDE: 'Tarde', NOITE: 'Noite', INTEGRAL: 'Integral',
}

export default async function CoursePage({ params }: { params: { slug: string } }) {
  let course: any
  try {
    course = await api.get(`/courses/${params.slug}`)
  } catch {
    notFound()
  }

  const uni = course.university
  const activeOffer = course.offers?.[0]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: course.description,
    provider: {
      '@type': 'CollegeOrUniversity',
      name: uni.name,
      sameAs: uni.website,
    },
    educationalLevel: DEGREE_LABEL[course.degree],
    courseMode: MODALITY_LABEL[course.modality],
    ...(activeOffer?.priceMonthly && {
      offers: {
        '@type': 'Offer',
        price: activeOffer.priceMonthly,
        priceCurrency: 'BRL',
      },
    }),
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="flex items-center px-6 py-4 border-b bg-white shadow-sm">
        <Link href="/" className="text-xl font-bold text-blue-600 mr-4">MapaUni</Link>
        <span className="text-gray-400 text-sm">
          / <Link href="/busca" className="hover:text-blue-600">Busca</Link>
          {' / '}{course.name}
        </span>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main */}
          <div className="lg:col-span-2 space-y-6">

            {/* Header */}
            <div className="bg-white border rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 overflow-hidden">
                  {uni.logoUrl
                    ? <img src={uni.logoUrl} alt={uni.name} className="w-full h-full object-contain p-1" />
                    : <span className="text-xl font-bold text-blue-600">{uni.name[0]}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
                  <Link href={`/universidades/${uni.slug}`} className="text-blue-600 font-medium hover:underline">
                    {uni.name}
                  </Link>
                  <p className="text-sm text-gray-500 mt-0.5">{uni.city}, {uni.state}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  {DEGREE_LABEL[course.degree]}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {MODALITY_LABEL[course.modality]}
                </span>
                {course.shift?.map((s: string) => (
                  <span key={s} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {SHIFT_LABEL[s]}
                  </span>
                ))}
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {course.duration} semestres
                </span>
                {course.area && (
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                    {course.area}{course.subArea ? ` › ${course.subArea}` : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {course.description && (
              <div className="bg-white border rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Sobre o curso</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{course.description}</p>
              </div>
            )}

            {/* MEC metrics */}
            {(course.enade || course.ccpValue) && (
              <div className="bg-white border rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Avaliações MEC</h2>
                <div className="flex gap-8">
                  {course.enade && (
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">{course.enade}</p>
                      <p className="text-xs text-gray-500 mt-1">ENADE</p>
                    </div>
                  )}
                  {course.ccpValue && (
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">{course.ccpValue}</p>
                      <p className="text-xs text-gray-500 mt-1">CPC</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Offers */}
            {course.offers?.length > 0 && (
              <div className="bg-white border rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Ofertas disponíveis</h2>
                <div className="space-y-4">
                  {course.offers.map((offer: any) => (
                    <div key={offer.id} className="border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-800">Semestre {offer.semester}</span>
                        {offer.priceMonthly ? (
                          <span className="text-lg font-bold text-gray-900">
                            R$ {offer.priceMonthly.toLocaleString('pt-BR')}
                            <span className="text-sm font-normal text-gray-500">/mês</span>
                          </span>
                        ) : (
                          <span className="text-green-600 font-semibold">Gratuito</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm">
                        {offer.vacancies > 0 && (
                          <span className="text-gray-500">{offer.vacancies} vagas</span>
                        )}
                        {offer.prouni && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">ProUni</span>
                        )}
                        {offer.fies && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">FIES</span>
                        )}
                        {offer.cutoffScore && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                            Corte {offer.cutoffScore}
                          </span>
                        )}
                      </div>
                      {offer.enrollStart && offer.enrollEnd && (
                        <p className="text-xs text-gray-400 mt-2">
                          Inscrições: {new Date(offer.enrollStart).toLocaleDateString('pt-BR')} até {new Date(offer.enrollEnd).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* University card */}
            <div className="bg-white border rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Instituição</h2>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center overflow-hidden shrink-0">
                  {uni.logoUrl
                    ? <img src={uni.logoUrl} alt={uni.name} className="w-full h-full object-contain p-1" />
                    : <span className="text-lg font-bold text-blue-600">{uni.name[0]}</span>
                  }
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{uni.name}</p>
                  <p className="text-sm text-gray-500">{uni.city}, {uni.state}</p>
                </div>
              </div>
              {uni.description && (
                <p className="text-sm text-gray-600 mt-3 line-clamp-3">{uni.description}</p>
              )}
              <Link
                href={`/universidades/${uni.slug}`}
                className="inline-block mt-3 text-sm text-blue-600 hover:underline font-medium"
              >
                Ver perfil completo →
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-white border rounded-2xl p-6 text-center">
              {activeOffer?.priceMonthly ? (
                <>
                  <p className="text-sm text-gray-500 mb-1">Mensalidade a partir de</p>
                  <p className="text-3xl font-bold text-gray-900">
                    R$ {activeOffer.priceMonthly.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm text-gray-400">/mês</p>
                  {(activeOffer.prouni || activeOffer.fies) && (
                    <div className="flex justify-center gap-2 mt-3">
                      {activeOffer.prouni && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">ProUni</span>
                      )}
                      {activeOffer.fies && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">FIES</span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-green-600">Gratuito</p>
                  <p className="text-sm text-gray-400 mt-1">Universidade pública</p>
                </>
              )}
            </div>

            <div className="bg-white border rounded-2xl p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Tenho interesse neste curso</h2>
              <LeadForm
                universityId={uni.id}
                universityName={uni.name}
                courseId={course.id}
                courseName={course.name}
              />
            </div>

            {uni.whatsapp && (
              <a
                href={`https://wa.me/55${uni.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-2xl transition"
              >
                💬 Chamar no WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
