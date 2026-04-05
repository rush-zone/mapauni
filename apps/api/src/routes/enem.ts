import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

const schema = z.object({
  email: z.string().email(),
  score: z.number().min(0).max(1000),
})

export async function enemRoutes(app: FastifyInstance) {
  app.post('/interest', async (request, reply) => {
    const result = schema.safeParse(request.body)
    if (!result.success) return reply.status(400).send({ error: 'Dados inválidos' })

    const { email, score } = result.data
    const record = await prisma.enemInterest.create({ data: { email, score } })
    return reply.status(201).send({ id: record.id })
  })
}
