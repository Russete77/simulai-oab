# 🚀 Setup Rápido - Simulai OAB

## 1️⃣ Pegar a Connection String do Supabase

1. Acesse: https://supabase.com/dashboard/project/jtgoxjpnrlxbvhfbltuc/settings/database
2. Vá em **Database** > **Connection String** > **URI**
3. Copie a URL completa (ela contém a senha)
4. Cole no arquivo `.env` na variável `DATABASE_URL`

**Formato:**
```
postgresql://postgres.jtgoxjpnrlxbvhfbltuc:[SUA-SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

## 2️⃣ Instalar Dependências

```bash
npm install
```

## 3️⃣ Criar Tabelas no Banco

```bash
npm run db:push
```

Esse comando vai criar todas as tabelas no PostgreSQL do Supabase baseado no schema Prisma.

## 4️⃣ Importar Dataset OAB

```bash
npm run import:dataset
```

Isso vai importar **5.605 questões reais** da OAB (2010-2025) do HuggingFace.

## 5️⃣ Iniciar Servidor

```bash
npm run dev
```

Acesse: http://localhost:3000

## ✅ Verificar se funcionou

### Testar API de Questões

```bash
# 1. Criar usuário no Supabase Auth primeiro
# Ou usar o endpoint diretamente (sem auth temporariamente)

# Testar buscar próxima questão
curl http://localhost:3000/api/questions/next
```

### Abrir Prisma Studio

```bash
npm run db:studio
```

Isso abre uma interface visual para ver os dados do banco.

## 🔧 Troubleshooting

### Erro: "Invalid connection string"
- Verifique se copiou a senha correta do Supabase
- A connection string deve ter `?pgbouncer=true` no final

### Erro: "Table does not exist"
- Rode: `npm run db:push`

### Erro ao importar dataset
- Verifique a conexão com a internet
- Tente importar em lotes menores editando `batchSize` no script

## 📊 Próximos Passos

Depois que tudo estiver funcionando:

1. ✅ Testar todas as APIs (questions, simulations, analytics)
2. ✅ Criar componentes do frontend
3. ✅ Implementar páginas (dashboard, simulados, questões)
4. ✅ Adicionar autenticação visual
5. ✅ Implementar gamificação
