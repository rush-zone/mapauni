import { FastifyRequest, FastifyReply } from 'fastify'

export async function authenticateAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify<{ sub: string; role: string }>()
    if (payload.role !== 'admin') {
      return reply.status(403).send({ message: 'Acesso negado' })
    }
  } catch {
    return reply.status(401).send({ message: 'Não autorizado' })
  }
}
