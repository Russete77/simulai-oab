-- ============================================================================
-- MIGRATION: Adicionar campos de onboarding ao UserProfile
-- Data: 02/11/2025
-- ============================================================================

-- Adicionar campos de onboarding tracking
ALTER TABLE "UserProfile"
ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "onboardingStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "onboardingStartedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);

-- Adicionar comentários para documentação
COMMENT ON COLUMN "UserProfile"."onboardingCompleted" IS 'Se o usuário completou o tutorial de onboarding';
COMMENT ON COLUMN "UserProfile"."onboardingStep" IS 'Passo atual do onboarding: 0=não iniciado, 1-3=passos, 4=completo';
COMMENT ON COLUMN "UserProfile"."onboardingStartedAt" IS 'Quando o usuário iniciou o onboarding';
COMMENT ON COLUMN "UserProfile"."onboardingCompletedAt" IS 'Quando o usuário completou o onboarding';

-- Verificar se migration foi aplicada
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'UserProfile'
  AND column_name IN ('onboardingCompleted', 'onboardingStep', 'onboardingStartedAt', 'onboardingCompletedAt')
ORDER BY column_name;
