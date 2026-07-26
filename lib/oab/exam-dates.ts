/**
 * Datas oficiais do calendário FGV/OAB 2026-2027 — fonte única, usada pela
 * API pública (/api/oab/exam-dates) e por qualquer outro lugar que precise
 * da data real da próxima prova (ex: e-mails de lifecycle). Antes esses
 * dados só existiam dentro do route.ts da API, sem export — outros lugares
 * do app que precisam da mesma data tinham que reimplementar ou, pior,
 * inventar um número.
 *
 * Fontes: https://oab.estrategia.com/portal/calendario-oab/
 *         https://www.provadaordem.com.br/blog/post/calendario-oab-2026/
 * Atualizado em 04/07/2026 — 46º já realizado (1ª fase 03/05, 2ª fase 21/06);
 * 47º e 48º corrigidos para o cronograma vigente; 49º adicionado.
 * Datas sujeitas a alteração pela banca — revisar a cada novo edital.
 */

export interface OABExamDate {
  id: string;
  name: string;
  date: string;
  phase: number;
}

export const OAB_EXAM_DATES: OABExamDate[] = [
  { id: '47', name: '47º Exame de Ordem', date: '2026-09-06T13:00:00-03:00', phase: 1 },
  { id: '47-2', name: '47º Exame de Ordem - 2ª Fase', date: '2026-10-18T13:00:00-03:00', phase: 2 },
  { id: '48', name: '48º Exame de Ordem', date: '2027-01-10T13:00:00-03:00', phase: 1 },
  { id: '48-2', name: '48º Exame de Ordem - 2ª Fase', date: '2027-02-28T13:00:00-03:00', phase: 2 },
  { id: '49', name: '49º Exame de Ordem', date: '2027-05-09T13:00:00-03:00', phase: 1 },
  { id: '49-2', name: '49º Exame de Ordem - 2ª Fase', date: '2027-07-04T13:00:00-03:00', phase: 2 },
];

/** Próximas provas em ordem cronológica (a partir de agora). */
export function getUpcomingExams(now: Date = new Date()): OABExamDate[] {
  return [...OAB_EXAM_DATES]
    .filter((exam) => new Date(exam.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/** Próxima prova (1ª ou 2ª fase, o que vier primeiro). */
export function getNextExam(now: Date = new Date()): OABExamDate | null {
  return getUpcomingExams(now)[0] ?? null;
}

/** Próxima prova de 1ª fase especificamente — é o que importa pro público
 * do produto hoje (banco de questões objetivas). */
export function getNextFirstPhaseExam(now: Date = new Date()): OABExamDate | null {
  return getUpcomingExams(now).find((e) => e.phase === 1) ?? null;
}

/** Dias inteiros até a próxima prova de 1ª fase (arredondado pra baixo). */
export function getDaysUntilNextFirstPhaseExam(now: Date = new Date()): number | null {
  const exam = getNextFirstPhaseExam(now);
  if (!exam) return null;
  const diffMs = new Date(exam.date).getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / (24 * 3600 * 1000)));
}
