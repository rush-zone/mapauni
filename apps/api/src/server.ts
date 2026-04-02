import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'
import { authRoutes } from './routes/auth'
import { universityRoutes } from './routes/universities'
import { courseRoutes } from './routes/courses'
import { leadRoutes } from './routes/leads'
import { searchRoutes } from './routes/search'
import { reviewRoutes } from './routes/reviews'
import { adminRoutes } from './routes/admin'

const server = Fastify({ logger: true, bodyLimit: 500 * 1024 * 1024 })

async function bootstrap() {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'https://mapauni-web.vercel.app',
  ].filter(Boolean) as string[]

  await server.register(cors, {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.some((o) => origin.startsWith(o))) {
        cb(null, true)
      } else {
        cb(new Error('Not allowed by CORS'), false)
      }
    },
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

  await server.register(multipart, { limits: { fileSize: 500 * 1024 * 1024 } }) // 500 MB

  await server.register(authRoutes, { prefix: '/api/v1/auth' })
  await server.register(universityRoutes, { prefix: '/api/v1/universities' })
  await server.register(courseRoutes, { prefix: '/api/v1/courses' })
  await server.register(leadRoutes, { prefix: '/api/v1/leads' })
  await server.register(searchRoutes, { prefix: '/api/v1/search' })
  await server.register(reviewRoutes, { prefix: '/api/v1' })
  await server.register(adminRoutes, { prefix: '/api/v1/admin' })

  server.get('/health', async () => ({ status: 'ok' }))

  await server.listen({ port: Number(process.env.PORT) || 3333, host: '0.0.0.0' })
}

bootstrap().catch(console.error)
