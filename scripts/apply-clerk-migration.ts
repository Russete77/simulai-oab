import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Aplicando migração para Clerk...')

  try {
    // Adicionar coluna clerkId
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clerkId" TEXT;
    `)
    console.log('✅ Coluna clerkId adicionada')

    // Tornar supabaseId opcional
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ALTER COLUMN "supabaseId" DROP NOT NULL;
    `)
    console.log('✅ Campo supabaseId agora é opcional')

    // Criar índice para clerkId
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "User_clerkId_idx" ON "User"("clerkId");
    `)
    console.log('✅ Índice criado para clerkId')

    // Verificar se há valores nulos antes de adicionar constraint unique
    const nullCount = await prisma.$queryRaw<Array<{count: bigint}>>`
      SELECT COUNT(*) as count FROM "User" WHERE "clerkId" IS NULL
    `

    if (Number(nullCount[0].count) === 0) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "User" ADD CONSTRAINT "User_clerkId_key" UNIQUE ("clerkId");
      `)
      console.log('✅ Constraint unique adicionada para clerkId')
    } else {
      console.log(`⚠️  Existem ${nullCount[0].count} usuários sem clerkId. Constraint unique não foi adicionada.`)
      console.log('   Execute este comando manualmente após migrar todos os usuários:')
      console.log('   ALTER TABLE "User" ADD CONSTRAINT "User_clerkId_key" UNIQUE ("clerkId");')
    }

    console.log('\n✅ Migração concluída com sucesso!')
  } catch (error: any) {
    console.error('❌ Erro ao aplicar migração:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
