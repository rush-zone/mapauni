'use client'
import { useState } from 'react'
import { CourseFormModal } from './CourseFormModal'

const DEGREE_LABEL: Record<string, string> = {
  BACHARELADO: 'Bacharelado', LICENCIATURA: 'Licenciatura', TECNOLOGO: 'Tecnólogo',
  POS_GRADUACAO: 'Pós-Grad.', MBA: 'MBA', MESTRADO: 'Mestrado', DOUTORADO: 'Doutorado',
}
const MODALITY_LABEL: Record<string, string> = {
  PRESENCIAL: 'Presencial', EAD: 'EAD', HIBRIDO: 'Híbrido',
}

export function CourseListClient({ initialCourses, token }: { initialCourses: any[]; token: string }) {
  const [courses, setCourses] = useState(initialCourses)
  const [modal, setModal] = useState<{ open: boolean; course?: any }>({ open: false })
  const [toggling, setToggling] = useState<string | null>(null)

  function openCreate() { setModal({ open: true, course: undefined }) }
  function openEdit(course: any) { setModal({ open: true, course }) }
  function closeModal() { setModal({ open: false }) }

  function handleSaved(saved: any) {
    setCourses(prev => {
      const exists = prev.find(c => c.id === saved.id)
      return exists ? prev.map(c => c.id === saved.id ? saved : c) : [saved, ...prev]
    })
    closeModal()
  }

  async function toggleActive(course: any) {
    setToggling(course.id)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active: !course.active }),
      })
      if (res.ok) {
        setCourses(prev => prev.map(c => c.id === course.id ? { ...c, active: !c.active } : c))
      }
    } finally {
      setToggling(null)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cursos ({courses.length})</h1>
        <button onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
          + Novo curso
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        {courses.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 mb-4">Nenhum curso cadastrado ainda.</p>
            <button onClick={openCreate}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
              Cadastrar primeiro curso
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {courses.map(course => (
              <div key={course.id} className="flex items-center justify-between px-6 py-4 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{course.name}</p>
                  <p className="text-sm text-gray-500">
                    {MODALITY_LABEL[course.modality]} &bull; {DEGREE_LABEL[course.degree]} &bull; {course.duration} sem.
                    {course.area && <> &bull; {course.area}</>}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {course.priceMonthly ? (
                    <p className="text-sm font-semibold text-gray-700 hidden sm:block">
                      R$ {Number(course.priceMonthly).toLocaleString('pt-BR')}/mês
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-green-600 hidden sm:block">Gratuito</p>
                  )}
                  <button onClick={() => openEdit(course)}
                    className="px-3 py-1.5 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">
                    Editar
                  </button>
                  <button
                    onClick={() => toggleActive(course)}
                    disabled={toggling === course.id}
                    className={`px-3 py-1.5 text-xs rounded-full font-medium transition disabled:opacity-50 ${
                      course.active ? 'bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-700' : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-700'
                    }`}>
                    {course.active ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal.open && (
        <CourseFormModal
          course={modal.course}
          token={token}
          onClose={closeModal}
          onSave={handleSaved}
        />
      )}
    </>
  )
}
