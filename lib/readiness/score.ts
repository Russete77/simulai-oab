/**
 * Readiness Score — estimativa de desempenho na 1ª fase da OAB.
 *
 * Projeta o número de acertos numa prova de 80 questões a partir da
 * acurácia recente do aluno por matéria, ponderada pela distribuição
 * oficial da prova. É uma ESTIMATIVA — o rótulo no produto deve deixar
 * isso claro.
 */

import { prisma } from "@/lib/db/prisma";
import {
  OAB_EXAM_DISTRIBUTION,
  OAB_PASSING_CORRECT,
  OAB_TOTAL_QUESTIONS,
  subjectLabel,
} from "@/lib/constants/exam";

const WINDOW_DAYS = 90;

// Suavização bayesiana: prior de 50% com peso de 4 respostas.
// Evita que 2 acertos em 2 questões virem "100% em Civil".
const PRIOR_ACCURACY = 0.5;
const PRIOR_WEIGHT = 4;

export interface SubjectReadiness {
  subject: string;
  label: string;
  weight: number; // questões desta matéria na prova
  answered: number;
  correct: number;
  accuracy: number; // suavizada (0-1)
  projectedCorrect: number; // weight * accuracy
  hasData: boolean;
}

export interface ReadinessResult {
  projectedCorrect: number; // 0-80
  projectedPercent: number; // 0-100
  passingScore: number; // 40
  totalQuestions: number; // 80
  passProbability: number; // 0-1 (estimativa)
  status: "green" | "yellow" | "red";
  confidence: "baixa" | "media" | "alta";
  answersConsidered: number;
  windowDays: number;
  subjects: SubjectReadiness[];
  weakSubjects: SubjectReadiness[];
  /**
   * Onde a projeção chega se as matérias fracas subirem para 60% de acerto.
   *
   * Mesma matemática do número principal, aplicada a um cenário concreto e
   * alcançável — é o que transforma "3%" de veredito em meta. O alvo de 60%
   * é o mesmo que já define uma matéria como fraca (ver `weakSubjects`).
   */
  potential: {
    projectedCorrect: number;
    projectedPercent: number;
    passProbability: number;
    /** Ganho em pontos percentuais na chance de passar. */
    gainPoints: number;
    /** Matérias que produzem esse ganho, da maior para a menor. */
    subjects: { subject: string; label: string }[];
  };
}

/** Probabilidade logística centrada na nota de corte. Escala 3.5 ≈ desvio
 *  típico de variação entre simulados. */
function passProbabilityFor(projectedCorrect: number): number {
  return 1 / (1 + Math.exp(-(projectedCorrect - OAB_PASSING_CORRECT) / 3.5));
}

export async function computeReadiness(userId: string): Promise<ReadinessResult> {
  const since = new Date();
  since.setDate(since.getDate() - WINDOW_DAYS);

  const answers = await prisma.userAnswer.findMany({
    where: { userId, createdAt: { gte: since } },
    select: {
      isCorrect: true,
      question: { select: { subject: true } },
    },
  });

  // Agregar por matéria
  const bySubject = new Map<string, { answered: number; correct: number }>();
  for (const a of answers) {
    const s = String(a.question.subject);
    const agg = bySubject.get(s) ?? { answered: 0, correct: 0 };
    agg.answered++;
    if (a.isCorrect) agg.correct++;
    bySubject.set(s, agg);
  }

  const subjects: SubjectReadiness[] = Object.entries(OAB_EXAM_DISTRIBUTION)
    .filter(([, weight]) => weight > 0)
    .map(([subject, weight]) => {
      const agg = bySubject.get(subject) ?? { answered: 0, correct: 0 };
      const accuracy =
        (agg.correct + PRIOR_ACCURACY * PRIOR_WEIGHT) /
        (agg.answered + PRIOR_WEIGHT);
      return {
        subject,
        label: subjectLabel(subject),
        weight,
        answered: agg.answered,
        correct: agg.correct,
        accuracy,
        projectedCorrect: weight * accuracy,
        hasData: agg.answered > 0,
      };
    });

  const projectedCorrect =
    Math.round(subjects.reduce((sum, s) => sum + s.projectedCorrect, 0) * 10) / 10;
  const projectedPercent = Math.round((projectedCorrect / OAB_TOTAL_QUESTIONS) * 100);

  const passProbability = passProbabilityFor(projectedCorrect);

  const status: ReadinessResult["status"] =
    projectedCorrect >= OAB_PASSING_CORRECT + 4
      ? "green"
      : projectedCorrect >= OAB_PASSING_CORRECT - 2
        ? "yellow"
        : "red";

  const answersConsidered = answers.length;
  const confidence: ReadinessResult["confidence"] =
    answersConsidered >= 200 ? "alta" : answersConsidered >= 50 ? "media" : "baixa";

  // Matérias fracas: onde há mais pontos a recuperar na prova
  // (peso da matéria × distância até 60% de acurácia)
  const weakSubjects = [...subjects]
    .map((s) => ({ ...s, gap: s.weight * Math.max(0, 0.6 - s.accuracy) }))
    .filter((s) => s.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3);

  // Cenário: as três matérias mais fracas chegam a 60% de acerto.
  const ganho = weakSubjects.reduce((sum, s) => sum + s.gap, 0);
  const potentialCorrect = Math.round((projectedCorrect + ganho) * 10) / 10;
  const potentialProbability = passProbabilityFor(potentialCorrect);

  return {
    potential: {
      projectedCorrect: potentialCorrect,
      projectedPercent: Math.round((potentialCorrect / OAB_TOTAL_QUESTIONS) * 100),
      passProbability: Math.round(potentialProbability * 100) / 100,
      gainPoints: Math.round((potentialProbability - passProbability) * 100),
      subjects: weakSubjects.map((s) => ({ subject: s.subject, label: s.label })),
    },
    projectedCorrect,
    projectedPercent,
    passingScore: OAB_PASSING_CORRECT,
    totalQuestions: OAB_TOTAL_QUESTIONS,
    passProbability: Math.round(passProbability * 100) / 100,
    status,
    confidence,
    answersConsidered,
    windowDays: WINDOW_DAYS,
    subjects,
    weakSubjects,
  };
}
