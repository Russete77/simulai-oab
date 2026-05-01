/**
 * Configuração dos planos de assinatura
 *
 * IMPORTANTE: Todos os planos são RECORRÊNCIA MENSAL via Asaas.
 * Sem trimestral, sem anual, sem trial. Payment-only.
 *
 * ESSENCIAL → R$ 19,99 → Tudo liberado, sem IA
 * PRO       → R$ 89,99 → Tudo + IA integrada + Chat IA
 *
 * Usuários novos nascem sem Subscription. gate.ts bloqueia tudo até pagar.
 * Recovery campaigns disparam por push/email pra trazer de volta.
 */

export type PlanTier = 'BASIC' | 'PRO' | 'PREMIUM';

// Apenas MONTHLY — sem trimestral/anual
export type BillingCycle = 'MONTHLY';

export interface PlanConfig {
  name: string;
  description: string;
  monthlyValue: number;
  value: number;
  discount: number;
  cycle: BillingCycle;
  features: string[];
}

export const PLANS: Record<PlanTier, Record<BillingCycle, PlanConfig>> = {
  // BASIC = Essencial (R$ 19,99/mês) — SEM IA
  BASIC: {
    MONTHLY: {
      name: 'Essencial',
      description: 'Tudo que você precisa para estudar',
      monthlyValue: 19.99,
      value: 19.99,
      discount: 0,
      cycle: 'MONTHLY',
      features: [
        'Questões ilimitadas',
        'Simulados ilimitados',
        '5.605 questões (banco completo)',
        'Analytics avançado por matéria',
        'Revisão de erros completa',
        'Simulados adaptativos',
        'Flashcards',
        'Desafios semanais',
        'Ranking com badges',
        'Acesso offline (PWA)',
      ],
    },
  },

  // PRO = Pro (R$ 89,99/mês) — COM IA
  PRO: {
    MONTHLY: {
      name: 'Pro',
      description: 'Estudo turbinado com inteligência artificial',
      monthlyValue: 89.99,
      value: 89.99,
      discount: 0,
      cycle: 'MONTHLY',
      features: [
        'Tudo do plano Essencial',
        'Explicações por IA ilimitadas',
        'Chat com IA ilimitado',
        'Revisão de erros com IA',
        'Coaching virtual com IA',
        'Relatórios em PDF',
        'Analytics completo + Predições',
        'Suporte prioritário',
        'Badge exclusivo Pro',
        'Acesso antecipado a novidades',
      ],
    },
  },

  // PREMIUM mantido por compatibilidade (redireciona pra PRO)
  PREMIUM: {
    MONTHLY: {
      name: 'Pro',
      description: 'Estudo turbinado com inteligência artificial',
      monthlyValue: 89.99,
      value: 89.99,
      discount: 0,
      cycle: 'MONTHLY',
      features: [
        'Tudo do plano Essencial',
        'Explicações por IA ilimitadas',
        'Chat com IA ilimitado',
        'Revisão de erros com IA',
        'Coaching virtual com IA',
        'Relatórios em PDF',
        'Analytics completo + Predições',
        'Suporte prioritário',
        'Badge exclusivo Pro',
        'Acesso antecipado a novidades',
      ],
    },
  },
};

/**
 * Obter configuração de um plano
 */
export function getPlanConfig(tier: PlanTier, cycle: BillingCycle = 'MONTHLY'): PlanConfig {
  return PLANS[tier][cycle];
}

/**
 * Obter nome do plano para o banco
 */
export function getPlanKey(tier: PlanTier): string {
  return `${tier}_MONTHLY`;
}

/**
 * Parsear plano do banco
 */
export function parsePlanKey(planKey: string): { tier: PlanTier; cycle: BillingCycle } {
  const [tier] = planKey.split('_') as [PlanTier];
  return { tier, cycle: 'MONTHLY' };
}
