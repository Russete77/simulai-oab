/**
 * Rate Limiting para APIs
 *
 * Protege endpoints contra abuso e controla custos de IA.
 *
 * NOTA: Requer configuração de Upstash Redis.
 * Se as variáveis de ambiente não estiverem configuradas,
 * o rate limiting será desabilitado (apenas em desenvolvimento).
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logger } from './logger';

// Verificar se Upstash está configurado
const isUpstashConfigured =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

// Criar cliente Redis (apenas se configurado)
let redis: Redis | null = null;

if (isUpstashConfigured) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  logger.info('Rate limiting configurado com Upstash Redis');
} else {
  if (process.env.NODE_ENV === 'production') {
    logger.warn(
      'UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN não configurados. ' +
        'Rate limiting desabilitado!'
    );
  } else {
    logger.debug(
      'Rate limiting desabilitado em desenvolvimento (Upstash não configurado)'
    );
  }
}

/**
 * Rate limiter para endpoints públicos
 * 10 requisições a cada 10 segundos por IP
 */
export const publicRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
      prefix: 'ratelimit:public',
    })
  : null;

/**
 * Rate limiter para autenticação
 * 5 tentativas de login a cada 5 minutos por IP
 */
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '5 m'),
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : null;

/**
 * Rate limiter para APIs de IA (mais restrito)
 * 5 requisições por minuto por usuário
 */
export const aiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'ratelimit:ai',
    })
  : null;

/**
 * Rate limiter para criação de simulados
 * 3 simulados por hora por usuário
 */
export const simulationRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      analytics: true,
      prefix: 'ratelimit:simulation',
    })
  : null;

/**
 * Rate limiter para responder questões
 * 100 respostas por minuto por usuário (generoso para simulados)
 */
export const answerRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'ratelimit:answer',
    })
  : null;

/**
 * Helper para aplicar rate limiting em API routes
 *
 * @param identifier - Identificador único (userId, IP, etc)
 * @param limiter - Qual rate limiter usar
 * @returns Object com { success, limit, remaining, reset }
 */
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit | null
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  // Se rate limiting não configurado, permitir sempre
  if (!limiter) {
    return {
      success: true,
      limit: 999,
      remaining: 999,
      reset: Date.now() + 60000,
    };
  }

  try {
    const result = await limiter.limit(identifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    // Em caso de erro no Redis, permitir a requisição (fail open)
    logger.error('Erro ao verificar rate limit', {
      error: error instanceof Error ? error.message : String(error),
      identifier,
    });

    return {
      success: true,
      limit: 999,
      remaining: 999,
      reset: Date.now() + 60000,
    };
  }
}

/**
 * Helper para obter IP do request (útil para rate limiting por IP)
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}
