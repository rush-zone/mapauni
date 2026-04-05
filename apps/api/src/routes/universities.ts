import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middlewares/auth.middleware'

const updateUniversitySchema = z.object({
  description: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  linkedin: z.string().optional(),
  youtube: z.string().optional(),
  tiktok: z.string().optional(),
  logoUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
  foundedYear: z.number().int().min(1800).max(2100).optional(),
  galleryImages: z.array(z.string()).max(6).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
}).partial()

export async function universityRoutes(app: FastifyInstance) {
  // ── GET /universities/cities?state=XX ───────────────────────────────────
  app.get('/cities', async (request) => {
    const { state } = request.query as { state?: string }
    if (!state) return []
    const rows = await prisma.university.findMany({
      where: { state: state.toUpperCase(), isActive: true },
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    })
    return rows.map(r => r.city)
  })

  // ── GET /universities/search-rich ────────────────────────────────────────
  // University-centric search. Returns universities enriched with course-match
  // indicators when q/modality/shift/degree filters are provided.
  app.get('/search-rich', async (request) => {
    const {
      q, city, state, type, orgAcademica,
      modality, shift, degree,
      page = '1', limit = '20',
    } = request.query as any

    const skip = (Number(page) - 1) * Math.min(Number(limit), 50)
    const take = Math.min(Number(limit), 50)

    // Base university filter
    const uniWhere: any = { isActive: true }
    if (state)       uniWhere.state     = state.toUpperCase()
    if (type)        uniWhere.type      = type.toUpperCase()
    if (city)        uniWhere.city      = { contains: city,        mode: 'insensitive' }
    if (orgAcademica) uniWhere.academicOrg = { contains: orgAcademica, mode: 'insensitive' }

    // Course filter — when any course-level filter is provided, restrict to unis that have matching courses
    const hasCourseFilter = !!(q || modality || shift || degree)
    if (hasCourseFilter) {
      const courseWhere: any = { active: true }
      if (modality) courseWhere.modality = modality
      if (degree)   courseWhere.degree   = degree
      if (shift)    courseWhere.shift    = { has: shift }
      if (q)        courseWhere.name     = { contains: q, mode: 'insensitive' }
      uniWhere.courses = { some: courseWhere }
    }

    // Also allow text search on university name/sigla when q provided
    if (q) {
      uniWhere.OR = [
        { name:   { contains: q, mode: 'insensitive' } },
        { sigla:  { contains: q, mode: 'insensitive' } },
        { courses: { some: { active: true, name: { contains: q, mode: 'insensitive' } } } },
      ]
      delete uniWhere.courses  // avoid conflict — handled inside OR
    }

    const [unis, total] = await Promise.all([
      prisma.university.findMany({
        where: uniWhere,
        skip,
        take,
        select: {
          id: true, slug: true, name: true, sigla: true,
          type: true, city: true, state: true, logoUrl: true, igc: true,
          _count: { select: { courses: { where: { active: true } }, reviews: { where: { status: 'APPROVED' } } } },
        },
        orderBy: [{ igc: 'desc' }, { name: 'asc' }],
      }),
      prisma.university.count({ where: uniWhere }),
    ])

    // For each university, attach matched course names (if q/modality/shift/degree given)
    let data: any[] = unis
    if (hasCourseFilter) {
      const courseWhere: any = { active: true }
      if (modality) courseWhere.modality = modality
      if (degree)   courseWhere.degree   = degree
      if (shift)    courseWhere.shift    = { has: shift }
      if (q)        courseWhere.name     = { contains: q, mode: 'insensitive' }

      const uniIds = unis.map((u: any) => u.id)
      const matchedCourses = await prisma.course.findMany({
        where: { ...courseWhere, universityId: { in: uniIds } },
        select: { universityId: true, name: true, modality: true, shift: true, degree: true },
      })

      const byUni = matchedCourses.reduce<Record<string, any[]>>((acc, c) => {
        ;(acc[c.universityId] = acc[c.universityId] || []).push(c)
        return acc
      }, {})

      data = unis.map((u: any) => ({ ...u, matchedCourses: byUni[u.id] || [] }))
    }

    return { data, meta: { total, page: Number(page), limit: take } }
  })

  // ── GET /universities/search ─────────────────────────────────────────────
  app.get('/search', async (request) => {
    const { q, state, type, city, orgAcademica, comCursos, page = '1', limit = '20' } = request.query as any
    const skip = (Number(page) - 1) * Math.min(Number(limit), 50)
    const take = Math.min(Number(limit), 50)

    const where: any = { isActive: true }
    if (state) where.state = state.toUpperCase()
    if (type) where.type = type.toUpperCase()
    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (orgAcademica) where.academicOrg = { contains: orgAcademica, mode: 'insensitive' }
    if (comCursos === 'true') where.courses = { some: { active: true } }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { sigla: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.university.findMany({
        where,
        skip,
        take,
        select: {
          id: true, slug: true, name: true, sigla: true,
          type: true, category: true, academicOrg: true,
          city: true, state: true, logoUrl: true,
          igc: true, plan: true,
          _count: { select: { courses: true, reviews: { where: { status: 'APPROVED' } } } },
        },
        orderBy: [{ igc: 'desc' }, { name: 'asc' }],
      }),
      prisma.university.count({ where }),
    ])

    return { data, meta: { total, page: Number(page), limit: take } }
  })

  app.get('/', async (request) => {
    const { page = '1', limit = '20', state, type } = request.query as any
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (state) where.state = state
    if (type) where.type = type

    const [universities, total] = await Promise.all([
      prisma.university.findMany({
        where,
        skip,
        take: Math.min(Number(limit), 50),
        include: { _count: { select: { courses: true, leads: true } } },
        orderBy: { name: 'asc' },
      }),
      prisma.university.count({ where }),
    ])

    return { data: universities, meta: { total, page: Number(page), limit: Number(limit) } }
  })

  app.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const university = await prisma.university.findUnique({
      where: { slug },
      include: {
        courses: { where: { active: true }, include: { offers: { where: { active: true } } } },
        acervoAcademico: true,
        atosRegulatorios: { orderBy: { dataPublicacao: 'desc' } },
        processosEmec: { orderBy: { dataAutuacao: 'desc' } },
        ocorrenciasEmec: { orderBy: { dataOcorrencia: 'desc' } },
        cursosAutorizados: { orderBy: [{ grau: 'asc' }, { nome: 'asc' }] },
        reviews: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { reviews: { where: { status: 'APPROVED' } } } },
      },
    })
    if (!university) return reply.status(404).send({ error: 'University not found' })
    return university
  })

  app.patch('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const payload = request.user as any
    const body = updateUniversitySchema.parse(request.body)

    if (payload.universityId !== id) return reply.status(403).send({ error: 'Forbidden' })

    const university = await prisma.university.update({ where: { id }, data: body })
    return university
  })
}
