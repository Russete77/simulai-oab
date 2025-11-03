-- REMOVER OBRIGATORIEDADE DOS CAMPOS ASAAS (LEGACY)
-- Execute no Supabase SQL Editor em PRODUÇÃO

-- ============================================================================
-- TORNAR CAMPOS ASAAS OPCIONAIS (NULLABLE)
-- ============================================================================

-- Subscription: Tornar totalValue opcional
ALTER TABLE "Subscription"
  ALTER COLUMN "totalValue" DROP NOT NULL;

-- Subscription: Tornar billingType opcional
ALTER TABLE "Subscription"
  ALTER COLUMN "billingType" DROP NOT NULL;

-- Subscription: Tornar asaasSubscriptionId opcional (se existir)
ALTER TABLE "Subscription"
  ALTER COLUMN "asaasSubscriptionId" DROP NOT NULL;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'Subscription'
  AND column_name IN ('totalValue', 'billingType', 'asaasSubscriptionId')
ORDER BY column_name;
