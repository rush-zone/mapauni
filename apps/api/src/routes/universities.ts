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
  galleryImages: z.array(z.string().url()).max(6).optional(),
}).partial()

export async function universityRoutes(app: FastifyInstance) {
  // ── GET /universities/search ─────────────────────────────────────────────
  app.get('/search', async (request) => {
    const { q, state, type, city, page = '1', limit = '20' } = request.query as any
    const skip = (Number(page) - 1) * Math.min(Number(limit), 50)
    const take = Math.min(Number(limit), 50)

    const where: any = { isActive: true }
    if (state) where.state = state.toUpperCase()
    if (type) where.type = type.toUpperCase()
    if (city) where.city = { contains: city, mode: 'insensitive' }
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
