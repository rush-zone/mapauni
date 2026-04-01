const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const EMAIL = process.env.ADMIN_EMAIL || 'admin@infouri.com.br'
const PASSWORD = process.env.ADMIN_PASSWORD || 'InfoUni@2026!'
const NAME = process.env.ADMIN_NAME || 'Admin Master'

const prisma = new PrismaClient()

async function main() {
  const exists = await prisma.adminUser.findUnique({ where: { email: EMAIL } })
  if (exists) {
    console.log(`[seed-admin] Admin já existe: ${EMAIL}`)
    return
  }
  const passwordHash = await bcrypt.hash(PASSWORD, 12)
  const admin = await prisma.adminUser.create({ data: { email: EMAIL, name: NAME, passwordHash } })
  console.log(`[seed-admin] Admin criado: ${admin.email}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
