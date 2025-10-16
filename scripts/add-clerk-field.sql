-- Adicionar campo clerkId à tabela User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clerkId" TEXT;

-- Tornar supabaseId opcional (nullable)
ALTER TABLE "User" ALTER COLUMN "supabaseId" DROP NOT NULL;

-- Criar índice para clerkId
CREATE INDEX IF NOT EXISTS "User_clerkId_idx" ON "User"("clerkId");

-- Adicionar constraint de unique para clerkId (só se a coluna não tiver valores nulos)
-- ALTER TABLE "User" ADD CONSTRAINT "User_clerkId_key" UNIQUE ("clerkId");
