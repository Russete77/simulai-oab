/**
 * O pulso do app: quanta gente está estudando.
 *
 * POR QUE NÃO É SÓ UM CONTADOR DE PRESENÇA
 *
 * Medido em 03/09/2026, sobre 30 dias reais de uso:
 *
 *   pico de pessoas simultâneas ......... 2   (nunca 3)
 *   janelas de 15 min com 1 pessoa só ... 95,3%
 *   janelas de 15 min sem ninguém ....... 93,4%
 *
 * Um contador ao vivo marcaria zero quase sempre, e quando marcasse "1"
 * seria a própria pessoa que está olhando. Isso não é prova social, é
 * atestado de vazio — ainda mais numa página que existe para dar a sensação
 * de que tem gente estudando junto.
 *
 * A causa é o público ser pequeno E assíncrono: cada um estuda no seu
 * horário, e o uso não se sobrepõe no tempo. Já o mesmo dia, somado, dá
 * 155 respostas de 10 pessoas — número honesto e que mostra vida.
 *
 * Então a regra é: mostra presença quando ela for digna de ser mostrada, e
 * o acumulado quando não for. Conforme a base crescer, a página passa a
 * mostrar presença sozinha, sem ninguém precisar mexer aqui.
 */

import { prisma } from '@/lib/db/prisma';

/** Quem respondeu questão nos últimos 15 min conta como "agora". */
const JANELA_PRESENCA_MIN = 15;

/**
 * A partir de quantas pessoas vale mostrar presença.
 *
 * Três, e não duas: quem está olhando pode ser uma delas, e "2 pessoas
 * resolvendo agora" quando uma é você mesmo continua parecendo deserto.
 */
export const MINIMO_PARA_PRESENCA = 3;

export interface Pulso {
  /** 'presenca' = tem gente agora. 'periodo' = mostra o acumulado do dia. */
  modo: 'presenca' | 'periodo';
  /** Pessoas distintas que responderam questão nos últimos 15 min. */
  agora: number;
  respostas24h: number;
  pessoas24h: number;
}

export function modoDoPulso(agora: number): Pulso['modo'] {
  return agora >= MINIMO_PARA_PRESENCA ? 'presenca' : 'periodo';
}

export async function lerPulso(): Promise<Pulso> {
  const desde = (min: number) => new Date(Date.now() - min * 60_000);

  // Sequenciais de propósito, não Promise.all: com connection_limit=1 as
  // paralelas estouram o pool (P2024). Mesma razão do getPublicLeaderboard.
  const presentes = await prisma.userAnswer.findMany({
    where: { createdAt: { gte: desde(JANELA_PRESENCA_MIN) } },
    select: { userId: true },
    distinct: ['userId'],
  });

  const respostas24h = await prisma.userAnswer.count({
    where: { createdAt: { gte: desde(24 * 60) } },
  });

  const pessoas24h = await prisma.userAnswer.findMany({
    where: { createdAt: { gte: desde(24 * 60) } },
    select: { userId: true },
    distinct: ['userId'],
  });

  const agora = presentes.length;

  return {
    modo: modoDoPulso(agora),
    agora,
    respostas24h,
    pessoas24h: pessoas24h.length,
  };
}
