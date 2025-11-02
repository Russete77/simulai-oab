-- Remove campo asaasCustomerId da tabela Customer
-- Executar no Supabase SQL Editor em PRODUÇÃO
-- Motivo: Não usamos Asaas, apenas Stripe

-- 1. Remover constraint UNIQUE se existir
ALTER TABLE "Customer" DROP CONSTRAINT IF EXISTS "Customer_asaasCustomerId_key";

-- 2. Remover a coluna
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "asaasCustomerId";

-- Verificar resultado
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Customer'
ORDER BY ordinal_position;
