/**
 * Roda uma vez por instância de servidor (Node.js e Edge), antes de qualquer
 * request. Ponto certo pra validar env vars no boot em vez de nunca — antes
 * disso lib/env.ts existia mas não era importado por ninguém.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./lib/env');
  }
}
