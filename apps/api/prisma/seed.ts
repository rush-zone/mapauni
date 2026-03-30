import { PrismaClient, UniversityType, PlanType, DegreeType, ModalityType, ShiftType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Enable pg_trgm extension for full-text search
  await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS pg_trgm`

  const universities = [
    {
      slug: 'universidade-federal-de-sao-paulo',
      name: 'Universidade Federal de São Paulo',
      type: 'FEDERAL' as UniversityType,
      category: 'Universidade',
      city: 'São Paulo',
      state: 'SP',
      description: 'Uma das principais universidades federais do Brasil, com excelência em pesquisa e ensino.',
      phone: '(11) 3333-1000',
      email: 'contato@unifesp.edu.br',
      website: 'https://www.unifesp.br',
      igc: 4.8,
      ci: 5.0,
      plan: 'PREMIUM' as PlanType,
    },
    {
      slug: 'pontificia-universidade-catolica-sp',
      name: 'Pontifícia Universidade Católica de São Paulo',
      type: 'PRIVADA' as UniversityType,
      category: 'Universidade',
      city: 'São Paulo',
      state: 'SP',
      description: 'Instituição privada de referência com mais de 70 anos de tradição acadêmica.',
      phone: '(11) 3670-8000',
      whatsapp: '(11) 99999-0001',
      email: 'info@pucsp.br',
      website: 'https://www.pucsp.br',
      igc: 4.2,
      ci: 4.0,
      plan: 'PRO' as PlanType,
    },
    {
      slug: 'universidade-estadual-de-campinas',
      name: 'Universidade Estadual de Campinas',
      type: 'ESTADUAL' as UniversityType,
      category: 'Universidade',
      city: 'Campinas',
      state: 'SP',
      description: 'UNICAMP — referência nacional em ciência, tecnologia e inovação.',
      phone: '(19) 3521-7000',
      email: 'contato@unicamp.br',
      website: 'https://www.unicamp.br',
      igc: 5.0,
      ci: 5.0,
      plan: 'PREMIUM' as PlanType,
    },
    {
      slug: 'universidade-anhembi-morumbi',
      name: 'Universidade Anhembi Morumbi',
      type: 'PRIVADA' as UniversityType,
      category: 'Universidade',
      city: 'São Paulo',
      state: 'SP',
      description: 'Universidade privada com foco em carreiras criativas, tecnologia e negócios.',
      phone: '(11) 3847-3000',
      whatsapp: '(11) 99999-0002',
      email: 'contato@anhembi.br',
      website: 'https://www.anhembi.br',
      igc: 3.5,
      ci: 3.0,
      plan: 'PREMIUM' as PlanType,
    },
    {
      slug: 'universidade-federal-do-rio-de-janeiro',
      name: 'Universidade Federal do Rio de Janeiro',
      type: 'FEDERAL' as UniversityType,
      category: 'Universidade',
      city: 'Rio de Janeiro',
      state: 'RJ',
      description: 'UFRJ — maior universidade federal do Brasil, referência em pesquisa e pós-graduação.',
      phone: '(21) 3938-9100',
      email: 'reitoria@ufrj.br',
      website: 'https://ufrj.br',
      igc: 4.9,
      ci: 5.0,
      plan: 'PREMIUM' as PlanType,
    },
  ]

  const createdUniversities: any[] = []

  for (const uni of universities) {
    const created = await prisma.university.upsert({
      where: { slug: uni.slug },
      update: {},
      create: uni,
    })
    createdUniversities.push(created)
    console.log(`University created: ${created.name}`)
  }

  // Courses for UNIFESP
  const unifesp = createdUniversities[0]
  const coursesUnifesp = [
    {
      slug: 'medicina-unifesp',
      name: 'Medicina',
      area: 'Saúde',
      subArea: 'Medicina',
      degree: 'BACHARELADO' as DegreeType,
      modality: 'PRESENCIAL' as ModalityType,
      shift: ['INTEGRAL'] as ShiftType[],
      duration: 12,
      enade: 4.9,
      universityId: unifesp.id,
      description: 'Curso de Medicina com excelente infraestrutura e corpo docente altamente qualificado.',
    },
    {
      slug: 'enfermagem-unifesp',
      name: 'Enfermagem',
      area: 'Saúde',
      degree: 'BACHARELADO' as DegreeType,
      modality: 'PRESENCIAL' as ModalityType,
      shift: ['INTEGRAL'] as ShiftType[],
      duration: 8,
      enade: 4.5,
      universityId: unifesp.id,
    },
  ]

  // Courses for PUC-SP
  const pucsp = createdUniversities[1]
  const coursesPucsp = [
    {
      slug: 'direito-pucsp',
      name: 'Direito',
      area: 'Ciências Sociais Aplicadas',
      degree: 'BACHARELADO' as DegreeType,
      modality: 'PRESENCIAL' as ModalityType,
      shift: ['MANHA', 'NOITE'] as ShiftType[],
      duration: 10,
      priceMonthly: 3200,
      enade: 4.2,
      universityId: pucsp.id,
    },
    {
      slug: 'administracao-pucsp',
      name: 'Administração',
      area: 'Ciências Sociais Aplicadas',
      degree: 'BACHARELADO' as DegreeType,
      modality: 'PRESENCIAL' as ModalityType,
      shift: ['MANHA', 'TARDE', 'NOITE'] as ShiftType[],
      duration: 8,
      priceMonthly: 2100,
      enade: 3.8,
      universityId: pucsp.id,
    },
    {
      slug: 'psicologia-pucsp',
      name: 'Psicologia',
      area: 'Ciências Humanas',
      degree: 'BACHARELADO' as DegreeType,
      modality: 'PRESENCIAL' as ModalityType,
      shift: ['MANHA', 'NOITE'] as ShiftType[],
      duration: 10,
      priceMonthly: 2800,
      enade: 4.0,
      universityId: pucsp.id,
    },
  ]

  // Courses for UNICAMP
  const unicamp = createdUniversities[2]
  const coursesUnicamp = [
    {
      slug: 'engenharia-computacao-unicamp',
      name: 'Engenharia de Computação',
      area: 'Exatas',
      degree: 'BACHARELADO' as DegreeType,
      modality: 'PRESENCIAL' as ModalityType,
      shift: ['INTEGRAL'] as ShiftType[],
      duration: 10,
      enade: 5.0,
      universityId: unicamp.id,
    },
    {
      slug: 'ciencia-da-computacao-unicamp',
      name: 'Ciência da Computação',
      area: 'Exatas',
      degree: 'BACHARELADO' as DegreeType,
      modality: 'PRESENCIAL' as ModalityType,
      shift: ['INTEGRAL'] as ShiftType[],
      duration: 8,
      enade: 4.9,
      universityId: unicamp.id,
    },
  ]

  // Courses for Anhembi
  const anhembi = createdUniversities[3]
  const coursesAnhembi = [
    {
      slug: 'design-grafico-anhembi',
      name: 'Design Gráfico',
      area: 'Artes e Design',
      degree: 'BACHARELADO' as DegreeType,
      modality: 'PRESENCIAL' as ModalityType,
      shift: ['MANHA', 'NOITE'] as ShiftType[],
      duration: 8,
      priceMonthly: 1800,
      enade: 3.5,
      universityId: anhembi.id,
    },
    {
      slug: 'marketing-anhembi',
      name: 'Marketing',
      area: 'Ciências Sociais Aplicadas',
      degree: 'BACHARELADO' as DegreeType,
      modality: 'EAD' as ModalityType,
      shift: ['NOITE'] as ShiftType[],
      duration: 8,
      priceMonthly: 890,
      enade: 3.2,
      universityId: anhembi.id,
    },
  ]

  // Courses for UFRJ
  const ufrj = createdUniversities[4]
  const coursesUfrj = [
    {
      slug: 'engenharia-civil-ufrj',
      name: 'Engenharia Civil',
      area: 'Exatas',
      degree: 'BACHARELADO' as DegreeType,
      modality: 'PRESENCIAL' as ModalityType,
      shift: ['INTEGRAL'] as ShiftType[],
      duration: 10,
      enade: 4.7,
      universityId: ufrj.id,
    },
    {
      slug: 'arquitetura-ufrj',
      name: 'Arquitetura e Urbanismo',
      area: 'Exatas',
      degree: 'BACHARELADO' as DegreeType,
      modality: 'PRESENCIAL' as ModalityType,
      shift: ['INTEGRAL'] as ShiftType[],
      duration: 10,
      enade: 4.5,
      universityId: ufrj.id,
    },
  ]

  const allCourses = [
    ...coursesUnifesp,
    ...coursesPucsp,
    ...coursesUnicamp,
    ...coursesAnhembi,
    ...coursesUfrj,
  ]

  for (const course of allCourses) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      update: {},
      create: course,
    })
    console.log(`Course created: ${course.name}`)
  }

  // Create offers for courses with prices
  const paidCourses = await prisma.course.findMany({
    where: { priceMonthly: { not: null } },
  })

  for (const course of paidCourses) {
    await prisma.offer.upsert({
      where: { id: `offer-${course.id}` },
      update: {},
      create: {
        id: `offer-${course.id}`,
        courseId: course.id,
        semester: '2025.2',
        vacancies: 40,
        enrolled: Math.floor(Math.random() * 30),
        priceMonthly: course.priceMonthly,
        prouni: Math.random() > 0.5,
        fies: Math.random() > 0.5,
        enrollStart: new Date('2025-07-01'),
        enrollEnd: new Date('2025-08-15'),
        active: true,
      },
    })
  }

  // Create admin user for PUC-SP
  const passwordHash = await bcrypt.hash('admin123', 10)
  await prisma.universityUser.upsert({
    where: { email: 'admin@pucsp.br' },
    update: {},
    create: {
      email: 'admin@pucsp.br',
      name: 'Admin PUC-SP',
      passwordHash,
      role: 'OWNER',
      universityId: pucsp.id,
    },
  })

  await prisma.universityUser.upsert({
    where: { email: 'admin@anhembi.br' },
    update: {},
    create: {
      email: 'admin@anhembi.br',
      name: 'Admin Anhembi',
      passwordHash,
      role: 'OWNER',
      universityId: anhembi.id,
    },
  })

  console.log('Seed completed!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
