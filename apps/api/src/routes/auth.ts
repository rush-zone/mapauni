import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middlewares/auth.middleware'

const registerSchema = z.object({
  // Dados do usuário admin
  userName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  // Dados da universidade
  universityName: z.string().min(3),
  universityType: z.enum(['FEDERAL', 'ESTADUAL', 'MUNICIPAL', 'PRIVADA']),
  city: z.string().min(2),
  state: z.string().length(2),
  phone: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body)

    const existing = await prisma.universityUser.findUnique({ where: { email: body.email } })
    if (existing) return reply.status(409).send({ error: 'Email já cadastrado' })

    const slug = body.universityName
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim().replace(/\s+/g, '-')

    const slugExists = await prisma.university.findUnique({ where: { slug } })
    const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug

    const passwordHash = await bcrypt.hash(body.password, 10)

    const result = await prisma.$transaction(async (tx) => {
      const university = await tx.university.create({
        data: {
          name: body.universityName,
          slug: finalSlug,
          type: body.universityType,
          city: body.city,
          state: body.state.toUpperCase(),
          phone: body.phone,
          email: body.email,
          plan: 'PREMIUM',
        },
      })
      const user = await tx.universityUser.create({
        data: {
          email: body.email,
          name: body.userName,
          passwordHash,
          role: 'OWNER',
          universityId: university.id,
        },
      })
      return { university, user }
    })

    const token = app.jwt.sign(
      { sub: result.user.id, universityId: result.user.universityId, role: result.user.role },
      { expiresIn: '15m' }
    )
    const refreshToken = app.jwt.sign({ sub: result.user.id }, { expiresIn: '7d' })
    reply.setCookie('refresh_token', refreshToken, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 })

    return reply.status(201).send({
      token,
      user: { id: result.user.id, email: result.user.email, name: result.user.name, role: result.user.role, universityId: result.user.universityId },
    })
  })

  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)
    const user = await prisma.universityUser.findUnique({ where: { email: body.email } })
    if (!user) return reply.status(401).send({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(body.password, user.passwordHash)
    if (!valid) return reply.status(401).send({ error: 'Invalid credentials' })

    const token = app.jwt.sign(
      { sub: user.id, universityId: user.universityId, role: user.role },
      { expiresIn: '15m' }
    )
    const refreshToken = app.jwt.sign({ sub: user.id }, { expiresIn: '7d' })

    reply.setCookie('refresh_token', refreshToken, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role, universityId: user.universityId } }
  })

  app.get('/me', { preHandler: authenticate }, async (request) => {
    const payload = request.user as any
    const user = await prisma.universityUser.findUnique({
      where: { id: payload.sub },
      include: { university: true },
    })
    return user
  })

  app.post('/logout', async (request, reply) => {
    reply.clearCookie('refresh_token')
    return { success: true }
  })

  app.post('/forgot-password', async (request, reply) => {
    const { email } = z.object({ email: z.string().email() }).parse(request.body)
    const user = await prisma.universityUser.findUnique({ where: { email } })

    // Sempre retorna 200 para não revelar se o email existe
    if (!user) return { success: true }

    const resetToken = app.jwt.sign({ sub: user.id, purpose: 'reset' }, { expiresIn: '1h' })

    // TODO: enviar email com link contendo resetToken (Resend)
    // Por ora, retorna o token no ambiente de desenvolvimento
    const isDev = process.env.NODE_ENV !== 'production'
    return { success: true, ...(isDev && { resetToken }) }
  })

  app.post('/reset-password', async (request, reply) => {
    const { token, password } = z.object({
      token: z.string(),
      password: z.string().min(8),
    }).parse(request.body)

    let payload: any
    try {
      payload = app.jwt.verify(token)
    } catch {
      return reply.status(400).send({ error: 'Token inválido ou expirado' })
    }

    if (payload.purpose !== 'reset') return reply.status(400).send({ error: 'Token inválido' })

    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.universityUser.update({ where: { id: payload.sub }, data: { passwordHash } })

    return { success: true }
  })
}
