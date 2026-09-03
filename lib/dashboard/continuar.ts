import { prisma } from '@/lib/db/prisma';
import { OAB_EXAM_DISTRIBUTION, subjectLabel } from '@/lib/constants/exam';

/** Meta diária de questões. É o tamanho de uma sessão que se termina. */
export const META_DIARIA = 20;

const JANELA_DIAS = 90;

// Mesma suavização bayesiana do Readiness Score: prior de 50% com peso de 4
// respostas. Sem isso, 5 erros seguidos viram "0% de acerto" e a tela mostra
// um número que parece quebrado.
const PRIOR_ACCURACY = 0.5;
const PRIOR_WEIGHT = 4;

// Alvo que define uma matéria como fraca — o mesmo usado em lib/readiness.
const ALVO_ACERTO = 0.6;

export interface Continuacao {
  /** Questões respondidas hoje. */
  hoje: number;
  /** Quantas faltam para fechar a meta do dia. */
  faltam: number;
  /** Simulado em andamento, se houver — tem prioridade sobre praticar. */
  simuladoEmAndamento: { id: string; respondidas: number; total: number } | null;
  /** Matéria com pior acerto e amostra suficiente. */
  materiaFoco: { subject: string; label: string; acerto: number } | null;
  /** Dias com pelo menos uma resposta nos últimos 7 dias. */
  diasNaSemana: number;
}

/**
 * O que a pessoa deve fazer agora.
 *
 * O dashboard antes abria com seis atalhos de peso igual e nenhum deles
 * continuava o que estava acontecendo. Isto resolve a pergunta "e agora?"
 * antes de oferecer qualquer destino.
 */
export async function getContinuacao(userId: string): Promise<Continuacao> {
  const inicioDoDia = new Date();
  inicioDoDia.setHours(0, 0, 0, 0);

  const seteDias = new Date();
  seteDias.setDate(seteDias.getDate() - 6);
  seteDias.setHours(0, 0, 0, 0);

  const janela = new Date();
  janela.setDate(janela.getDate() - JANELA_DIAS);

  const [hoje, emAndamento, respostasJanela, respostasSemana] = await Promise.all([
    prisma.userAnswer.count({
      where: { userId, createdAt: { gte: inicioDoDia } },
    }),
    prisma.simulation.findFirst({
      where: { userId, status: 'IN_PROGRESS' },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        totalQuestions: true,
        _count: { select: { answers: true } },
      },
    }),
    prisma.userAnswer.findMany({
      where: { userId, createdAt: { gte: janela } },
      select: { isCorrect: true, question: { select: { subject: true } } },
    }),
    prisma.userAnswer.findMany({
      where: { userId, createdAt: { gte: seteDias } },
      select: { createdAt: true },
    }),
  ]);

  // Matéria de foco — MESMO critério do Readiness Score, de propósito.
  //
  // Antes isto usava acerto cru com amostra mínima de 5, e o dashboard
  // mostrava duas respostas diferentes para "sua matéria mais fraca": o card
  // de prontidão dizia Constitucional, o rodapé dizia Consumidor com 0%.
  // O que importa não é o menor acerto, é onde há mais PONTOS DE PROVA a
  // recuperar: peso da matéria no exame × distância até 60% de acerto.
  const porMateria = new Map<string, { total: number; certas: number }>();
  for (const r of respostasJanela) {
    const s = String(r.question.subject);
    const agg = porMateria.get(s) ?? { total: 0, certas: 0 };
    agg.total++;
    if (r.isCorrect) agg.certas++;
    porMateria.set(s, agg);
  }

  let materiaFoco: Continuacao['materiaFoco'] = null;
  let melhorGanho = 0;
  for (const [subject, agg] of porMateria) {
    const peso = OAB_EXAM_DISTRIBUTION[subject as keyof typeof OAB_EXAM_DISTRIBUTION] ?? 0;
    if (peso <= 0) continue;

    const acuracia =
      (agg.certas + PRIOR_ACCURACY * PRIOR_WEIGHT) / (agg.total + PRIOR_WEIGHT);
    const ganho = peso * Math.max(0, ALVO_ACERTO - acuracia);

    if (ganho > melhorGanho) {
      melhorGanho = ganho;
      materiaFoco = {
        subject,
        label: subjectLabel(subject),
        acerto: Math.round(acuracia * 100),
      };
    }
  }

  const dias = new Set(respostasSemana.map((r) => r.createdAt.toDateString()));

  return {
    hoje,
    faltam: Math.max(0, META_DIARIA - hoje),
    simuladoEmAndamento: emAndamento
      ? {
          id: emAndamento.id,
          respondidas: emAndamento._count.answers,
          total: emAndamento.totalQuestions,
        }
      : null,
    materiaFoco,
    diasNaSemana: dias.size,
  };
}
