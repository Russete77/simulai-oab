-- Criar tabela Subscription no banco de produção
-- Execute no Supabase SQL Editor

-- Criar ENUM se não existir
DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM (
    'ACTIVE',
    'TRIALING',
    'PAST_DUE',
    'CANCELED',
    'UNPAID',
    'INCOMPLETE',
    'INCOMPLETE_EXPIRED',
    'PAUSED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tabela Subscription
CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "customerId" TEXT NOT NULL,
  "stripeSubscriptionId" TEXT UNIQUE,
  "stripePriceId" TEXT,
  "stripeProductId" TEXT,

  "plan" TEXT NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',

  "value" DOUBLE PRECISION NOT NULL,
  "discount" DOUBLE PRECISION,

  "cycle" TEXT NOT NULL,

  "currentPeriodStart" TIMESTAMP(3),
  "currentPeriodEnd" TIMESTAMP(3),
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,

  "trialStart" TIMESTAMP(3),
  "trialEnd" TIMESTAMP(3),

  "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endDate" TIMESTAMP(3),
  "canceledAt" TIMESTAMP(3),

  "metadata" JSONB,

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Subscription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Criar índices
CREATE INDEX IF NOT EXISTS "Subscription_customerId_idx" ON "Subscription"("customerId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_stripeSubscriptionId_idx" ON "Subscription"("stripeSubscriptionId");
CREATE INDEX IF NOT EXISTS "Subscription_stripePriceId_idx" ON "Subscription"("stripePriceId");
CREATE INDEX IF NOT EXISTS "Subscription_currentPeriodEnd_idx" ON "Subscription"("currentPeriodEnd");

-- Verificar se foi criada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Subscription'
ORDER BY ordinal_position;
