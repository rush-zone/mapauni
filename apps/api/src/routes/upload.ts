import { FastifyInstance } from 'fastify'
import { authenticate } from '../middlewares/auth.middleware'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

// Garante que a pasta existe
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    const file = await request.file()
    if (!file) return reply.status(400).send({ message: 'Nenhum arquivo enviado' })

    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return reply.status(400).send({ message: 'Formato inválido. Use JPG, PNG ou WebP.' })
    }

    const chunks: Buffer[] = []
    for await (const chunk of file.file) chunks.push(chunk as Buffer)
    const buf = Buffer.concat(chunks)

    if (buf.length > MAX_SIZE) {
      return reply.status(400).send({ message: 'Arquivo muito grande. Máximo 10MB.' })
    }

    const ext = file.mimetype.split('/')[1].replace('jpeg', 'jpg')
    const filename = `${crypto.randomBytes(16).toString('hex')}.${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)

    fs.writeFileSync(filepath, buf)

    const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3333}`
    const url = `${baseUrl}/uploads/${filename}`

    return reply.send({ url })
  })
}
