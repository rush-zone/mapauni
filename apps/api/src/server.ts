import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import { authRoutes } from './routes/auth'
import { universityRoutes } from './routes/universities'
import { courseRoutes } from './routes/courses'
import { leadRoutes } from './routes/leads'
import { searchRoutes } from './routes/search'
import { reviewRoutes } from './routes/reviews'

const server = Fastify({ logger: true })

async function bootstrap() {
  await server.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })

  await server.register(cookie)

  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret',
    cookie: { cookieName: 'access_token', signed: false },
  })

  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  await server.register(authRoutes, { prefix: '/api/v1/auth' })
  await server.register(universityRoutes, { prefix: '/api/v1/universities' })
  await server.register(courseRoutes, { prefix: '/api/v1/courses' })
  await server.register(leadRoutes, { prefix: '/api/v1/leads' })
  await server.register(searchRoutes, { prefix: '/api/v1/search' })
  await server.register(reviewRoutes, { prefix: '/api/v1' })

  server.get('/health', async () => ({ status: 'ok' }))

  await server.listen({ port: Number(process.env.PORT) || 3333, host: '0.0.0.0' })
}

bootstrap().catch(console.error)
