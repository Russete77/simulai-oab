/**
 * Mapeamento entre Price IDs do Stripe e planos do sistema
 * Centraliza a configuração para evitar inconsistências
 */

import { PlanTier, BillingCycle, PLANS } from './plans';

/**
 * Interface para configuração de preço do Stripe
 */
export interface StripePriceConfig {
  priceId: string;
  tier: PlanTier;
  cycle: BillingCycle;
}

/**
 * Mapeamento de Price IDs para planos
 * IMPORTANTE: Mantenha isso sincronizado com os produtos criados no Stripe Dashboard
 */
export const STRIPE_PRICE_MAP: StripePriceConfig[] = [
  // BASIC
  {
    priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID || '',
    tier: 'BASIC',
    cycle: 'MONTHLY',
  },
  {
    priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_QUARTERLY_PRICE_ID || '',
    tier: 'BASIC',
    cycle: 'QUARTERLY',
  },
  {
    priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID || '',
    tier: 'BASIC',
    cycle: 'YEARLY',
  },

  // PRO
  {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || '',
    tier: 'PRO',
    cycle: 'MONTHLY',
  },
  {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_QUARTERLY_PRICE_ID || '',
    tier: 'PRO',
    cycle: 'QUARTERLY',
  },
  {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || '',
    tier: 'PRO',
    cycle: 'YEARLY',
  },

  // PREMIUM
  {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID || '',
    tier: 'PREMIUM',
    cycle: 'MONTHLY',
  },
  {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_QUARTERLY_PRICE_ID || '',
    tier: 'PREMIUM',
    cycle: 'QUARTERLY',
  },
  {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID || '',
    tier: 'PREMIUM',
    cycle: 'YEARLY',
  },
];

/**
 * Obter Price ID do Stripe para um plano específico
 */
export function getStripePriceId(tier: PlanTier, cycle: BillingCycle): string | null {
  if (tier === 'FREE') return null;

  const config = STRIPE_PRICE_MAP.find(
    (p) => p.tier === tier && p.cycle === cycle
  );

  return config?.priceId || null;
}

/**
 * Obter plano pelo Price ID do Stripe
 */
export function getPlanFromPriceId(priceId: string): StripePriceConfig | null {
  return STRIPE_PRICE_MAP.find((p) => p.priceId === priceId) || null;
}

/**
 * Obter nome do plano para o banco de dados
 */
export function getPlanKey(tier: PlanTier, cycle: BillingCycle): string {
  if (tier === 'FREE') return 'FREE';
  return `${tier}_${cycle}`;
}

/**
 * Obter configuração completa do plano
 */
export function getPlanWithStripeInfo(tier: PlanTier, cycle: BillingCycle) {
  const planConfig = PLANS[tier][cycle];
  const priceId = getStripePriceId(tier, cycle);
  const planKey = getPlanKey(tier, cycle);

  return {
    ...planConfig,
    priceId,
    planKey,
    tier,
  };
}

/**
 * Listar todos os planos disponíveis com informações do Stripe
 */
export function getAllPlansWithStripe() {
  const tiers: PlanTier[] = ['FREE', 'BASIC', 'PRO', 'PREMIUM'];
  const cycles: BillingCycle[] = ['MONTHLY', 'QUARTERLY', 'YEARLY'];

  return tiers.map((tier) => ({
    tier,
    plans: cycles.map((cycle) => getPlanWithStripeInfo(tier, cycle)),
  }));
}
