import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'

export async function searchRoutes(app: FastifyInstance) {
  app.get('/', async (request) => {
    const {
      q,
      city,
      state,
      modality,
      shift,
      degree,
      type,
      area,
      prouni,
      fies,
      page = '1',
      limit = '20',
    } = request.query as any

    const skip = (Number(page) - 1) * Number(limit)
    const take = Math.min(Number(limit), 50)

    // Build course filters
    const courseWhere: any = { active: true }
    if (modality) courseWhere.modality = modality
    if (degree) courseWhere.degree = degree
    if (area) courseWhere.area = area

    // If prouni/fies filter, filter via offers
    if (prouni === 'true' || fies === 'true') {
      courseWhere.offers = {
        some: {
          active: true,
          ...(prouni === 'true' ? { prouni: true } : {}),
          ...(fies === 'true' ? { fies: true } : {}),
        },
      }
    }

    if (shift) {
      courseWhere.shift = { has: shift }
    }

    // Build university filters
    const universityWhere: any = {}
    if (city) universityWhere.city = { contains: city, mode: 'insensitive' }
    if (state) universityWhere.state = state
    if (type) universityWhere.type = type

    // Full text search using contains (pg_trgm handles performance)
    if (q) {
      const results = await prisma.course.findMany({
        where: {
          ...courseWhere,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { area: { contains: q, mode: 'insensitive' } },
            { university: { name: { contains: q, mode: 'insensitive' } } },
          ],
          university: universityWhere,
        },
        skip,
        take,
        include: {
          university: {
            select: { id: true, name: true, slug: true, city: true, state: true, type: true, logoUrl: true, igc: true, plan: true },
          },
          offers: { where: { active: true }, take: 1 },
        },
        orderBy: [{ enade: 'desc' }, { name: 'asc' }],
      })

      const total = await prisma.course.count({
        where: {
          ...courseWhere,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { area: { contains: q, mode: 'insensitive' } },
            { university: { name: { contains: q, mode: 'insensitive' } } },
          ],
          university: universityWhere,
        },
      })

      return { data: results, meta: { total, page: Number(page), limit: take } }
    }

    // No query - list all matching
    const [results, total] = await Promise.all([
      prisma.course.findMany({
        where: { ...courseWhere, university: universityWhere },
        skip,
        take,
        include: {
          university: {
            select: { id: true, name: true, slug: true, city: true, state: true, type: true, logoUrl: true, igc: true, plan: true },
          },
          offers: { where: { active: true }, take: 1 },
        },
        orderBy: [{ enade: 'desc' }, { name: 'asc' }],
      }),
      prisma.course.count({ where: { ...courseWhere, university: universityWhere } }),
    ])

    return { data: results, meta: { total, page: Number(page), limit: take } }
  })
}
