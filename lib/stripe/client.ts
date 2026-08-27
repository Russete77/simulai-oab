/**
 * Cliente Stripe (server-only).
 *
 * A versão de API vem do padrão do SDK (hoje 2026-07-29.dahlia). Não fixamos
 * aqui de propósito: subir o SDK e a versão de API juntos evita o par
 * SDK-novo/API-velha, que é onde nascem os erros silenciosos de tipo.
 */

import Stripe from 'stripe';

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY não configurada');
  }

  cached = new Stripe(key, {
    appInfo: { name: 'Simulai OAB', url: 'https://www.simulaioab.com' },
    // Rede instável não pode virar cobrança perdida: o SDK repete requisições
    // idempotentes por conta própria.
    maxNetworkRetries: 2,
  });

  return cached;
}

/** True quando a chave é de teste — usado para avisos no admin. */
export function isStripeTestMode(): boolean {
  return (process.env.STRIPE_SECRET_KEY || '').startsWith('sk_test_');
}
