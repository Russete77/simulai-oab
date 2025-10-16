/**
 * Validação de variáveis de ambiente
 *
 * Garante que todas as env vars necessárias estão configuradas
 * e com o formato correto antes da aplicação iniciar.
 */

import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL deve ser uma URL válida'),
  DIRECT_URL: z.string().url('DIRECT_URL deve ser uma URL válida').optional(),

  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .startsWith('pk_', 'CLERK_PUBLISHABLE_KEY deve começar com pk_'),
  CLERK_SECRET_KEY: z
    .string()
    .startsWith('sk_', 'CLERK_SECRET_KEY deve começar com sk_'),
  CLERK_WEBHOOK_SECRET: z
    .string()
    .startsWith('whsec_', 'CLERK_WEBHOOK_SECRET deve começar com whsec_')
    .optional()
    .or(z.literal('')), // Permitir string vazia em desenvolvimento

  // OpenAI
  OPENAI_API_KEY: z
    .string()
    .startsWith('sk-', 'OPENAI_API_KEY deve começar com sk-'),
  AI_EXPLANATION_MODEL: z.string().default('gpt-4o-mini'),

  // Supabase (legacy - ainda em uso)
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('SUPABASE_URL deve ser uma URL válida'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'SUPABASE_ANON_KEY é obrigatório'),

  // Node Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

// Tipo inferido do schema
export type Env = z.infer<typeof envSchema>;

// Validar e exportar
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Erro de configuração de variáveis de ambiente:\n');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\n💡 Verifique seu arquivo .env\n');
    }
    throw new Error('Configuração de ambiente inválida');
  }
}

export const env = validateEnv();
