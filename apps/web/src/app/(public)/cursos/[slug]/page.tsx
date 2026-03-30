import Link from 'next/link'
import { api } from '@/lib/api'
import { LeadForm } from '@/components/lead/LeadForm'
import { notFound } from 'next/navigation'

export default async function CoursePage({ params }: { params: { slug: string } }) {
  let course: any
  try {
    course = await api.get(`/courses/${params.slug}`)
  } catch {
    notFound()
  }

  const shiftLabels: Record<string, string> = {
    MANHA: 'Manhã', TARDE: 'Tarde', NOITE: 'Noite', INTEGRAL: 'Integral'
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="flex items-center px-6 py-4 border-b bg-white shadow-sm flex-wrap gap-2">
        <Link href="/" className="text-xl font-bold text-blue-600 mr-4">MapaUni</Link>
        <span className="text-gray-400">
          / <Link href="/universidades" className="hover:text-blue-600">Universidades</Link>
          {' / '}
          <Link href={`/universidades/${course.university.slug}`} className="hover:text-blue-600">{course.university.name}</Link>
          {' / '}{course.name}
        </span>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border rounded-xl p-6">
              <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
              <Link href={`/universidades/${course.university.slug}`} className="text-blue-600 font-medium hover:underline">
                {course.university.name}
              </Link>
              <p className="text-gray-500 text-sm mt-1">{course.university.city}, {course.university.state}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Modalidade</p>
                  <p className="font-semibold text-gray-900 mt-1">{course.modality}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Grau</p>
                  <p className="font-semibold text-gray-900 mt-1">{course.degree}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Duração</p>
                  <p className="font-semibold text-gray-900 mt-1">{course.duration} sem.</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">ENADE</p>
                  <p className="font-semibold text-gray-900 mt-1">{course.enade ?? 'N/A'}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2 flex-wrap">
                {course.shift?.map((s: string) => (
                  <span key={s} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{shiftLabels[s]}</span>
                ))}
              </div>

              {course.description && <p className="text-gray-600 mt-4">{course.description}</p>}
            </div>

            {course.offers?.length > 0 && (
              <div className="bg-white border rounded-xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Vagas disponíveis</h2>
                {course.offers.map((offer: any) => (
                  <div key={offer.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{offer.semester}</p>
                        <p className="text-sm text-gray-500">{offer.vacancies - offer.enrolled} vagas disponíveis</p>
                      </div>
                      <div className="text-right">
                        {offer.priceMonthly && (
                          <p className="font-bold text-gray-900">R$ {offer.priceMonthly.toLocaleString('pt-BR')}/mês</p>
                        )}
                        <div className="flex gap-2 mt-1">
                          {offer.prouni && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">ProUni</span>}
                          {offer.fies && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">FIES</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="bg-white border rounded-xl p-6 sticky top-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Tenho interesse neste curso</h2>
              <LeadForm
                universityId={course.university.id}
                universityName={course.university.name}
                courseId={course.id}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
