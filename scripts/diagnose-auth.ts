/**
 * Script de diagnóstico de autenticação
 *
 * Este script verifica:
 * 1. Usuários no Prisma sem profile
 * 2. Conflitos de email/supabaseId
 * 3. Usuários órfãos
 */

import { prisma } from '../lib/db/prisma';

async function diagnose() {
  console.log('🔍 Iniciando diagnóstico de autenticação...\n');

  // 1. Verificar usuários sem profile
  const usersWithoutProfile = await prisma.user.findMany({
    where: {
      profile: null,
    },
    select: {
      id: true,
      email: true,
      supabaseId: true,
      createdAt: true,
    },
  });

  console.log(`📊 Usuários sem profile: ${usersWithoutProfile.length}`);
  if (usersWithoutProfile.length > 0) {
    console.log('   Detalhes:');
    usersWithoutProfile.forEach((user) => {
      console.log(`   - ${user.email} (supabaseId: ${user.supabaseId})`);
    });
    console.log('');
  }

  // 2. Verificar conflitos de email
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      supabaseId: true,
    },
  });

  const emailMap = new Map<string, typeof allUsers>();
  allUsers.forEach((user) => {
    const existing = emailMap.get(user.email) || [];
    existing.push(user);
    emailMap.set(user.email, existing);
  });

  const duplicateEmails = Array.from(emailMap.entries()).filter(([_, users]) => users.length > 1);
  console.log(`📧 Emails duplicados: ${duplicateEmails.length}`);
  if (duplicateEmails.length > 0) {
    console.log('   Detalhes:');
    duplicateEmails.forEach(([email, users]) => {
      console.log(`   - ${email}:`);
      users.forEach((user) => {
        console.log(`     * supabaseId: ${user.supabaseId}, id: ${user.id}`);
      });
    });
    console.log('');
  }

  // 3. Verificar usuários com supabaseId duplicado (não deveria acontecer)
  const supabaseIdMap = new Map<string, typeof allUsers>();
  allUsers.forEach((user) => {
    const existing = supabaseIdMap.get(user.supabaseId) || [];
    existing.push(user);
    supabaseIdMap.set(user.supabaseId, existing);
  });

  const duplicateSupabaseIds = Array.from(supabaseIdMap.entries()).filter(([_, users]) => users.length > 1);
  console.log(`🔑 SupabaseIds duplicados: ${duplicateSupabaseIds.length}`);
  if (duplicateSupabaseIds.length > 0) {
    console.log('   Detalhes (CRÍTICO - não deveria existir):');
    duplicateSupabaseIds.forEach(([supabaseId, users]) => {
      console.log(`   - ${supabaseId}:`);
      users.forEach((user) => {
        console.log(`     * email: ${user.email}, id: ${user.id}`);
      });
    });
    console.log('');
  }

  // 4. Estatísticas gerais
  const totalUsers = await prisma.user.count();
  const totalProfiles = await prisma.userProfile.count();

  console.log('📈 Estatísticas gerais:');
  console.log(`   Total de usuários: ${totalUsers}`);
  console.log(`   Total de profiles: ${totalProfiles}`);
  console.log(`   Usuários sem profile: ${totalUsers - totalProfiles}`);
  console.log('');

  console.log('✅ Diagnóstico concluído!');
}

diagnose()
  .catch((error) => {
    console.error('❌ Erro ao executar diagnóstico:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
