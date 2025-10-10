# Correções de Autenticação - Simulai OAB

## Problemas Identificados e Resolvidos

### 🔴 Problema 1: Erro de Constraint Único no Email (P2002)

**Sintoma:**
```
Error [PrismaClientKnownRequestError]:
Invalid `prisma.user.upsert()` invocation:
Unique constraint failed on the fields: (`email`)
```

**Causa Raiz:**
- A função `getCurrentUser()` em `lib/auth.ts` usava `prisma.user.upsert()` com `where: { supabaseId }`
- Se um email já existia no banco com outro `supabaseId`, o upsert violava a constraint `@@unique` no campo email
- Isso causava falhas de login no dashboard

**Localização:** `lib/auth.ts:16` e `app/dashboard/page.tsx:9`

**Solução Implementada:**
- Refatorado `getCurrentUser()` para usar a função `reconcileUser()` consistentemente
- `reconcileUser()` agora verifica tanto por `supabaseId` quanto por `email` antes de criar/atualizar
- Lógica aprimorada para lidar com conflitos de email

---

### 🔴 Problema 2: Duplicação de Lógica de Reconciliação

**Sintoma:**
- Duas funções diferentes fazendo reconciliação de usuários:
  - `reconcileUser()` - usado no signup
  - `getCurrentUser()` com upsert - usado no dashboard
- Comportamentos inconsistentes entre signup e login

**Solução Implementada:**
- `getCurrentUser()` agora usa `reconcileUser()` internamente
- Lógica centralizada em um único ponto
- Tratamento de erros aprimorado com fallback

---

### 🔴 Problema 3: Usuários sem Profile

**Sintoma:**
- Possível erro vazio `{}` ao buscar profile
- Usuários criados sem profile associado

**Solução Implementada:**
- `reconcileUser()` agora verifica e cria profile automaticamente se não existir
- Lógica de criação de profile em três pontos:
  1. Ao atualizar usuário existente sem profile
  2. Ao associar supabaseId a usuário existente
  3. Ao criar novo usuário

---

## Arquivos Modificados

### 1. `lib/auth.ts`
**Mudanças:**
- Importado `reconcileUser` de `@/lib/auth/reconcile`
- Refatorado `getCurrentUser()` para usar `reconcileUser()` internamente
- Adicionado tratamento de erro com fallback para buscar usuário existente
- Logs aprimorados para diagnóstico

**Antes:**
```typescript
const dbUser = await prisma.user.upsert({
  where: { supabaseId: user.id },
  update: { email: user.email!, updatedAt: new Date() },
  create: { /* ... */ }
});
```

**Depois:**
```typescript
await reconcileUser(prisma, { id: user.id, email: user.email! }, name);
const dbUser = await prisma.user.findUnique({
  where: { supabaseId: user.id },
  include: { profile: true }
});
```

### 2. `lib/auth/reconcile.ts`
**Mudanças:**
- Adicionado verificação de profile em todas as queries
- Criação automática de profile quando ausente
- Melhor tratamento de conflitos de email
- Logs de warning para conflitos
- Três casos bem definidos:
  1. Usuário existe por supabaseId
  2. Usuário existe por email (associar supabaseId)
  3. Usuário não existe (criar novo)

---

## Scripts de Diagnóstico Criados

### 1. `scripts/diagnose-auth.ts`
**Função:** Diagnosticar problemas de autenticação

**Verifica:**
- Usuários sem profile
- Emails duplicados
- SupabaseIds duplicados
- Estatísticas gerais

**Uso:**
```bash
npx tsx scripts/diagnose-auth.ts
```

### 2. `scripts/fix-users-without-profile.ts`
**Função:** Criar profiles para usuários que não têm

**Uso:**
```bash
npx tsx scripts/fix-users-without-profile.ts
```

### 3. `scripts/check-supabase-sync.ts`
**Função:** Verificar sincronização entre Supabase Auth e Prisma

**Verifica:**
- Usuários no Supabase Auth não sincronizados com Prisma
- Usuários órfãos no Prisma
- Usuários sem profile

**Requisito:** Variável de ambiente `SUPABASE_SERVICE_ROLE_KEY`

**Uso:**
```bash
npx tsx scripts/check-supabase-sync.ts
```

### 4. `scripts/fix-missing-users.ts`
**Função:** Sincronizar usuários do Supabase Auth com Prisma

**Uso:**
```bash
npx tsx scripts/fix-missing-users.ts
```

---

## Como Resolver Problemas de Login

### Usuário não consegue fazer login

**Passo 1:** Execute o diagnóstico
```bash
npx tsx scripts/diagnose-auth.ts
```

**Passo 2:** Verifique sincronização com Supabase (requer SUPABASE_SERVICE_ROLE_KEY)
```bash
npx tsx scripts/check-supabase-sync.ts
```

**Passo 3:** Se houver usuários não sincronizados, execute:
```bash
npx tsx scripts/fix-missing-users.ts
```

**Passo 4:** Se houver usuários sem profile, execute:
```bash
npx tsx scripts/fix-users-without-profile.ts
```

### Erro de constraint único (P2002)

Este erro agora deve estar resolvido com as mudanças em `lib/auth.ts` e `lib/auth/reconcile.ts`.

Se o erro persistir:
1. Verifique os logs no console do servidor
2. Execute `scripts/diagnose-auth.ts` para verificar duplicatas
3. Revise o arquivo `.env` para garantir que as credenciais do Supabase estão corretas

---

## Variáveis de Ambiente Necessárias

### Obrigatórias (para funcionamento básico)
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=your-database-url
DIRECT_URL=your-direct-database-url
```

### Opcionais (para scripts avançados)
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Para scripts de sincronização
SUPABASE_WEBHOOK_SECRET=your-webhook-secret       # Para webhooks do Supabase
```

---

## Próximos Passos Recomendados

1. **Testar o fluxo de login completo:**
   - Criar novo usuário
   - Fazer login
   - Acessar dashboard
   - Verificar se profile é carregado corretamente

2. **Configurar webhooks do Supabase (opcional):**
   - Endpoint: `https://seu-dominio.com/api/supabase/webhook`
   - Eventos: `user.created`, `user.updated`
   - Secret: configurar `SUPABASE_WEBHOOK_SECRET`

3. **Monitorar logs:**
   - Verificar logs com prefixo `[auth.signUp]`, `[auth.signIn]`, `[auth.getCurrentUser]`
   - Verificar logs de reconciliação: `[reconcile]`

4. **Deletar usuários do Supabase Auth:**
   - Use o Supabase Dashboard > Authentication > Users
   - Ou use a Admin API com `SUPABASE_SERVICE_ROLE_KEY`

---

## Fluxo de Autenticação Atualizado

```
┌─────────────────────────────────────────────────────────────┐
│                     SIGNUP                                   │
├─────────────────────────────────────────────────────────────┤
│ 1. app/(auth)/actions.ts::signUp()                          │
│    ↓                                                         │
│ 2. supabase.auth.signUp() - Cria usuário no Supabase Auth  │
│    ↓                                                         │
│ 3. reconcileUser() - Cria/atualiza usuário no Prisma       │
│    ├─ Verifica por supabaseId                              │
│    ├─ Verifica por email                                    │
│    ├─ Cria profile se necessário                            │
│    └─ Retorna resultado da operação                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     LOGIN                                    │
├─────────────────────────────────────────────────────────────┤
│ 1. app/(auth)/actions.ts::signIn()                          │
│    ↓                                                         │
│ 2. supabase.auth.signInWithPassword() - Autentica          │
│    ↓                                                         │
│ 3. Redirect para /dashboard                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     DASHBOARD                                │
├─────────────────────────────────────────────────────────────┤
│ 1. app/dashboard/page.tsx::getCurrentUser()                 │
│    ↓                                                         │
│ 2. supabase.auth.getUser() - Verifica sessão               │
│    ↓                                                         │
│ 3. reconcileUser() - Sincroniza com Prisma                 │
│    ├─ Verifica por supabaseId                              │
│    ├─ Verifica por email                                    │
│    ├─ Cria profile se necessário                            │
│    └─ Retorna usuário                                        │
│    ↓                                                         │
│ 4. prisma.user.findUnique() - Busca usuário com profile    │
└─────────────────────────────────────────────────────────────┘
```

---

## Resumo das Melhorias

✅ **Constraint único no email** - Resolvido com reconciliação inteligente
✅ **Lógica duplicada** - Centralizada em `reconcileUser()`
✅ **Usuários sem profile** - Criação automática garantida
✅ **Sincronização Supabase <-> Prisma** - Scripts de diagnóstico e correção
✅ **Tratamento de erros** - Logs aprimorados e fallbacks
✅ **Conflitos de email** - Detecção e tratamento apropriado

---

**Data da correção:** 2025-10-10
**Versão do Next.js:** 15.5.3
**Versão do Prisma:** 6.16.3
