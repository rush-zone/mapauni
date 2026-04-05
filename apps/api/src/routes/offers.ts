import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middlewares/auth.middleware'

const offerSchema = z.object({
  semester: z.string().min(1),
  vacancies: z.number().int().positive(),
  priceMonthly: z.number().positive().optional(),
  prouni: z.boolean().default(false),
  fies: z.boolean().default(false),
  cutoffScore: z.number().optional(),
  enrollStart: z.string().optional(),
  enrollEnd: z.string().optional(),
})

export async function offerRoutes(fastify: FastifyInstance) {

  // ── GET /offers/:courseId — lista ofertas de um curso (público) ───────────
  fastify.get('/:courseId', async (request, reply) => {
    const { courseId } = request.params as { courseId: string }
    const offers = await prisma.offer.findMany({
      where: { courseId, active: true },
      orderBy: { semester: 'desc' },
    })
    return offers
  })

  // ── POST /offers/:courseId — cria oferta (autenticado) ────────────────────
  fastify.post('/:courseId', { preHandler: authenticate }, async (request, reply) => {
    const { courseId } = request.params as { courseId: string }
    const payload = request.user as any
    const body = offerSchema.parse(request.body)

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return reply.status(404).send({ error: 'Curso não encontrado' })
    if (course.universityId !== payload.universityId) return reply.status(403).send({ error: 'Forbidden' })

    const offer = await prisma.offer.create({
      data: {
        ...body,
        courseId,
        enrollStart: body.enrollStart ? new Date(body.enrollStart) : undefined,
        enrollEnd: body.enrollEnd ? new Date(body.enrollEnd) : undefined,
      },
    })
    return reply.status(201).send(offer)
  })

  // ── PATCH /offers/item/:id — atualiza oferta ──────────────────────────────
  fastify.patch('/item/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const payload = request.user as any
    const body = offerSchema.partial().parse(request.body)

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: { course: true },
    })
    if (!offer) return reply.status(404).send({ error: 'Oferta não encontrada' })
    if (offer.course.universityId !== payload.universityId) return reply.status(403).send({ error: 'Forbidden' })

    const updated = await prisma.offer.update({
      where: { id },
      data: {
        ...body,
        enrollStart: body.enrollStart ? new Date(body.enrollStart) : undefined,
        enrollEnd: body.enrollEnd ? new Date(body.enrollEnd) : undefined,
      },
    })
    return updated
  })

  // ── DELETE /offers/item/:id ───────────────────────────────────────────────
  fastify.delete('/item/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const payload = request.user as any

    const offer = await prisma.offer.findUnique({ where: { id }, include: { course: true } })
    if (!offer) return reply.status(404).send({ error: 'Oferta não encontrada' })
    if (offer.course.universityId !== payload.universityId) return reply.status(403).send({ error: 'Forbidden' })

    await prisma.offer.delete({ where: { id } })
    return { success: true }
  })
}
