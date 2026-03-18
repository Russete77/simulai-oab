import { SimulationType } from '@prisma/client';

/**
 * Traduções dos tipos de simulado
 */
export const SIMULATION_TYPE_LABELS: Record<SimulationType, string> = {
  FULL_EXAM: 'Simulado Completo',
  ADAPTIVE: 'Simulado Adaptativo',
  QUICK_PRACTICE: 'Prática Rápida',
  ERROR_REVIEW: 'Revisão de Erros',
  BY_SUBJECT: 'Por Matéria',
};

/**
 * Descrições dos tipos de simulado
 */
export const SIMULATION_TYPE_DESCRIPTIONS: Record<SimulationType, string> = {
  FULL_EXAM: 'Formato oficial da OAB com 80 questões',
  ADAPTIVE: 'Questões que se ajustam ao seu nível',
  QUICK_PRACTICE: 'Teste rápido para revisão',
  ERROR_REVIEW: 'Refaça questões que você errou',
  BY_SUBJECT: 'Questões de uma matéria específica',
};

/**
 * Informações de tempo estimado
 */
export const SIMULATION_TYPE_TIME: Record<SimulationType, string> = {
  FULL_EXAM: '5 horas',
  ADAPTIVE: '2 horas',
  QUICK_PRACTICE: '1 hora',
  ERROR_REVIEW: 'Livre',
  BY_SUBJECT: '2-3 horas',
};

/**
 * Quantidade de questões por tipo
 */
export const SIMULATION_TYPE_QUESTIONS: Record<SimulationType, string> = {
  FULL_EXAM: '80 questões',
  ADAPTIVE: '40 questões',
  QUICK_PRACTICE: '20 questões',
  ERROR_REVIEW: '30 questões',
  BY_SUBJECT: '50 questões',
};
