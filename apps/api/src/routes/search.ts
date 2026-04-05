import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'

export async function searchRoutes(app: FastifyInstance) {
  // ── GET /search ───────────────────────────────────────────────────────────
  app.get('/', async (request) => {
    const {
      q, city, state, modality, shift, degree, type, area,
      prouni, fies, page = '1', limit = '20',
    } = request.query as any

    const skip = (Number(page) - 1) * Number(limit)
    const take = Math.min(Number(limit), 50)

    const universityWhere: any = {}
    if (city)  universityWhere.city  = { contains: city, mode: 'insensitive' }
    if (state) universityWhere.state = state
    if (type)  universityWhere.type  = type

    const include = {
      university: {
        select: { id: true, name: true, slug: true, city: true, state: true, type: true, logoUrl: true, igc: true, plan: true },
      },
      offers: { where: { active: true }, take: 1 },
    }

    // Use explicit AND to avoid Prisma ambiguity when university filter + OR both reference the relation
    const buildWhere = (withQ: boolean) => {
      const conditions: any[] = [
        { active: true },
        ...(modality ? [{ modality }] : []),
        ...(degree   ? [{ degree }]   : []),
        ...(area     ? [{ area: { contains: area, mode: 'insensitive' } }] : []),
        ...(shift    ? [{ shift: { has: shift } }] : []),
      ]

      if (prouni === 'true' || fies === 'true') {
        conditions.push({
          offers: {
            some: {
              active: true,
              ...(prouni === 'true' ? { prouni: true } : {}),
              ...(fies   === 'true' ? { fies:  true } : {}),
            },
          },
        })
      }

      if (Object.keys(universityWhere).length > 0) {
        conditions.push({ university: universityWhere })
      }

      if (withQ && q) {
        conditions.push({
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { area: { contains: q, mode: 'insensitive' } },
          ],
        })
      }

      return conditions.length === 1 ? conditions[0] : { AND: conditions }
    }

    const where = buildWhere(!!q)

    // When searching by name, fetch all matches and sort: exact name first, then by enade desc
    let data: any[]
    let total: number

    if (q) {
      const [allMatches, count] = await Promise.all([
        prisma.course.findMany({ where, include, orderBy: { name: 'asc' } }),
        prisma.course.count({ where }),
      ])
      total = count
      const ql = q.toLowerCase()
      allMatches.sort((a: any, b: any) => {
        const aExact = a.name.toLowerCase() === ql ? 0 : 1
        const bExact = b.name.toLowerCase() === ql ? 0 : 1
        if (aExact !== bExact) return aExact - bExact
        const aStarts = a.name.toLowerCase().startsWith(ql) ? 0 : 1
        const bStarts = b.name.toLowerCase().startsWith(ql) ? 0 : 1
        if (aStarts !== bStarts) return aStarts - bStarts
        // then by enade desc (nulls last)
        const ae = a.enade ?? -1
        const be = b.enade ?? -1
        if (be !== ae) return be - ae
        return a.name.localeCompare(b.name)
      })
      data = allMatches.slice(skip, skip + take)
    } else {
      ;[data, total] = await Promise.all([
        prisma.course.findMany({ where, skip, take, include, orderBy: [{ enade: 'desc' }, { name: 'asc' }] }),
        prisma.course.count({ where }),
      ])
    }

    return { data, meta: { total, page: Number(page), limit: take } }
  })

  // ── GET /search/areas ─────────────────────────────────────────────────────
  app.get('/areas', async (request) => {
    const { q } = request.query as { q?: string }

    const areaWhere: any = { active: true }
    if (q) areaWhere.area = { contains: q, mode: 'insensitive' }

    const areas: any[] = await (prisma.course.groupBy as any)({
      by: ['area'],
      where: areaWhere,
      _count: { area: true },
      orderBy: { _count: { area: 'desc' } },
      take: 60,
    })

    return areas
      .filter((a) => a.area && a.area.trim() && a.area !== 'Geral' && a.area !== 'null')
      .map((a) => ({ area: a.area, count: a._count?.area ?? 0 }))
  })

  // ── GET /search/states ───────────────────────────────────────────────────
  app.get('/states', async () => {
    const rows = await prisma.university.groupBy({
      by: ['state', 'city'],
      where: { isActive: true },
      _count: { _all: true },
      orderBy: [{ state: 'asc' }, { city: 'asc' }],
    })

    // Aggregate: state → { count, cities[] }
    const stateMap: Record<string, { count: number; cities: string[] }> = {}
    for (const row of rows) {
      if (!stateMap[row.state]) stateMap[row.state] = { count: 0, cities: [] }
      stateMap[row.state].count += row._count._all
      if (row.city && !stateMap[row.state].cities.includes(row.city)) {
        stateMap[row.state].cities.push(row.city)
      }
    }

    return Object.entries(stateMap)
      .map(([state, { count, cities }]) => ({ state, count, cities }))
      .sort((a, b) => b.count - a.count)
  })

  // ── GET /search/stats ─────────────────────────────────────────────────────
  app.get('/stats', async () => {
    const [universities, courses] = await Promise.all([
      prisma.university.count({ where: { isActive: true } }),
      prisma.course.count({ where: { active: true } }),
    ])
    return { universities, courses }
  })

  // ── GET /search/autocomplete?q=texto&modo=cursos|universidades ───────────
  app.get('/autocomplete', async (request) => {
    const { q, modo } = request.query as { q?: string; modo?: string }
    const term = (q || '').trim()
    if (term.length < 2) return { suggestions: [] }

    const MODALITIES = [
      { label: 'Presencial', value: 'PRESENCIAL' },
      { label: 'EaD', value: 'EAD' },
      { label: 'Híbrido', value: 'HIBRIDO' },
    ]
    const DEGREES = [
      { label: 'Bacharelado', value: 'BACHARELADO' },
      { label: 'Licenciatura', value: 'LICENCIATURA' },
      { label: 'Tecnólogo', value: 'TECNOLOGO' },
      { label: 'MBA', value: 'MBA' },
      { label: 'Mestrado', value: 'MESTRADO' },
      { label: 'Doutorado', value: 'DOUTORADO' },
    ]
    const STATES = [
      { abbr: 'AC', name: 'Acre' }, { abbr: 'AL', name: 'Alagoas' }, { abbr: 'AP', name: 'Amapá' },
      { abbr: 'AM', name: 'Amazonas' }, { abbr: 'BA', name: 'Bahia' }, { abbr: 'CE', name: 'Ceará' },
      { abbr: 'DF', name: 'Distrito Federal' }, { abbr: 'ES', name: 'Espírito Santo' },
      { abbr: 'GO', name: 'Goiás' }, { abbr: 'MA', name: 'Maranhão' }, { abbr: 'MT', name: 'Mato Grosso' },
      { abbr: 'MS', name: 'Mato Grosso do Sul' }, { abbr: 'MG', name: 'Minas Gerais' },
      { abbr: 'PA', name: 'Pará' }, { abbr: 'PB', name: 'Paraíba' }, { abbr: 'PR', name: 'Paraná' },
      { abbr: 'PE', name: 'Pernambuco' }, { abbr: 'PI', name: 'Piauí' },
      { abbr: 'RJ', name: 'Rio de Janeiro' }, { abbr: 'RN', name: 'Rio Grande do Norte' },
      { abbr: 'RS', name: 'Rio Grande do Sul' }, { abbr: 'RO', name: 'Rondônia' },
      { abbr: 'RR', name: 'Roraima' }, { abbr: 'SC', name: 'Santa Catarina' },
      { abbr: 'SP', name: 'São Paulo' }, { abbr: 'SE', name: 'Sergipe' }, { abbr: 'TO', name: 'Tocantins' },
    ]

    const tl = term.toLowerCase()
    const isUniMode = modo === 'universidades'

    const [cities, courses, universities] = await Promise.all([
      prisma.university.findMany({
        where: { city: { contains: term, mode: 'insensitive' }, isActive: true },
        select: { city: true, state: true },
        distinct: ['city'],
        orderBy: { city: 'asc' },
        take: 5,
      }),
      isUniMode ? Promise.resolve([]) : prisma.course.findMany({
        where: { name: { contains: term, mode: 'insensitive' }, active: true },
        select: { name: true },
        distinct: ['name'],
        orderBy: { name: 'asc' },
        take: 6,
      }),
      prisma.university.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { sigla: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: { name: true, sigla: true, city: true, state: true },
        orderBy: { name: 'asc' },
        take: isUniMode ? 8 : 4,
      }),
    ])

    const suggestions: any[] = [
      ...cities.map(c => ({ type: 'city', label: c.city, sublabel: c.state, value: c.city })),
      ...(isUniMode
        ? universities.map(u => ({ type: 'university', label: u.name, sublabel: u.sigla ? `${u.sigla} · ${u.city}` : u.city, value: u.name }))
        : courses.map(c => ({ type: 'course', label: c.name, value: c.name }))),
      ...(!isUniMode ? universities.map(u => ({ type: 'university', label: u.name, sublabel: u.sigla ? `${u.sigla} · ${u.city}` : u.city, value: u.name })) : []),
      ...MODALITIES.filter(m => m.label.toLowerCase().includes(tl)).map(m => ({ type: 'modality', label: m.label, value: m.label })),
      ...DEGREES.filter(d => d.label.toLowerCase().includes(tl)).map(d => ({ type: 'degree', label: d.label, value: d.label })),
      ...STATES.filter(s => s.name.toLowerCase().includes(tl) || s.abbr.toLowerCase() === tl).slice(0, 2).map(s => ({ type: 'state', label: s.name, sublabel: s.abbr, value: s.abbr })),
    ]

    return { suggestions }
  })
}
