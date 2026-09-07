/**
 * O tamanho do banco de questões — em UM lugar.
 *
 * Existia espalhado: "5.875" aparecia 47 vezes em 20 arquivos, copiado à
 * mão. Além de ser trabalhoso de mudar, estava errado — o banco tem 5.857
 * linhas, mas 2.250 são duplicatas do mesmo enunciado dentro do mesmo
 * exame. O número de questões DISTINTAS que alguém encontra é 3.607.
 *
 * Anunciar 5.875 era 63% acima do real, num nicho onde o comprador é
 * estudante de Direito e confere.
 *
 * `scripts/auditar-questoes.ts` compara esta constante com o banco e
 * reclama se divergirem — é lá que a mentira volta a ser pega.
 */

/** Enunciados distintos, sem contar duplicata nem questão anulada. */
export const TOTAL_QUESTOES = 3607;

/** Como escrever em texto. Sempre por aqui, nunca à mão. */
export const TOTAL_QUESTOES_FORMATADO = TOTAL_QUESTOES.toLocaleString('pt-BR');

/** Exames cobertos, de 2010 até o mais recente. */
export const TOTAL_EXAMES = 46;
