import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { api } from '@/lib/api'
import { CourseListClient } from './CourseListClient'

export default async function CursosPage() {
  const session = await getServerSession(authOptions)
  const token = (session as any)?.accessToken
  const universityId = (session as any)?.universityId

  let courses: any[] = []
  try {
    const res = await api.get(`/courses?universityId=${universityId}&limit=50&active=false`, {
      Authorization: `Bearer ${token}`,
    })
    courses = res.data
  } catch {}

  return <CourseListClient initialCourses={courses} token={token} />
}
