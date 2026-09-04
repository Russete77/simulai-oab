/**
 * Leitura dos slugs de exame e nomes de matéria.
 *
 * Vive aqui porque duas rotas usam: a página do exame (/simulado/[slug]) e o
 * simulado jogável (/simulado/[slug]/jogar). Ter o parser copiado nas duas
 * significaria uma aceitar um slug que a outra recusa.
 */

const ROMANOS: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export function paraRomano(n: number): string {
  let resto = n;
  let saida = '';
  for (const [valor, letra] of ROMANOS) {
    while (resto >= valor) {
      saida += letra;
      resto -= valor;
    }
  }
  return saida;
}

export interface ExameDoSlug {
  examId: string;
  label: string;
  examNumber: number;
  phase: number;
}

/**
 * Aceita `oab-42`, `oab-42-fase-1`, `2026-1` e `2026-01`.
 *
 * O `2026-01` — com zero à esquerda — é o formato do `examId` no banco, e é
 * o que `generateStaticParams` e o sitemap publicam. A versão anterior desta
 * função exigia UM dígito depois do traço, então todas as 43 URLs de
 * simulado do sitemap respondiam 404. Batia com os 96 "Não encontrado" do
 * Search Console.
 */
export function lerSlugDoExame(slug: string): ExameDoSlug | null {
  const oab = slug.match(/^oab-(\d+)(?:-fase-(\d))?$/);
  if (oab) {
    const examNumber = parseInt(oab[1], 10);
    const phase = parseInt(oab[2] || '1', 10);
    return { examId: `oab-${examNumber}`, label: `OAB ${paraRomano(examNumber)}`, examNumber, phase };
  }

  const ano = slug.match(/^(\d{4})-(\d{1,2})$/);
  if (ano) {
    const fase = parseInt(ano[2], 10);
    return {
      examId: `${ano[1]}-${String(fase).padStart(2, '0')}`,
      label: `OAB ${ano[1]}`,
      examNumber: 0,
      phase: fase,
    };
  }

  return null;
}

export const NOMES_DE_MATERIA: Record<string, string> = {
  ETHICS: 'Ética e Estatuto',
  CONSTITUTIONAL: 'Constitucional',
  CIVIL: 'Civil',
  CIVIL_PROCEDURE: 'Processo Civil',
  CRIMINAL: 'Penal',
  CRIMINAL_PROCEDURE: 'Processo Penal',
  LABOUR: 'Trabalho',
  LABOUR_PROCEDURE: 'Processo do Trabalho',
  ADMINISTRATIVE: 'Administrativo',
  TAXES: 'Tributário',
  BUSINESS: 'Empresarial',
  CONSUMER: 'Consumidor',
  ENVIRONMENTAL: 'Ambiental',
  CHILDREN: 'ECA',
  INTERNATIONAL: 'Internacional',
  HUMAN_RIGHTS: 'Direitos Humanos',
  GENERAL: 'Geral',
};

export function nomeDaMateria(chave: string): string {
  return NOMES_DE_MATERIA[chave] ?? chave;
}

/** Acertos necessários na 1ª fase. 40 de 80 — o corte oficial da FGV. */
export const CORTE_APROVACAO = 40;
export const TOTAL_DA_PROVA = 80;
