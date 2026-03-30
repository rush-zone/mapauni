import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middlewares/auth.middleware'

const createCourseSchema = z.object({
  name: z.string().min(2),
  area: z.string(),
  subArea: z.string().optional(),
  degree: z.enum(['BACHARELADO', 'LICENCIATURA', 'TECNOLOGO', 'POS_GRADUACAO', 'MBA', 'MESTRADO', 'DOUTORADO']),
  modality: z.enum(['PRESENCIAL', 'EAD', 'HIBRIDO']),
  shift: z.array(z.enum(['MANHA', 'TARDE', 'NOITE', 'INTEGRAL'])),
  duration: z.number().int().positive(),
  priceMonthly: z.number().positive().optional(),
  description: z.string().optional(),
})

function generateSlug(name: string, universitySlug: string): string {
  return `${name}-${universitySlug}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function courseRoutes(app: FastifyInstance) {
  app.get('/', async (request) => {
    const { page = '1', limit = '20', universityId, modality, degree, area } = request.query as any
    const skip = (Number(page) - 1) * Number(limit)

    const { active } = request.query as any
    const where: any = {}
    if (active !== 'false') where.active = true
    if (universityId) where.universityId = universityId
    if (modality) where.modality = modality
    if (degree) where.degree = degree
    if (area) where.area = area

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: Math.min(Number(limit), 50),
        include: { university: { select: { name: true, slug: true, city: true, state: true } } },
        orderBy: { name: 'asc' },
      }),
      prisma.course.count({ where }),
    ])

    return { data: courses, meta: { total, page: Number(page), limit: Number(limit) } }
  })

  app.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        university: true,
        offers: { where: { active: true }, orderBy: { semester: 'desc' } },
      },
    })
    if (!course) return reply.status(404).send({ error: 'Course not found' })
    return course
  })

  app.post('/', { preHandler: authenticate }, async (request, reply) => {
    const payload = request.user as any
    const body = createCourseSchema.parse(request.body)

    const university = await prisma.university.findUnique({ where: { id: payload.universityId } })
    if (!university) return reply.status(404).send({ error: 'University not found' })

    const slug = generateSlug(body.name, university.slug)

    const course = await prisma.course.create({
      data: {
        ...body,
        slug,
        universityId: payload.universityId,
      },
    })
    return reply.status(201).send(course)
  })

  app.patch('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const payload = request.user as any
    const body = createCourseSchema.partial().extend({ active: z.boolean().optional() }).parse(request.body)

    const course = await prisma.course.findUnique({ where: { id } })
    if (!course) return reply.status(404).send({ error: 'Course not found' })
    if (course.universityId !== payload.universityId) return reply.status(403).send({ error: 'Forbidden' })

    const updated = await prisma.course.update({ where: { id }, data: body })
    return updated
  })
}
