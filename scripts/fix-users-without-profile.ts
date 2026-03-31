/**
 * Script para corrigir usuários sem profile
 *
 * Este script cria profiles para todos os usuários que não têm um.
 */

import { prisma } from '../lib/db/prisma';

async function fixUsersWithoutProfile() {
  console.log('🔧 Iniciando correção de usuários sem profile...\n');

  // Buscar usuários sem profile
  const usersWithoutProfile = await prisma.user.findMany({
    where: {
      profile: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  console.log(`📊 Encontrados ${usersWithoutProfile.length} usuários sem profile\n`);

  if (usersWithoutProfile.length === 0) {
    console.log('✅ Nenhum usuário sem profile encontrado!');
    return;
  }

  let fixed = 0;
  let errors = 0;

  for (const user of usersWithoutProfile) {
    try {
      await prisma.userProfile.create({
        data: {
          userId: user.id,
          totalPoints: 0,
          level: 1,
          streak: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          dailyGoal: 20,
        },
      });

      console.log(`✅ Profile criado para: ${user.email}`);
      fixed++;
    } catch (error: any) {
      console.error(`❌ Erro ao criar profile para ${user.email}:`, error.message);
      errors++;
    }
  }

  console.log('\n📈 Resultado:');
  console.log(`   Corrigidos: ${fixed}`);
  console.log(`   Erros: ${errors}`);
  console.log('\n✅ Correção concluída!');
}

fixUsersWithoutProfile()
  .catch((error) => {
    console.error('❌ Erro ao executar correção:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
