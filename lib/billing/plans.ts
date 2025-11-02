/**
 * Configuração dos planos de assinatura
 */

export type PlanTier = 'FREE' | 'BASIC' | 'PRO' | 'PREMIUM';
export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface PlanConfig {
  name: string;
  description: string;
  monthlyValue: number; // Valor mensal equivalente
  value: number; // Valor a ser cobrado
  discount: number; // Percentual de desconto
  cycle: BillingCycle;
  features: string[];
}

export const PLANS: Record<PlanTier, Record<BillingCycle, PlanConfig>> = {
  FREE: {
    MONTHLY: {
      name: 'Plano Free',
      description: 'Para começar a estudar',
      monthlyValue: 0,
      value: 0,
      discount: 0,
      cycle: 'MONTHLY',
      features: [
        '20 questões por dia',
        '2 simulados por mês',
        '500 questões no banco',
        'Analytics básico',
        'Ranking público',
      ],
    },
    QUARTERLY: {
      name: 'Plano Free',
      description: 'Para começar a estudar',
      monthlyValue: 0,
      value: 0,
      discount: 0,
      cycle: 'QUARTERLY',
      features: [],
    },
    YEARLY: {
      name: 'Plano Free',
      description: 'Para começar a estudar',
      monthlyValue: 0,
      value: 0,
      discount: 0,
      cycle: 'YEARLY',
      features: [],
    },
  },

  BASIC: {
    MONTHLY: {
      name: 'Básico Mensal',
      description: 'Para estudantes iniciantes',
      monthlyValue: 49.9,
      value: 49.9,
      discount: 0,
      cycle: 'MONTHLY',
      features: [
        '50 questões por dia',
        '5 simulados por mês',
        '2.000 questões no banco',
        '5 explicações IA por dia',
        'Analytics médio',
        'Revisão de erros básica',
        'Ranking completo',
        'Acesso offline (PWA)',
      ],
    },
    QUARTERLY: {
      name: 'Básico Trimestral',
      description: 'Economia de 13%',
      monthlyValue: 43.3,
      value: 129.9,
      discount: 13,
      cycle: 'QUARTERLY',
      features: [
        '50 questões por dia',
        '5 simulados por mês',
        '2.000 questões no banco',
        '5 explicações IA por dia',
        'Analytics médio',
        'Revisão de erros básica',
        'Ranking completo',
        'Acesso offline (PWA)',
      ],
    },
    YEARLY: {
      name: 'Básico Anual',
      description: 'Economia de 40% - MELHOR CUSTO-BENEFÍCIO',
      monthlyValue: 29.99,
      value: 359.9,
      discount: 40,
      cycle: 'YEARLY',
      features: [
        '50 questões por dia',
        '5 simulados por mês',
        '2.000 questões no banco',
        '5 explicações IA por dia',
        'Analytics médio',
        'Revisão de erros básica',
        'Ranking completo',
        'Acesso offline (PWA)',
      ],
    },
  },

  PRO: {
    MONTHLY: {
      name: 'Pro Mensal',
      description: 'Para estudantes sérios',
      monthlyValue: 89.9,
      value: 89.9,
      discount: 0,
      cycle: 'MONTHLY',
      features: [
        'Questões ilimitadas',
        '10 simulados por mês',
        '5.605 questões (banco completo)',
        '20 explicações IA por dia',
        '10 conversas chat IA por dia',
        'Analytics avançado',
        'Revisão de erros avançada',
        'Simulados adaptativos',
        'Planos de estudo personalizados',
        'Relatórios em PDF',
        'Ranking com badges',
      ],
    },
    QUARTERLY: {
      name: 'Pro Trimestral',
      description: 'Economia de 11%',
      monthlyValue: 79.96,
      value: 239.9,
      discount: 11,
      cycle: 'QUARTERLY',
      features: [
        'Questões ilimitadas',
        '10 simulados por mês',
        '5.605 questões (banco completo)',
        '20 explicações IA por dia',
        '10 conversas chat IA por dia',
        'Analytics avançado',
        'Revisão de erros avançada',
        'Simulados adaptativos',
        'Planos de estudo personalizados',
        'Relatórios em PDF',
        'Ranking com badges',
      ],
    },
    YEARLY: {
      name: 'Pro Anual',
      description: 'Economia de 39% - MAIS POPULAR',
      monthlyValue: 54.16,
      value: 649.9,
      discount: 39,
      cycle: 'YEARLY',
      features: [
        'Questões ilimitadas',
        '10 simulados por mês',
        '5.605 questões (banco completo)',
        '20 explicações IA por dia',
        '10 conversas chat IA por dia',
        'Analytics avançado',
        'Revisão de erros avançada',
        'Simulados adaptativos',
        'Planos de estudo personalizados',
        'Relatórios em PDF',
        'Ranking com badges',
      ],
    },
  },

  PREMIUM: {
    MONTHLY: {
      name: 'Premium Mensal',
      description: 'Para garantir a aprovação',
      monthlyValue: 129.9,
      value: 129.9,
      discount: 0,
      cycle: 'MONTHLY',
      features: [
        'Tudo do plano PRO',
        'Explicações IA ILIMITADAS',
        'Chat IA ILIMITADO',
        'Simulados ilimitados',
        'Revisão de erros com IA',
        'Analytics completo + Predições',
        'Suporte prioritário',
        'Coaching virtual IA',
        'Badge exclusivo Top 10',
        'Acesso antecipado a novidades',
      ],
    },
    QUARTERLY: {
      name: 'Premium Trimestral',
      description: 'Economia de 10%',
      monthlyValue: 116.63,
      value: 349.9,
      discount: 10,
      cycle: 'QUARTERLY',
      features: [
        'Tudo do plano PRO',
        'Explicações IA ILIMITADAS',
        'Chat IA ILIMITADO',
        'Simulados ilimitados',
        'Revisão de erros com IA',
        'Analytics completo + Predições',
        'Suporte prioritário',
        'Coaching virtual IA',
        'Badge exclusivo Top 10',
        'Acesso antecipado a novidades',
      ],
    },
    YEARLY: {
      name: 'Premium Anual',
      description: 'Economia de 42% - MELHOR INVESTIMENTO',
      monthlyValue: 74.99,
      value: 899.9,
      discount: 42,
      cycle: 'YEARLY',
      features: [
        'Tudo do plano PRO',
        'Explicações IA ILIMITADAS',
        'Chat IA ILIMITADO',
        'Simulados ilimitados',
        'Revisão de erros com IA',
        'Analytics completo + Predições',
        'Suporte prioritário',
        'Coaching virtual IA',
        'Badge exclusivo Top 10',
        'Acesso antecipado a novidades',
      ],
    },
  },
};

/**
 * Obter configuração de um plano
 */
export function getPlanConfig(tier: PlanTier, cycle: BillingCycle): PlanConfig {
  return PLANS[tier][cycle];
}

/**
 * Calcular economia anual
 */
export function calculateYearlySavings(tier: PlanTier): number {
  const monthly = PLANS[tier].MONTHLY.monthlyValue;
  const yearly = PLANS[tier].YEARLY.value;
  return monthly * 12 - yearly;
}

/**
 * Obter nome do plano para o banco
 */
export function getPlanKey(tier: PlanTier, cycle: BillingCycle): string {
  if (tier === 'FREE') return 'FREE';
  return `${tier}_${cycle}`; // Ex: "PRO_YEARLY"
}

/**
 * Parsear plano do banco
 */
export function parsePlanKey(planKey: string): { tier: PlanTier; cycle: BillingCycle } {
  if (planKey === 'FREE') {
    return { tier: 'FREE', cycle: 'MONTHLY' };
  }

  const [tier, cycle] = planKey.split('_') as [PlanTier, BillingCycle];
  return { tier, cycle };
}
