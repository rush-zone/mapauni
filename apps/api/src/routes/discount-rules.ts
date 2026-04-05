import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middlewares/auth.middleware'
import { authenticateAdmin } from '../middlewares/adminAuth.middleware'

const ruleSchema = z.object({
  courseId: z.string().optional().nullable(),
  scoreMin: z.number().min(0).max(1000),
  scoreMax: z.number().min(0).max(1000).optional().nullable(),
  discountPercent: z.number().min(1).max(100),
  modalityRestriction: z.enum(['PRESENCIAL', 'EAD', 'HIBRIDO']).optional().nullable(),
  vacanciesLimit: z.number().int().positive().optional().nullable(),
  validFrom: z.string(),
  validUntil: z.string().optional().nullable(),
})

export async function discountRuleRoutes(fastify: FastifyInstance) {

  // ── POST /discount/calculate — calcula desconto para nota ENEM (público) ──
  fastify.post('/calculate', async (request, reply) => {
    const { enemScore, courseId, universityId } = z.object({
      enemScore: z.number().min(0).max(1000),
      courseId: z.string(),
      universityId: z.string(),
    }).parse(request.body)

    const now = new Date()

    const candidates = await prisma.discountRule.findMany({
      where: {
        universityId,
        active: true,
        scoreMin: { lte: enemScore },
        OR: [{ scoreMax: null }, { scoreMax: { gte: enemScore } }],
        AND: [
          { OR: [{ courseId: null }, { courseId }] },
          { validFrom: { lte: now } },
          { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
        ],
      },
      orderBy: { discountPercent: 'desc' },
    })
    // Filtra regras que ainda têm vagas disponíveis (Prisma não compara colunas diretamente)
    const rule = candidates.find(r => r.vacanciesLimit == null || r.vacanciesUsed < r.vacanciesLimit) ?? null

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    const priceOriginal = course?.priceMonthly ?? null

    if (!rule) return { eligible: false, discountPercent: 0, priceOriginal, priceFinal: priceOriginal }

    const priceFinal = priceOriginal != null
      ? Math.round(priceOriginal * (1 - rule.discountPercent / 100) * 100) / 100
      : null

    return {
      eligible: true,
      discountRuleId: rule.id,
      discountPercent: rule.discountPercent,
      priceOriginal,
      priceFinal,
      validUntil: rule.validUntil,
    }
  })

  // ── GET /universities/:slug/discounts — descontos públicos de uma uni ──────
  fastify.get('/university/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const university = await prisma.university.findUnique({ where: { slug } })
    if (!university) return reply.status(404).send({ error: 'Universidade não encontrada' })

    const now = new Date()
    const rules = await prisma.discountRule.findMany({
      where: {
        universityId: university.id,
        active: true,
        validFrom: { lte: now },
        OR: [{ validUntil: null }, { validUntil: { gte: now } }],
      },
      include: { course: { select: { id: true, name: true, degree: true, modality: true } } },
      orderBy: { scoreMin: 'asc' },
    })

    // Agrupa por faixa para exibição pública (sem expor detalhes internos)
    return rules.map(r => ({
      faixaLabel: r.scoreMax ? `${r.scoreMin}–${r.scoreMax} pontos` : `${r.scoreMin}+ pontos`,
      discountPercent: r.discountPercent,
      modalityRestriction: r.modalityRestriction,
      validUntil: r.validUntil,
      course: r.course ?? null,
    }))
  })

  // ── GET /discount-rules — lista regras da universidade autenticada ─────────
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    const payload = request.user as any
    const rules = await prisma.discountRule.findMany({
      where: { universityId: payload.universityId },
      include: { course: { select: { id: true, name: true, degree: true } } },
      orderBy: [{ active: 'desc' }, { scoreMin: 'asc' }],
    })
    return rules
  })

  // ── POST /discount-rules — cria nova regra ────────────────────────────────
  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    const payload = request.user as any
    const body = ruleSchema.parse(request.body)

    // Verifica se o curso pertence à universidade (se especificado)
    if (body.courseId) {
      const course = await prisma.course.findUnique({ where: { id: body.courseId } })
      if (!course || course.universityId !== payload.universityId) {
        return reply.status(403).send({ error: 'Curso não pertence à sua universidade' })
      }
    }

    const rule = await prisma.discountRule.create({
      data: {
        universityId: payload.universityId,
        courseId: body.courseId ?? null,
        scoreMin: body.scoreMin,
        scoreMax: body.scoreMax ?? null,
        discountPercent: body.discountPercent,
        modalityRestriction: (body.modalityRestriction as any) ?? null,
        vacanciesLimit: body.vacanciesLimit ?? null,
        validFrom: new Date(body.validFrom),
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        active: false, // aguarda aprovação do admin
      },
      include: { course: { select: { id: true, name: true } } },
    })
    return reply.status(201).send(rule)
  })

  // ── PATCH /discount-rules/:id — edita regra ───────────────────────────────
  fastify.patch('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const payload = request.user as any
    const body = ruleSchema.partial().parse(request.body)

    const rule = await prisma.discountRule.findUnique({ where: { id } })
    if (!rule) return reply.status(404).send({ error: 'Regra não encontrada' })
    if (rule.universityId !== payload.universityId) return reply.status(403).send({ error: 'Forbidden' })

    const updated = await prisma.discountRule.update({
      where: { id },
      data: {
        ...body,
        scoreMax: body.scoreMax ?? null,
        modalityRestriction: (body.modalityRestriction as any) ?? undefined,
        vacanciesLimit: body.vacanciesLimit ?? null,
        validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        // Qualquer edição volta para pendente
        active: false,
        approvedAt: null,
        approvedBy: null,
      },
      include: { course: { select: { id: true, name: true } } },
    })
    return updated
  })

  // ── DELETE /discount-rules/:id ────────────────────────────────────────────
  fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const payload = request.user as any

    const rule = await prisma.discountRule.findUnique({ where: { id } })
    if (!rule) return reply.status(404).send({ error: 'Regra não encontrada' })
    if (rule.universityId !== payload.universityId) return reply.status(403).send({ error: 'Forbidden' })

    await prisma.discountRule.delete({ where: { id } })
    return { success: true }
  })

  // ── PATCH /discount-rules/:id/toggle — ativa ou pausa (só se aprovada) ────
  fastify.patch('/:id/toggle', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const payload = request.user as any

    const rule = await prisma.discountRule.findUnique({ where: { id } })
    if (!rule) return reply.status(404).send({ error: 'Regra não encontrada' })
    if (rule.universityId !== payload.universityId) return reply.status(403).send({ error: 'Forbidden' })
    if (!rule.approvedAt && !rule.active) {
      return reply.status(400).send({ error: 'Regra ainda não aprovada pelo admin' })
    }

    const updated = await prisma.discountRule.update({
      where: { id },
      data: { active: !rule.active },
    })
    return updated
  })

  // ── GET /discount-rules/:id/usage — vagas usadas vs limite ───────────────
  fastify.get('/:id/usage', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const payload = request.user as any

    const rule = await prisma.discountRule.findUnique({ where: { id } })
    if (!rule) return reply.status(404).send({ error: 'Regra não encontrada' })
    if (rule.universityId !== payload.universityId) return reply.status(403).send({ error: 'Forbidden' })

    return {
      vacanciesUsed: rule.vacanciesUsed,
      vacanciesLimit: rule.vacanciesLimit,
      remaining: rule.vacanciesLimit != null ? rule.vacanciesLimit - rule.vacanciesUsed : null,
    }
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // ADMIN MASTER
  // ─────────────────────────────────────────────────────────────────────────────

  // ── GET /discount-rules/admin/all — todas as regras ───────────────────────
  fastify.get('/admin/all', { preHandler: authenticateAdmin }, async (request, reply) => {
    const { pending } = request.query as { pending?: string }
    const rules = await prisma.discountRule.findMany({
      where: pending === 'true' ? { active: false, approvedAt: null } : undefined,
      include: {
        university: { select: { id: true, name: true, slug: true } },
        course: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return rules
  })

  // ── PATCH /discount-rules/admin/:id/approve ───────────────────────────────
  fastify.patch('/admin/:id/approve', { preHandler: authenticateAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const payload = request.user as any

    const rule = await prisma.discountRule.findUnique({ where: { id } })
    if (!rule) return reply.status(404).send({ error: 'Regra não encontrada' })

    const updated = await prisma.discountRule.update({
      where: { id },
      data: { active: true, approvedAt: new Date(), approvedBy: payload.id },
    })
    return updated
  })

  // ── PATCH /discount-rules/admin/:id/reject ────────────────────────────────
  fastify.patch('/admin/:id/reject', { preHandler: authenticateAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    // Mantém inactive, apenas registra que foi revisado (pode ser deletado pela uni)
    const rule = await prisma.discountRule.findUnique({ where: { id } })
    if (!rule) return reply.status(404).send({ error: 'Regra não encontrada' })

    // Retorna com campo informativo — uni deverá recriar ou editar
    return { id, rejected: true, message: 'Regra rejeitada pelo admin' }
  })

  // ── GET /discount-rules/admin/compare — comparativo interno ──────────────
  fastify.get('/admin/compare', { preHandler: authenticateAdmin }, async (request, reply) => {
    const { courseName } = request.query as { courseName?: string }

    const rules = await prisma.discountRule.findMany({
      where: {
        active: true,
        ...(courseName && {
          OR: [
            { course: { name: { contains: courseName, mode: 'insensitive' } } },
            { courseId: null },
          ],
        }),
      },
      include: {
        university: { select: { name: true, slug: true, plan: true } },
        course: { select: { name: true } },
      },
      orderBy: [{ discountPercent: 'desc' }, { scoreMin: 'asc' }],
    })
    return rules
  })
}
