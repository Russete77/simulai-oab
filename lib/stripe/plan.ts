/**
 * Plano do Simulai OAB: um produto, quatro formas de pagar.
 *
 * R$ 9,99/mês é o preço de referência. Quem paga adiantado paga menos por
 * mês — 5% no trimestre, 10% no semestre, 15% no ano. É sempre o mesmo
 * acesso: não existe tier, não existe recurso reservado para quem paga mais.
 *
 * Por que só cartão: conta Stripe brasileira não faz Pix recorrente (Pix
 * Automático não está disponível no Brasil) e boleto custa R$ 3,45 por
 * cobrança — 34% de um ticket de R$ 9,99, além de não aceitar estorno.
 * Ver _PLANO-CLAUDE/ANALISE-STRIPE-2026.md.
 *
 * Os valores totais são LITERAIS de propósito. Derivar de porcentagem em
 * tempo de execução deixa arredondamento de centavo decidindo preço; o teste
 * em __tests__/billing/ciclos.test.ts confere que batem com a conta.
 */

export type CicloChave = 'mensal' | 'trimestral' | 'semestral' | 'anual';

export interface Ciclo {
  chave: CicloChave;
  /** Identificador do Price na Stripe. Vale por modo: o de teste e o de live são objetos diferentes com a mesma chave. */
  lookupKey: string;
  meses: number;
  /** Desconto sobre 12 × R$ 9,99. Zero no mensal. */
  descontoPercent: number;
  /** Cobrado de uma vez, a cada período. */
  totalCentavos: number;
  /** Recorrência na Stripe. */
  intervalo: 'month' | 'year';
  intervaloContagem: number;
  /** Como aparece no seletor. */
  rotulo: string;
  /** Como aparece na confirmação: "cobrado todo mês". */
  rotuloCobranca: string;
  /** Gravado em Subscription.cycle. */
  cicloBanco: string;
}

export const PLANO = {
  nome: 'Simulai OAB',
  descricao: 'Acesso completo, sem fidelidade',
  moeda: 'brl',
  /** Preço de referência por mês, sem desconto. */
  baseCentavos: 999,
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

export const CICLOS: readonly Ciclo[] = [
  {
    chave: 'mensal',
    lookupKey: 'simulai_mensal',
    meses: 1,
    descontoPercent: 0,
    totalCentavos: 999,
    intervalo: 'month',
    intervaloContagem: 1,
    rotulo: 'Mensal',
    rotuloCobranca: 'todo mês',
    cicloBanco: 'MONTHLY',
  },
  {
    chave: 'trimestral',
    lookupKey: 'simulai_trimestral',
    meses: 3,
    descontoPercent: 5,
    totalCentavos: 2847,
    intervalo: 'month',
    intervaloContagem: 3,
    rotulo: 'Trimestral',
    rotuloCobranca: 'a cada 3 meses',
    cicloBanco: 'QUARTERLY',
  },
  {
    chave: 'semestral',
    lookupKey: 'simulai_semestral',
    meses: 6,
    descontoPercent: 10,
    totalCentavos: 5395,
    intervalo: 'month',
    intervaloContagem: 6,
    rotulo: 'Semestral',
    rotuloCobranca: 'a cada 6 meses',
    cicloBanco: 'SEMIANNUAL',
  },
  {
    chave: 'anual',
    lookupKey: 'simulai_anual',
    meses: 12,
    descontoPercent: 15,
    totalCentavos: 10190,
    intervalo: 'year',
    intervaloContagem: 1,
    rotulo: 'Anual',
    rotuloCobranca: 'uma vez por ano',
    cicloBanco: 'ANNUAL',
  },
] as const;

export const CICLO_PADRAO: CicloChave = 'mensal';

export function ehCicloChave(valor: unknown): valor is CicloChave {
  return CICLOS.some((c) => c.chave === valor);
}

/** O ciclo pedido, ou o mensal se vier lixo. Nunca lança: entrada vem do cliente. */
export function ciclo(chave: unknown): Ciclo {
  return CICLOS.find((c) => c.chave === chave) ?? CICLOS[0];
}

export function formatarBRL(centavos: number): string {
  return `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`;
}

/** Preço equivalente por mês — é o número que deixa o desconto visível. */
export function porMesCentavos(c: Ciclo): number {
  return Math.round(c.totalCentavos / c.meses);
}

/** Quanto se economiza no período, comparado a pagar mês a mês. */
export function economiaCentavos(c: Ciclo): number {
  return PLANO.baseCentavos * c.meses - c.totalCentavos;
}

/** Rótulo do mensal, usado onde ainda se fala de "o preço" no singular. */
export const PRECO_BASE_FORMATADO = formatarBRL(PLANO.baseCentavos);

/** Chave gravada em Subscription.plan, para leitura humana nos relatórios. */
export const PLAN_KEY = 'SIMULAI';
