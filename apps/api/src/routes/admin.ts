import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { parse } from 'csv-parse'
import { Readable } from 'stream'
import { prisma } from '../lib/prisma'
import { authenticateAdmin } from '../middlewares/adminAuth.middleware'
import { UniversityType, ModalityType, DegreeType } from '@prisma/client'

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

function decodeCSV(buf: Buffer): string {
  return buf.toString('utf8')
}

function normalizeKey(key: string): string {
  return key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()
}

function col(row: Record<string, string>, key: string): string {
  if (row[key] !== undefined) return (row[key] || '').trim()
  const nk = normalizeKey(key)
  const found = Object.keys(row).find((k) => normalizeKey(k) === nk)
  return found ? (row[found] || '').trim() : ''
}

function mapUniversityType(categoria: string, orgAcademica: string, nome: string): UniversityType {
  const cat = categoria.trim().toLowerCase()
  const org = orgAcademica.trim().toLowerCase()
  const n = nome.trim().toLowerCase()
  if (cat.includes('privada')) return UniversityType.PRIVADA
  if (org.includes('federal') || n.includes('federal')) return UniversityType.FEDERAL
  if (org.includes('estadual') || n.includes('estadual')) return UniversityType.ESTADUAL
  if (org.includes('municipal') || n.includes('municipal')) return UniversityType.MUNICIPAL
  return UniversityType.FEDERAL
}

function mapGrau(grau: string): DegreeType {
  const g = grau.toLowerCase()
  if (g.includes('licenciatura')) return DegreeType.LICENCIATURA
  if (g.includes('tecno')) return DegreeType.TECNOLOGO
  if (g.includes('mba')) return DegreeType.MBA
  if (g.includes('mestrado')) return DegreeType.MESTRADO
  if (g.includes('doutorado')) return DegreeType.DOUTORADO
  if (g.includes('p') && g.includes('gradua')) return DegreeType.POS_GRADUACAO
  return DegreeType.BACHARELADO
}

function mapModalidade(modalidade: string): ModalityType {
  const m = modalidade.toLowerCase()
  if (m.includes('ead') || m.includes('distância') || m.includes('distancia')) return ModalityType.EAD
  if (m.includes('híbrido') || m.includes('hibrido')) return ModalityType.HIBRIDO
  return ModalityType.PRESENCIAL
}

/** Parseia CSV como stream e retorna array de records, tolerando linhas malformadas */
async function parseCSV(buf: Buffer): Promise<{ records: Record<string, string>[]; detectedColumns: string[]; parseErrors: number }> {
  return new Promise((resolve) => {
    const records: Record<string, string>[] = []
    let detectedColumns: string[] = []
    let parseErrors = 0

    const text = decodeCSV(buf)
    parse(
      text,
      {
        columns: true,
        delimiter: ',',
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true,
        bom: true,
      },
      (err, data: Record<string, string>[]) => {
        if (err) { parseErrors++; }
        if (data?.length) {
          detectedColumns = Object.keys(data[0])
          records.push(...data)
        }
        resolve({ records, detectedColumns, parseErrors })
      }
    )
  })
}

/** Upsert em lote das universidades (batch de 500) */
async function batchUpsertUniversities(records: Record<string, string>[]) {
  const result = { created: 0, updated: 0, skipped: 0, errors: [] as string[] }

  // Carrega mecCodes existentes uma vez
  const existingMap = new Map<string, string>() // mecCode → id
  const allExisting = await prisma.university.findMany({ select: { id: true, mecCode: true, city: true, state: true } })
  for (const u of allExisting) {
    if (u.mecCode) existingMap.set(u.mecCode, u.id)
  }

  // Processa em lotes
  const BATCH = 500
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH)
    const toCreate: any[] = []
    const toUpdate: { mecCode: string; data: any }[] = []

    for (const row of batch) {
      try {
        const mecCode = col(row, 'CODIGO_DA_IES')
        const nome = col(row, 'NOME_DA_IES')
        const uf = col(row, 'UF')
        if (!mecCode || !nome || !uf) { result.skipped++; continue }

        const situacao = col(row, 'SITUACAO_IES').toLowerCase()
        const isActive = situacao === 'ativa' || situacao === 'em atividade'
        const categoria = col(row, 'CATEGORIA_DA_IES')
        const orgAcademica = col(row, 'ORGANIZACAO_ACADEMICA')
        const municipio = col(row, 'MUNICIPIO')

        let category: string | null = null
        if (categoria.toLowerCase().includes('privada')) {
          if (col(row, 'COMUNITARIA').toLowerCase() === 'sim') category = 'Comunitária'
          else if (col(row, 'CONFESSIONAL').toLowerCase() === 'sim') category = 'Confessional'
          else if (col(row, 'FILANTROPICA').toLowerCase() === 'sim') category = 'Filantrópica'
          else category = 'Privada'
        }

        const type = mapUniversityType(categoria, orgAcademica, nome)
        const data = {
          name: nome,
          sigla: col(row, 'SIGLA') || null,
          type, category,
          academicOrg: orgAcademica || null,
          ibgeCode: col(row, 'CODIGO_MUNICIPIO_IBGE') || null,
          city: municipio,
          state: uf,
          isActive,
        }

        if (existingMap.has(mecCode)) {
          toUpdate.push({ mecCode, data })
          result.updated++
        } else {
          const slug = slugify(nome) + '-' + mecCode
          toCreate.push({ mecCode, slug, ...data })
          existingMap.set(mecCode, slug) // evita slug duplicado dentro do lote
          result.created++
        }
      } catch (err) {
        result.errors.push(`[${col(row, 'CODIGO_DA_IES')}] ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    // Cria novos em lote
    if (toCreate.length > 0) {
      await prisma.university.createMany({ data: toCreate as any[], skipDuplicates: true })
    }

    // Atualiza existentes em paralelo (chunked)
    if (toUpdate.length > 0) {
      await Promise.all(
        toUpdate.map((u) => prisma.university.update({ where: { mecCode: u.mecCode }, data: u.data }))
      )
    }
  }

  return result
}

/** Importa cursos do CSV e-MEC → CursoAutorizadoEmec + Course */
async function batchImportCourses(records: Record<string, string>[]) {
  const result = { created: 0, updated: 0, skipped: 0, errors: [] as string[] }

  // Map mecCode → universityId
  const uniMap = new Map<string, string>()
  const allUnis = await prisma.university.findMany({ select: { id: true, mecCode: true } })
  for (const u of allUnis) {
    if (u.mecCode) uniMap.set(u.mecCode, u.id)
  }

  // Map (universityId + codigoEmec) → CursoAutorizadoEmec.id já existente
  const existingCursos = await prisma.cursoAutorizadoEmec.findMany({ select: { id: true, universityId: true, codigoEmec: true } })
  const cursoMap = new Map<string, string>() // `${universityId}:${codigoEmec}` → id
  for (const c of existingCursos) {
    if (c.codigoEmec) cursoMap.set(`${c.universityId}:${c.codigoEmec}`, c.id)
  }

  // Map (universityId + slug) → Course.id já existente
  const existingCourses = await prisma.course.findMany({ select: { id: true, universityId: true, mecCode: true } })
  const courseMap = new Map<string, string>() // `${universityId}:${mecCode}` → id
  for (const c of existingCourses) {
    if (c.mecCode) courseMap.set(`${c.universityId}:${c.mecCode}`, c.id)
  }

  const BATCH = 200
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH)

    for (const row of batch) {
      try {
        const codigoIES = col(row, 'CODIGO_DA_IES') || col(row, 'CO_IES')
        const codigoCurso = col(row, 'CODIGO_DO_CURSO') || col(row, 'CO_CURSO')
        const nomeCurso = col(row, 'NOME_DO_CURSO') || col(row, 'NO_CURSO')
        const grauRaw = col(row, 'GRAU') || col(row, 'GRAU_ACADEMICO') || col(row, 'DS_GRAU_ACADEMICO')
        const modalidadeRaw = col(row, 'MODALIDADE_DE_ENSINO') || col(row, 'MODALIDADE') || col(row, 'DS_MODALIDADE')
        const municipio = col(row, 'MUNICIPIO') || col(row, 'NO_MUNICIPIO')
        const uf = col(row, 'UF') || col(row, 'SG_UF')
        const situacao = col(row, 'SITUACAO') || col(row, 'SITUACAO_DO_CURSO') || col(row, 'DS_SITUACAO_CURSO')
        const vagasStr = col(row, 'VAGAS_AUTORIZADAS') || col(row, 'QT_VAGAS_AUTORIZADAS') || ''
        const cpcStr = col(row, 'CPC') || col(row, 'CONCEITO_CURSO') || col(row, 'CPC_CONTINUO') || ''

        if (!codigoIES || !nomeCurso) { result.skipped++; continue }

        const universityId = uniMap.get(codigoIES)
        if (!universityId) { result.skipped++; continue }

        const grau = mapGrau(grauRaw)
        const modalidade = mapModalidade(modalidadeRaw)
        const vagas = vagasStr ? parseInt(vagasStr.replace(/\D/g, '')) || null : null
        const conceito = cpcStr ? parseFloat(cpcStr.replace(',', '.')) || null : null
        const isAtivo = !situacao || situacao.toLowerCase().includes('atividade') || situacao.toLowerCase() === 'ativo'

        const cursoKey = `${universityId}:${codigoCurso}`
        const courseKey = `${universityId}:${codigoCurso}`

        // Upsert CursoAutorizadoEmec
        if (cursoMap.has(cursoKey)) {
          await prisma.cursoAutorizadoEmec.update({
            where: { id: cursoMap.get(cursoKey)! },
            data: { nome: nomeCurso, grau: grauRaw, modalidade: modalidadeRaw, municipio, uf, situacao, vagas, conceito, emecSyncedAt: new Date() },
          })
        } else {
          const novo = await prisma.cursoAutorizadoEmec.create({
            data: { universityId, codigoEmec: codigoCurso, nome: nomeCurso, grau: grauRaw, modalidade: modalidadeRaw, municipio, uf, situacao, vagas, conceito, emecSyncedAt: new Date() },
          })
          cursoMap.set(cursoKey, novo.id)
        }

        // Upsert Course (catálogo da plataforma)
        const baseSlug = slugify(nomeCurso)
        if (courseMap.has(courseKey)) {
          await prisma.course.update({
            where: { id: courseMap.get(courseKey)! },
            data: {
              name: nomeCurso,
              degree: grau,
              modality: modalidade,
              area: grauRaw || 'Geral',
              active: isAtivo,
              enade: conceito,
            },
          })
          result.updated++
        } else {
          // Garante slug único
          const slug = `${baseSlug}-${codigoCurso || Math.random().toString(36).slice(2, 7)}`
          try {
            const novoCourse = await prisma.course.create({
              data: {
                universityId,
                mecCode: codigoCurso || null,
                name: nomeCurso,
                slug,
                degree: grau,
                modality: modalidade,
                shift: [],
                area: grauRaw || 'Geral',
                duration: 8,
                active: isAtivo,
                enade: conceito,
              },
            })
            courseMap.set(courseKey, novoCourse.id)
            result.created++
          } catch {
            // slug duplicado — tenta com sufixo aleatório
            const slugAlt = `${baseSlug}-${Date.now()}`
            const novoCourse = await prisma.course.create({
              data: {
                universityId,
                mecCode: codigoCurso || null,
                name: nomeCurso,
                slug: slugAlt,
                degree: grau,
                modality: modalidade,
                shift: [],
                area: grauRaw || 'Geral',
                duration: 8,
                active: isAtivo,
                enade: conceito,
              },
            })
            courseMap.set(courseKey, novoCourse.id)
            result.created++
          }
        }
      } catch (err) {
        result.errors.push(`[${col(row, 'CODIGO_DO_CURSO')}] ${err instanceof Error ? err.message : String(err)}`)
        if (result.errors.length >= 50) result.errors.push('... erros truncados após 50')
      }
    }
  }

  return result
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
  fastify.post('/import/universities', { preHandler: authenticateAdmin }, async (request, reply) => {
    const file = await request.file()
    if (!file) return reply.status(400).send({ message: 'Arquivo CSV não enviado' })

    const chunks: Buffer[] = []
    for await (const chunk of file.file) chunks.push(chunk as Buffer)
    const buf = Buffer.concat(chunks)

    const { records, detectedColumns, parseErrors } = await parseCSV(buf)

    if (records.length === 0) {
      return reply.status(400).send({ message: 'Nenhum registro encontrado no CSV', detectedColumns })
    }

    const result = await batchUpsertUniversities(records)

    return reply.send({
      message: 'Importação concluída',
      total: records.length,
      parseErrors,
      ...result,
      detectedColumns,
    })
  })

  // ── POST /admin/import/courses ────────────────────────────────────────────
  fastify.post('/import/courses', { preHandler: authenticateAdmin }, async (request, reply) => {
    const file = await request.file()
    if (!file) return reply.status(400).send({ message: 'Arquivo CSV não enviado' })

    const chunks: Buffer[] = []
    for await (const chunk of file.file) chunks.push(chunk as Buffer)
    const buf = Buffer.concat(chunks)

    const { records, detectedColumns, parseErrors } = await parseCSV(buf)

    if (records.length === 0) {
      return reply.status(400).send({ message: 'Nenhum registro encontrado no CSV', detectedColumns })
    }

    const result = await batchImportCourses(records)

    return reply.send({
      message: 'Importação de cursos concluída',
      total: records.length,
      parseErrors,
      ...result,
      detectedColumns,
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
