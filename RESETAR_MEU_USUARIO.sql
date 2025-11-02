-- ============================================================================
-- RESETAR CONTADORES DE IA PARA TESTAR
-- Execute isso no Supabase SQL Editor
-- ============================================================================

-- 1. Resetar TODOS os contadores de IA para ZERO
UPDATE "User"
SET
  "dailyAiExplanationsCount" = 0,
  "dailyAiExplanationsResetAt" = NOW(),
  "dailyAiChatsCount" = 0,
  "dailyAiChatsResetAt" = NOW(),
  "monthlySimulationsCount" = 0,
  "monthlySimulationsResetAt" = NOW()
WHERE "clerkId" = 'user_2qRN5qC5YdI3KZoqOvDJNlBRGfT';  -- Seu clerkId (ajuste se necessário)

-- 2. Verificar se funcionou
SELECT
  email,
  "planType",
  "dailyAiExplanationsCount",
  "dailyAiChatsCount",
  "monthlySimulationsCount"
FROM "User"
WHERE "clerkId" = 'user_2qRN5qC5YdI3KZoqOvDJNlBRGfT';

-- Resultado esperado: todas as contagens devem estar em 0
