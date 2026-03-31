import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middlewares/auth.middleware'

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  authorName: z.string().min(2),
  authorEmail: z.string().email(),
  courseStudied: z.string().optional(),
})

export async function reviewRoutes(app: FastifyInstance) {
  app.get('/universities/:slug/reviews', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const university = await prisma.university.findUnique({ where: { slug } })
    if (!university) return reply.status(404).send({ error: 'University not found' })

    // Show all non-rejected reviews (APPROVED = visible, PENDING = auto-visible for unpaid, REJECTED = hidden by paid plan)
    const reviews = await prisma.review.findMany({
      where: { universityId: university.id, status: { not: 'REJECTED' } },
      orderBy: { createdAt: 'desc' },
    })

    const agg = await prisma.review.aggregate({
      where: { universityId: university.id, status: { not: 'REJECTED' } },
      _avg: { rating: true },
      _count: { rating: true },
    })

    return {
      data: reviews,
      aggregate: {
        average: agg._avg.rating ?? 0,
        count: agg._count.rating,
      },
    }
  })

  app.post('/universities/:slug/reviews', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const body = createReviewSchema.parse(request.body)

    const university = await prisma.university.findUnique({ where: { slug } })
    if (!university) return reply.status(404).send({ error: 'University not found' })

    // Reviews go live immediately as APPROVED — paid plans can reject (hide) later
    const review = await prisma.review.create({
      data: { ...body, universityId: university.id, status: 'APPROVED' },
    })
    return reply.status(201).send(review)
  })

  // Authenticated - list own university reviews for moderation
  app.get('/reviews', { preHandler: authenticate }, async (request) => {
    const payload = request.user as any
    const { status } = request.query as { status?: string }
    const where: any = { universityId: payload.universityId }
    if (status) where.status = status

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return { data: reviews }
  })

  app.patch('/reviews/:id/status', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status } = z.object({ status: z.enum(['APPROVED', 'REJECTED']) }).parse(request.body)
    const updated = await prisma.review.update({ where: { id }, data: { status } })
    return updated
  })

  app.patch('/reviews/:id/reply', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { replyText } = z.object({ replyText: z.string().min(1) }).parse(request.body)
    const updated = await prisma.review.update({
      where: { id },
      data: { replyText, repliedAt: new Date() },
    })
    return updated
  })
}
