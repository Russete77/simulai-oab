-- Migration: Adicionar campos do Stripe às tabelas existentes
-- Execute no Supabase SQL Editor em PRODUÇÃO
-- Baseado na estrutura atual do banco (atual.sql)

-- ============================================================================
-- SUBSCRIPTION - Adicionar campos do Stripe
-- ============================================================================

-- Adicionar campos de período (Stripe)
ALTER TABLE "Subscription"
  ADD COLUMN IF NOT EXISTS "currentPeriodStart" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancelAtPeriodEnd" BOOLEAN DEFAULT false;

-- Adicionar campos de trial (Stripe)
ALTER TABLE "Subscription"
  ADD COLUMN IF NOT EXISTS "trialStart" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "trialEnd" TIMESTAMP(3);

-- Adicionar campos adicionais (Stripe)
ALTER TABLE "Subscription"
  ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "discount" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Adicionar índice
CREATE INDEX IF NOT EXISTS "Subscription_currentPeriodEnd_idx" ON "Subscription"("currentPeriodEnd");

-- ============================================================================
-- PAYMENT - Adicionar campos do Stripe
-- ============================================================================

-- Adicionar customerId (IMPORTANTE - FK)
ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "customerId" TEXT;

-- Adicionar FK constraint para customerId
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Payment_customerId_fkey'
  ) THEN
    ALTER TABLE "Payment"
      ADD CONSTRAINT "Payment_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Adicionar campos adicionais do Stripe
ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "receiptUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "creditCardBrand" TEXT,
  ADD COLUMN IF NOT EXISTS "creditCardLast4" TEXT,
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "externalReference" TEXT;

-- Adicionar índice para customerId
CREATE INDEX IF NOT EXISTS "Payment_customerId_idx" ON "Payment"("customerId");

-- ============================================================================
-- POPULAR customerId nos Payments existentes (se houver)
-- ============================================================================

-- Atualizar Payments que têm subscriptionId para pegar o customerId da Subscription
UPDATE "Payment" p
SET "customerId" = s."customerId"
FROM "Subscription" s
WHERE p."subscriptionId" = s.id
  AND p."customerId" IS NULL;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Verificar campos adicionados na Subscription
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Subscription'
  AND column_name IN (
    'currentPeriodStart', 'currentPeriodEnd', 'cancelAtPeriodEnd',
    'trialStart', 'trialEnd', 'endDate', 'discount', 'metadata'
  )
ORDER BY column_name;

-- Verificar campos adicionados no Payment
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Payment'
  AND column_name IN (
    'customerId', 'receiptUrl', 'creditCardBrand', 'creditCardLast4',
    'description', 'externalReference'
  )
ORDER BY column_name;

-- Contar registros
SELECT
  'Subscriptions' as table_name,
  COUNT(*) as total_records
FROM "Subscription"
UNION ALL
SELECT
  'Payments',
  COUNT(*)
FROM "Payment"
UNION ALL
SELECT
  'Payments com customerId',
  COUNT(*)
FROM "Payment"
WHERE "customerId" IS NOT NULL;
