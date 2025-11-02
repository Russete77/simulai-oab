-- ============================================================================
-- FIX: Criar tabela UserQuestionChat
-- Data: 02/11/2025
-- ============================================================================

-- Criar tabela de chat (se não existir)
CREATE TABLE IF NOT EXISTS "UserQuestionChat" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "messages" JSONB NOT NULL DEFAULT '[]',
  "messageCount" INTEGER NOT NULL DEFAULT 0,
  "lastMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserQuestionChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "UserQuestionChat_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE
);

-- Criar índices
CREATE INDEX IF NOT EXISTS "UserQuestionChat_userId_idx" ON "UserQuestionChat"("userId");
CREATE INDEX IF NOT EXISTS "UserQuestionChat_questionId_idx" ON "UserQuestionChat"("questionId");
CREATE INDEX IF NOT EXISTS "UserQuestionChat_userId_questionId_idx" ON "UserQuestionChat"("userId", "questionId");

-- Verificar se tabela foi criada
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'UserQuestionChat'
ORDER BY ordinal_position;
