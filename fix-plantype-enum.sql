-- Adicionar valor PREMIUM ao enum PlanType
-- Execute no Supabase SQL Editor em PRODUÇÃO

-- ============================================================================
-- VERIFICAR VALORES ATUAIS DO ENUM
-- ============================================================================

SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'PlanType'
)
ORDER BY enumsortorder;

-- ============================================================================
-- ADICIONAR PREMIUM
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PlanType')
      AND enumlabel = 'PREMIUM'
  ) THEN
    ALTER TYPE "PlanType" ADD VALUE 'PREMIUM';
  END IF;
END $$;

-- ============================================================================
-- VERIFICAR VALORES APÓS ATUALIZAÇÃO
-- ============================================================================

SELECT enumlabel, enumsortorder
FROM pg_enum
WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'PlanType'
)
ORDER BY enumsortorder;
