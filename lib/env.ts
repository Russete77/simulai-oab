/**
 * Validação de variáveis de ambiente
 *
 * Estratégia em duas camadas, para nunca repetir o incidente em que a
 * validação derrubou a produção inteira:
 *
 *   BUILD  → `assertEnvOrThrow()` é chamado pelo next.config.ts na fase de
 *            build de produção. Falta variável = build quebra. Nada chega
 *            a produção mal configurado.
 *
 *   RUNTIME→ `env` (via instrumentation.ts) NUNCA lança. instrumentation roda
 *            uma vez por instância de servidor; se lançasse, a instância
 *            inteira ficaria inutilizável — TODA rota, não só a que usa a
 *            variável faltante. Aqui é só observabilidade.
 */

import { z } from 'zod';

const envSchema = z.object({
  // Banco
  DATABASE_URL: z.string().url('DATABASE_URL deve ser uma URL válida'),
  DIRECT_URL: z.string().url('DIRECT_URL deve ser uma URL válida').optional(),

  // Clerk (autenticação)
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
    .or(z.literal('')),

  // OpenAI
  OPENAI_API_KEY: z.string().startsWith('sk-', 'OPENAI_API_KEY deve começar com sk-'),
  AI_EXPLANATION_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_MONTHLY_BUDGET_USD: z.coerce.number().positive().optional(),

  // Stripe (gateway atual)
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith('sk_', 'STRIPE_SECRET_KEY deve começar com sk_'),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET deve começar com whsec_'),
  STRIPE_PRICE_ID: z
    .string()
    .startsWith('price_', 'STRIPE_PRICE_ID deve começar com price_'),
  // Pública por design — vai pro browser para montar o Payment Element.
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .startsWith('pk_', 'STRIPE_PUBLISHABLE_KEY deve começar com pk_'),

  // Asaas (legado — só recebe webhook dos assinantes que ainda não migraram).
  // Opcional: quando o último ciclo pago vencer, some junto com lib/asaas.
  ASAAS_API_KEY: z.string().optional(),
  ASAAS_WEBHOOK_TOKEN: z.string().optional(),
  ASAAS_SANDBOX_URL: z.string().url().optional(),

  // Cron
  CRON_SECRET: z.string().min(1, 'CRON_SECRET é obrigatório'),

  // Rate limiting — opcional no schema, mas SEM ISSO O RATE LIMIT FICA
  // DESLIGADO em produção (lib/rate-limit.ts falha aberto). Ver checkRuntimeWarnings().
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // E-mail transacional
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),

  // Push (VAPID)
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Bypass de admin — vazio/ausente é válido (= nenhum admin)
  ADMIN_EMAILS: z.string().optional(),

  // Acesso gratuito temporário
  ENABLE_FREE_ACCESS_MODE: z.enum(['true', 'false']).optional(),
  FREE_ACCESS_END_DATE: z.string().optional(),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

function formatIssues(error: z.ZodError): string[] {
  return error.errors.map((err) => `  - ${err.path.join('.')}: ${err.message}`);
}

/**
 * Falha o BUILD se faltar variável obrigatória.
 * Chamado só pelo next.config.ts, na fase de build de produção.
 */
export function assertEnvOrThrow(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const lines = formatIssues(parsed.error).join('\n');
    throw new Error(
      `Variáveis de ambiente inválidas ou ausentes:\n\n${lines}\n\n` +
        `Configure-as antes do build (local: .env.local · produção: painel da Vercel).`
    );
  }

  return parsed.data;
}

/**
 * Avisos que não quebram nada, mas que você quer ver no log de boot.
 * Coisas configuradas "meio pela metade" que falham em silêncio.
 */
export function checkRuntimeWarnings(): string[] {
  const warnings: string[] = [];

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      warnings.push(
        'UPSTASH_REDIS_REST_URL/TOKEN ausentes — rate limiting DESLIGADO em produção. ' +
          'As rotas de IA ficam sem teto de requisições.'
      );
    }

    if (process.env.ENABLE_FREE_ACCESS_MODE === 'true') {
      warnings.push(
        'ENABLE_FREE_ACCESS_MODE=true — o paywall está DESLIGADO e todos os ' +
          'usuários têm acesso completo sem assinatura.'
      );
    }

    if (!process.env.RESEND_API_KEY) {
      warnings.push('RESEND_API_KEY ausente — nenhum e-mail transacional será enviado.');
    }
  }

  return warnings;
}

/**
 * Validação de runtime. NUNCA lança — só reporta.
 */
function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('[ENV] Configuração inválida (app segue rodando):');
    formatIssues(parsed.error).forEach((line) => console.error(line));
  }

  for (const warning of checkRuntimeWarnings()) {
    console.warn(`[ENV] ${warning}`);
  }

  return parsed.success ? parsed.data : (process.env as unknown as Env);
}

export const env = validateEnv();
