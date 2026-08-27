/**
 * Plano único do Simulai OAB.
 *
 * R$ 9,99/mês, recorrente, só cartão. Um plano — não existe tier, não existe
 * upgrade, não existe ciclo alternativo. Quem tem assinatura ativa tem tudo.
 *
 * Por que só cartão: conta Stripe brasileira não faz Pix recorrente (Pix
 * Automático não está disponível no Brasil) e boleto custa R$ 3,45 por
 * cobrança — 34% de um ticket de R$ 9,99, além de não aceitar estorno.
 * Ver _PLANO-CLAUDE/ANALISE-STRIPE-2026.md.
 */

export const PLANO = {
  nome: 'Simulai OAB',
  descricao: 'Acesso completo, mensal, sem fidelidade',
  /** Em centavos, como a Stripe exige. */
  valorCentavos: 999,
  moeda: 'brl',
  intervalo: 'month',
  /** Rótulo pronto para a interface. */
  precoFormatado: 'R$ 9,99',
  beneficios: [
    '5.875 questões oficiais da FGV',
    'Simulados ilimitados no formato do exame',
    'Filtro por matéria',
    'Plano de estudos personalizado',
    'Explicações com IA',
    'Analytics de desempenho',
    'Acesso offline (PWA)',
  ],
} as const;

/** ID do Price criado no painel da Stripe. */
export function getPriceId(): string {
  const id = process.env.STRIPE_PRICE_ID;
  if (!id) {
    throw new Error(
      'STRIPE_PRICE_ID não configurada. Crie o produto de R$ 9,99/mês no painel da Stripe e copie o ID do preço (price_...).'
    );
  }
  return id;
}

/** Chave gravada em Subscription.plan, para leitura humana nos relatórios. */
export const PLAN_KEY = 'SIMULAI_MENSAL';
