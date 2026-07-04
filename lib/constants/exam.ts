/**
 * Estrutura oficial da 1ª fase do Exame de Ordem (FGV).
 * Fonte única — usada pelo gerador de simulados e pelo Readiness Score.
 */

import type { Subject } from "@prisma/client";

/** Distribuição aproximada de questões por matéria na prova de 80 questões */
export const OAB_EXAM_DISTRIBUTION: Record<string, number> = {
  ETHICS: 8,
  CONSTITUTIONAL: 7,
  CIVIL: 7,
  CIVIL_PROCEDURE: 6,
  CRIMINAL: 6,
  CRIMINAL_PROCEDURE: 6,
  LABOUR: 6,
  LABOUR_PROCEDURE: 5,
  ADMINISTRATIVE: 5,
  TAXES: 5,
  BUSINESS: 5,
  CONSUMER: 5,
  ENVIRONMENTAL: 4,
  CHILDREN: 3,
  INTERNATIONAL: 2,
  HUMAN_RIGHTS: 0,
};

export const OAB_TOTAL_QUESTIONS = 80;

/** Mínimo de acertos para aprovação na 1ª fase (50%) */
export const OAB_PASSING_CORRECT = 40;

/** Rótulos em português das matérias (Subject enum) */
export const SUBJECT_LABELS: Record<string, string> = {
  ETHICS: "Ética Profissional",
  CONSTITUTIONAL: "Direito Constitucional",
  CIVIL: "Direito Civil",
  CIVIL_PROCEDURE: "Processo Civil",
  CRIMINAL: "Direito Penal",
  CRIMINAL_PROCEDURE: "Processo Penal",
  LABOUR: "Direito do Trabalho",
  LABOUR_PROCEDURE: "Processo do Trabalho",
  ADMINISTRATIVE: "Direito Administrativo",
  TAXES: "Direito Tributário",
  BUSINESS: "Direito Empresarial",
  CONSUMER: "Direito do Consumidor",
  ENVIRONMENTAL: "Direito Ambiental",
  CHILDREN: "ECA",
  INTERNATIONAL: "Direito Internacional",
  HUMAN_RIGHTS: "Direitos Humanos",
  GENERAL: "Geral",
};

export function subjectLabel(subject: Subject | string): string {
  return SUBJECT_LABELS[String(subject)] ?? String(subject);
}
