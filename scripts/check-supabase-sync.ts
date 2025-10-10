/**
 * Script para verificar sincronização entre Supabase Auth e Prisma
 *
 * Este script:
 * 1. Lista usuários no Supabase Auth
 * 2. Compara com usuários no Prisma
 * 3. Identifica dessincronia
 */

import { createClient } from '@supabase/supabase-js';
import { prisma } from '../lib/db/prisma';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada no .env');
  console.error('   Esta chave é necessária para acessar a admin API do Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkSync() {
  console.log('🔍 Verificando sincronização Supabase Auth <-> Prisma...\n');

  // 1. Buscar usuários no Supabase Auth
  console.log('📡 Buscando usuários no Supabase Auth...');
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Erro ao buscar usuários do Supabase:', authError);
    process.exit(1);
  }

  console.log(`   Encontrados ${authUsers.users.length} usuários no Supabase Auth\n`);

  // 2. Buscar usuários no Prisma
  console.log('💾 Buscando usuários no Prisma...');
  const prismaUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      supabaseId: true,
      name: true,
      profile: true,
    },
  });

  console.log(`   Encontrados ${prismaUsers.length} usuários no Prisma\n`);

  // 3. Identificar dessincronia
  const prismaUsersBySupabaseId = new Map(
    prismaUsers.map((u) => [u.supabaseId, u])
  );

  const missingInPrisma = [];
  const missingProfile = [];

  for (const authUser of authUsers.users) {
    const prismaUser = prismaUsersBySupabaseId.get(authUser.id);

    if (!prismaUser) {
      missingInPrisma.push({
        supabaseId: authUser.id,
        email: authUser.email,
        createdAt: authUser.created_at,
      });
    } else if (!prismaUser.profile) {
      missingProfile.push({
        supabaseId: authUser.id,
        email: authUser.email,
        prismaId: prismaUser.id,
      });
    }
  }

  // 4. Identificar usuários no Prisma sem correspondente no Supabase
  const authUserIds = new Set(authUsers.users.map((u) => u.id));
  const orphanedInPrisma = prismaUsers.filter((u) => !authUserIds.has(u.supabaseId));

  // 5. Relatório
  console.log('📊 RELATÓRIO DE SINCRONIZAÇÃO\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`✅ Usuários sincronizados: ${authUsers.users.length - missingInPrisma.length}`);
  console.log(`❌ Usuários no Supabase Auth mas não no Prisma: ${missingInPrisma.length}`);
  console.log(`⚠️  Usuários no Prisma sem profile: ${missingProfile.length}`);
  console.log(`🗑️  Usuários órfãos no Prisma (não existem no Supabase): ${orphanedInPrisma.length}\n`);

  if (missingInPrisma.length > 0) {
    console.log('❌ Usuários não sincronizados com Prisma:');
    missingInPrisma.forEach((user) => {
      console.log(`   - ${user.email} (supabaseId: ${user.supabaseId})`);
      console.log(`     Criado em: ${user.createdAt}`);
    });
    console.log('');
  }

  if (missingProfile.length > 0) {
    console.log('⚠️  Usuários sem profile:');
    missingProfile.forEach((user) => {
      console.log(`   - ${user.email} (supabaseId: ${user.supabaseId})`);
    });
    console.log('');
  }

  if (orphanedInPrisma.length > 0) {
    console.log('🗑️  Usuários órfãos no Prisma:');
    orphanedInPrisma.forEach((user) => {
      console.log(`   - ${user.email} (supabaseId: ${user.supabaseId})`);
      console.log(`     Prisma ID: ${user.id}`);
    });
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (missingInPrisma.length > 0) {
    console.log('💡 RECOMENDAÇÃO:');
    console.log('   Execute o script fix-missing-users.ts para sincronizar');
    console.log('   os usuários do Supabase Auth com o Prisma.\n');
  }

  console.log('✅ Verificação concluída!');
}

checkSync()
  .catch((error) => {
    console.error('❌ Erro ao executar verificação:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
