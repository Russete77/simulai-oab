/**
 * Script para sincronizar usuários do Supabase Auth com Prisma
 *
 * Este script cria registros no Prisma para usuários que existem
 * no Supabase Auth mas não estão sincronizados no banco.
 */

import { createClient } from '@supabase/supabase-js';
import { prisma } from '../lib/db/prisma';
import { reconcileUser } from '../lib/auth/reconcile';

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

async function fixMissingUsers() {
  console.log('🔧 Sincronizando usuários do Supabase Auth com Prisma...\n');

  // 1. Buscar usuários no Supabase Auth
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Erro ao buscar usuários do Supabase:', authError);
    process.exit(1);
  }

  console.log(`📡 Encontrados ${authUsers.users.length} usuários no Supabase Auth\n`);

  // 2. Buscar usuários no Prisma
  const prismaUsers = await prisma.user.findMany({
    select: {
      supabaseId: true,
    },
  });

  const prismaUserIds = new Set(prismaUsers.map((u) => u.supabaseId));

  // 3. Identificar usuários faltantes
  const missingUsers = authUsers.users.filter((u) => !prismaUserIds.has(u.id));

  console.log(`❌ Usuários não sincronizados: ${missingUsers.length}\n`);

  if (missingUsers.length === 0) {
    console.log('✅ Todos os usuários já estão sincronizados!');
    return;
  }

  // 4. Sincronizar usuários faltantes
  let synced = 0;
  let errors = 0;

  for (const authUser of missingUsers) {
    const name =
      authUser.user_metadata?.name ||
      authUser.user_metadata?.full_name ||
      authUser.email?.split('@')[0] ||
      null;

    console.log(`🔄 Sincronizando: ${authUser.email}...`);

    try {
      const result = await reconcileUser(
        prisma,
        { id: authUser.id, email: authUser.email! },
        name
      );

      console.log(`   ✅ ${result.action} - ${authUser.email}`);
      synced++;
    } catch (error: any) {
      console.error(`   ❌ Erro ao sincronizar ${authUser.email}:`, error.message);
      errors++;
    }
  }

  console.log('\n📈 Resultado:');
  console.log(`   Sincronizados: ${synced}`);
  console.log(`   Erros: ${errors}`);
  console.log('\n✅ Sincronização concluída!');
}

fixMissingUsers()
  .catch((error) => {
    console.error('❌ Erro ao executar sincronização:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
