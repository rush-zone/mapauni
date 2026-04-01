import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { parse } from 'csv-parse'
import { prisma } from '../lib/prisma'
import { authenticateAdmin } from '../middlewares/adminAuth.middleware'
import { UniversityType } from '@prisma/client'

// ─── helpers ─────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * O CSV do MEC é gravado em ISO-8859-1 (latin1), mas recebido como Buffer.
 * Recodificamos aqui para corrigir mojibake.
 */
function decodeLatin1(buf: Buffer): string {
  return buf.toString('latin1')
}

/**
 * Mapeia CATEGORIA_DA_IES + ORGANIZACAO_ACADEMICA para UniversityType.
 * Categorias possíveis do MEC:
 *   Pública Federal  → FEDERAL
 *   Pública Estadual → ESTADUAL
 *   Pública Municipal → MUNICIPAL
 *   Privada          → PRIVADA
 *
 * A categoria "Pública" pode aparecer junto da org acadêmica (ex.: "Universidade Federal de…")
 * então cruzamos nome + org para distinguir.
 */
function mapUniversityType(
  categoria: string,
  orgAcademica: string,
  nome: string,
): UniversityType {
  const cat = categoria.trim().toLowerCase()
  const org = orgAcademica.trim().toLowerCase()
  const n = nome.trim().toLowerCase()

  if (cat.includes('privada')) return UniversityType.PRIVADA
  if (cat.includes('p') && (org.includes('federal') || n.includes('federal'))) return UniversityType.FEDERAL
  if (cat.includes('p') && (org.includes('estadual') || n.includes('estadual'))) return UniversityType.ESTADUAL
  if (cat.includes('p') && (org.includes('municipal') || n.includes('municipal'))) return UniversityType.MUNICIPAL

  // fallback para públicas não identificadas
  return UniversityType.FEDERAL
}

/**
 * Gera slug único: se já existir, incrementa sufixo numérico.
 */
async function uniqueSlug(base: string): Promise<string> {
  let slug = base
  let attempt = 1
  while (true) {
    const exists = await prisma.university.findUnique({ where: { slug } })
    if (!exists) return slug
    slug = `${base}-${attempt++}`
  }
}

// ─── route plugin ─────────────────────────────────────────────────────────────

export async function adminRoutes(fastify: FastifyInstance) {
  // ── POST /admin/login ────────────────────────────────────────────────────
  fastify.post('/login', async (request, reply) => {
    const body = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }).parse(request.body)

    const admin = await prisma.adminUser.findUnique({ where: { email: body.email } })
    if (!admin) return reply.status(401).send({ message: 'Credenciais inválidas' })

    const ok = await bcrypt.compare(body.password, admin.passwordHash)
    if (!ok) return reply.status(401).send({ message: 'Credenciais inválidas' })

    const token = fastify.jwt.sign(
      { sub: admin.id, role: 'admin', name: admin.name },
      { expiresIn: '8h' },
    )

    return reply.send({ token, admin: { id: admin.id, name: admin.name, email: admin.email } })
  })

  // ── GET /admin/me ────────────────────────────────────────────────────────
  fastify.get('/me', { preHandler: authenticateAdmin }, async (request) => {
    const { sub } = request.user as { sub: string }
    const admin = await prisma.adminUser.findUnique({
      where: { id: sub },
      select: { id: true, name: true, email: true, createdAt: true },
    })
    return admin
  })

  // ── GET /admin/stats ─────────────────────────────────────────────────────
  fastify.get('/stats', { preHandler: authenticateAdmin }, async () => {
    const [universities, active, leads, reviews] = await Promise.all([
      prisma.university.count(),
      prisma.university.count({ where: { isActive: true } }),
      prisma.lead.count(),
      prisma.review.count(),
    ])
    return { universities, active, leads, reviews }
  })

  // ── POST /admin/import/universities ──────────────────────────────────────
  // Recebe o arquivo CSV MEC via multipart e realiza upsert das IES.
  fastify.post('/import/universities', { preHandler: authenticateAdmin }, async (request, reply) => {
    const file = await request.file()
    if (!file) return reply.status(400).send({ message: 'Arquivo CSV não enviado' })

    const chunks: Buffer[] = []
    for await (const chunk of file.file) {
      chunks.push(chunk as Buffer)
    }
    const raw = decodeLatin1(Buffer.concat(chunks))

    // Resultados da importação
    const result = { created: 0, updated: 0, skipped: 0, errors: [] as string[] }

    const records = await new Promise<Record<string, string>[]>((resolve, reject) => {
      parse(raw, {
        columns: true,
        delimiter: ';',
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        bom: true,
      }, (err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
    })

    for (const row of records) {
      try {
        const situacao = (row['SITUACAO_IES'] || '').trim().toLowerCase()
        const isActive = situacao === 'ativa' || situacao === 'em atividade'

        const mecCode = (row['CODIGO_DA_IES'] || '').trim()
        const nome = (row['NOME_DA_IES'] || '').trim()
        const sigla = (row['SIGLA'] || '').trim() || null
        const categoria = (row['CATEGORIA_DA_IES'] || '').trim()
        const orgAcademica = (row['ORGANIZACAO_ACADEMICA'] || '').trim()
        const ibgeCode = (row['CODIGO_MUNICIPIO_IBGE'] || '').trim() || null
        const municipio = (row['MUNICIPIO'] || '').trim()
        const uf = (row['UF'] || '').trim()

        // Subcategoria para privadas
        let category: string | null = null
        if (categoria.toLowerCase().includes('privada')) {
          if ((row['COMUNITARIA'] || '').trim().toLowerCase() === 'sim') category = 'Comunitária'
          else if ((row['CONFESSIONAL'] || '').trim().toLowerCase() === 'sim') category = 'Confessional'
          else if ((row['FILANTROPICA'] || '').trim().toLowerCase() === 'sim') category = 'Filantrópica'
          else category = 'Privada'
        }

        if (!mecCode || !nome || !uf) {
          result.skipped++
          continue
        }

        const type = mapUniversityType(categoria, orgAcademica, nome)

        const existing = await prisma.university.findUnique({ where: { mecCode } })

        if (existing) {
          await prisma.university.update({
            where: { mecCode },
            data: {
              name: nome,
              sigla,
              type,
              category,
              academicOrg: orgAcademica || null,
              ibgeCode,
              city: municipio || existing.city,
              state: uf || existing.state,
              isActive,
            },
          })
          result.updated++
        } else {
          const baseSlug = slugify(nome)
          const slug = await uniqueSlug(baseSlug)

          await prisma.university.create({
            data: {
              mecCode,
              name: nome,
              sigla,
              slug,
              type,
              category,
              academicOrg: orgAcademica || null,
              ibgeCode,
              city: municipio,
              state: uf,
              isActive,
            },
          })
          result.created++
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        result.errors.push(`[${row['CODIGO_DA_IES']}] ${msg}`)
      }
    }

    return reply.send({
      message: 'Importação concluída',
      total: records.length,
      ...result,
    })
  })

  // ── GET /admin/universities ───────────────────────────────────────────────
  fastify.get('/universities', { preHandler: authenticateAdmin }, async (request) => {
    const query = z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(20),
      q: z.string().optional(),
      state: z.string().optional(),
      type: z.string().optional(),
      active: z.coerce.boolean().optional(),
    }).parse(request.query)

    const skip = (query.page - 1) * query.limit

    const where = {
      ...(query.q ? {
        OR: [
          { name: { contains: query.q, mode: 'insensitive' as const } },
          { sigla: { contains: query.q, mode: 'insensitive' as const } },
          { city: { contains: query.q, mode: 'insensitive' as const } },
        ],
      } : {}),
      ...(query.state ? { state: query.state.toUpperCase() } : {}),
      ...(query.type ? { type: query.type.toUpperCase() as UniversityType } : {}),
      ...(query.active !== undefined ? { isActive: query.active } : {}),
    }

    const [data, total] = await Promise.all([
      prisma.university.findMany({
        where,
        skip,
        take: query.limit,
        select: {
          id: true, slug: true, name: true, sigla: true, mecCode: true,
          type: true, category: true, academicOrg: true,
          city: true, state: true, isActive: true,
          plan: true, createdAt: true,
          _count: { select: { leads: true, courses: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.university.count({ where }),
    ])

    return { data, total, page: query.page, pages: Math.ceil(total / query.limit) }
  })
}
