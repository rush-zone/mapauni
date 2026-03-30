import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middlewares/auth.middleware'

const createLeadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  message: z.string().optional(),
  universityId: z.string(),
  courseId: z.string().optional(),
  source: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
})

export async function leadRoutes(app: FastifyInstance) {
  // Public - students submit leads without account
  app.post('/', async (request, reply) => {
    const body = createLeadSchema.parse(request.body)

    const university = await prisma.university.findUnique({ where: { id: body.universityId } })
    if (!university) return reply.status(404).send({ error: 'University not found' })

    const lead = await prisma.lead.create({ data: body })
    return reply.status(201).send(lead)
  })

  // Authenticated - dashboard stats
  app.get('/stats', { preHandler: authenticate }, async (request) => {
    const payload = request.user as any
    const universityId = payload.universityId

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [total, thisMonth, contacted, enrolled] = await Promise.all([
      prisma.lead.count({ where: { universityId } }),
      prisma.lead.count({ where: { universityId, createdAt: { gte: startOfMonth } } }),
      prisma.lead.count({ where: { universityId, status: { in: ['CONTACTED', 'ENROLLED'] } } }),
      prisma.lead.count({ where: { universityId, status: 'ENROLLED' } }),
    ])

    const responseRate = total > 0 ? Math.round((contacted / total) * 100) : 0

    return { total, thisMonth, responseRate, enrolled }
  })

  // Authenticated - university sees their leads
  app.get('/', { preHandler: authenticate }, async (request) => {
    const payload = request.user as any
    const { page = '1', limit = '20', status } = request.query as any
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = { universityId: payload.universityId }
    if (status) where.status = status

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: Math.min(Number(limit), 50),
        include: { course: { select: { name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lead.count({ where }),
    ])

    // Mark new leads as OPENED when university views them
    await prisma.lead.updateMany({
      where: { universityId: payload.universityId, status: 'NEW' },
      data: { status: 'OPENED', openedAt: new Date() },
    })

    return { data: leads, meta: { total, page: Number(page), limit: Number(limit) } }
  })

  app.patch('/:id/status', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const payload = request.user as any
    const { status } = z.object({ status: z.enum(['NEW', 'OPENED', 'CONTACTED', 'ENROLLED', 'LOST']) }).parse(request.body)

    const lead = await prisma.lead.findUnique({ where: { id } })
    if (!lead) return reply.status(404).send({ error: 'Lead not found' })
    if (lead.universityId !== payload.universityId) return reply.status(403).send({ error: 'Forbidden' })

    const updated = await prisma.lead.update({ where: { id }, data: { status } })
    return updated
  })
}
