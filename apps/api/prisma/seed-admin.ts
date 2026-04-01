/**
 * Cria o usuário Admin Master inicial.
 * Uso: pnpm tsx prisma/seed-admin.ts
 *
 * Altere EMAIL e PASSWORD antes de rodar em produção.
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const EMAIL = process.env.ADMIN_EMAIL || 'admin@infouri.com.br'
const PASSWORD = process.env.ADMIN_PASSWORD || 'InfoUni@2026!'
const NAME = process.env.ADMIN_NAME || 'Admin Master'

async function main() {
  const exists = await prisma.adminUser.findUnique({ where: { email: EMAIL } })
  if (exists) {
    console.log(`Admin já existe: ${EMAIL}`)
    return
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 12)
  const admin = await prisma.adminUser.create({ data: { email: EMAIL, name: NAME, passwordHash } })
  console.log(`Admin criado: ${admin.email} (id: ${admin.id})`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
