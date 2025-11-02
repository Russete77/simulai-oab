-- Adicionar valores faltantes ao enum SubscriptionStatus
-- Execute no Supabase SQL Editor em PRODUÇÃO

-- ============================================================================
-- VERIFICAR VALORES ATUAIS DO ENUM
-- ============================================================================

SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'SubscriptionStatus'
)
ORDER BY enumsortorder;

-- ============================================================================
-- ADICIONAR VALORES FALTANTES
-- ============================================================================

-- Adicionar INCOMPLETE (usado pelo Stripe para subscriptions não completadas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'SubscriptionStatus')
      AND enumlabel = 'INCOMPLETE'
  ) THEN
    ALTER TYPE "SubscriptionStatus" ADD VALUE 'INCOMPLETE';
  END IF;
END $$;

-- Adicionar INCOMPLETE_EXPIRED (usado pelo Stripe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'SubscriptionStatus')
      AND enumlabel = 'INCOMPLETE_EXPIRED'
  ) THEN
    ALTER TYPE "SubscriptionStatus" ADD VALUE 'INCOMPLETE_EXPIRED';
  END IF;
END $$;

-- Adicionar PAUSED (usado pelo Stripe para subscriptions pausadas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'SubscriptionStatus')
      AND enumlabel = 'PAUSED'
  ) THEN
    ALTER TYPE "SubscriptionStatus" ADD VALUE 'PAUSED';
  END IF;
END $$;

-- ============================================================================
-- VERIFICAR VALORES APÓS ATUALIZAÇÃO
-- ============================================================================

SELECT enumlabel, enumsortorder
FROM pg_enum
WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'SubscriptionStatus'
)
ORDER BY enumsortorder;
