-- Criar todas as tabelas de Billing no banco de produção
-- Execute no Supabase SQL Editor

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'RECEIVED',
    'OVERDUE',
    'REFUNDED',
    'FAILED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM (
    'CARD',
    'BOLETO',
    'APPLE_PAY',
    'GOOGLE_PAY',
    'CASH_APP_PAY',
    'ACH_DEBIT',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

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

-- ============================================================================
-- TABELA: Subscription
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS "Subscription_customerId_idx" ON "Subscription"("customerId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_stripeSubscriptionId_idx" ON "Subscription"("stripeSubscriptionId");
CREATE INDEX IF NOT EXISTS "Subscription_stripePriceId_idx" ON "Subscription"("stripePriceId");
CREATE INDEX IF NOT EXISTS "Subscription_currentPeriodEnd_idx" ON "Subscription"("currentPeriodEnd");

-- ============================================================================
-- TABELA: Payment
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "customerId" TEXT NOT NULL,
  "subscriptionId" TEXT,
  "stripePaymentId" TEXT NOT NULL UNIQUE,
  "stripePaymentIntentId" TEXT,
  "stripeInvoiceId" TEXT,

  "value" DOUBLE PRECISION NOT NULL,
  "netValue" DOUBLE PRECISION,

  "status" "PaymentStatus" NOT NULL,
  "paymentMethod" "PaymentMethod" NOT NULL,

  "dueDate" TIMESTAMP(3) NOT NULL,
  "paymentDate" TIMESTAMP(3),
  "confirmedDate" TIMESTAMP(3),

  "receiptUrl" TEXT,
  "invoiceUrl" TEXT,

  "creditCardBrand" TEXT,
  "creditCardLast4" TEXT,

  "webhookEvents" JSONB,

  "description" TEXT,
  "externalReference" TEXT,

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Payment_customerId_idx" ON "Payment"("customerId");
CREATE INDEX IF NOT EXISTS "Payment_subscriptionId_idx" ON "Payment"("subscriptionId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");
CREATE INDEX IF NOT EXISTS "Payment_dueDate_idx" ON "Payment"("dueDate");
CREATE INDEX IF NOT EXISTS "Payment_stripePaymentId_idx" ON "Payment"("stripePaymentId");
CREATE INDEX IF NOT EXISTS "Payment_stripePaymentIntentId_idx" ON "Payment"("stripePaymentIntentId");

-- ============================================================================
-- TABELA: WebhookLog
-- ============================================================================

CREATE TABLE IF NOT EXISTS "WebhookLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "event" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "processed" BOOLEAN NOT NULL DEFAULT false,
  "error" TEXT,

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "WebhookLog_event_idx" ON "WebhookLog"("event");
CREATE INDEX IF NOT EXISTS "WebhookLog_processed_idx" ON "WebhookLog"("processed");
CREATE INDEX IF NOT EXISTS "WebhookLog_createdAt_idx" ON "WebhookLog"("createdAt");
CREATE INDEX IF NOT EXISTS "WebhookLog_processed_createdAt_idx" ON "WebhookLog"("processed", "createdAt");

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

SELECT 'Subscription table' as table_name, COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'Subscription'
UNION ALL
SELECT 'Payment table', COUNT(*)
FROM information_schema.columns
WHERE table_name = 'Payment'
UNION ALL
SELECT 'WebhookLog table', COUNT(*)
FROM information_schema.columns
WHERE table_name = 'WebhookLog';
