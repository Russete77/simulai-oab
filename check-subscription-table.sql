-- Verificar estrutura da tabela Subscription no banco de produção
-- Execute no Supabase SQL Editor

-- 1. Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'Subscription'
);

-- 2. Ver estrutura completa da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Subscription'
ORDER BY ordinal_position;

-- 3. Se a tabela não existir, verificar com letra minúscula
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscription'
ORDER BY ordinal_position;
