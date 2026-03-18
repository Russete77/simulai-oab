/**
 * Constantes de gamificação
 *
 * Centraliza todos os valores relacionados ao sistema de gamificação
 * para facilitar ajustes e manutenção.
 */

export const GAMIFICATION_CONSTANTS = {
  // Pontuação
  POINTS_PER_CORRECT_ANSWER: 10,
  POINTS_MULTIPLIER_STREAK: 1.5,
  POINTS_BONUS_FAST_ANSWER: 5, // Resposta em menos de 30s

  // Níveis
  POINTS_PER_LEVEL: 100,
  MAX_LEVEL: 100,

  // Streaks
  MAX_STREAK_DAYS: 365,
  STREAK_BREAK_HOURS: 48, // Quebra streak após 48h sem atividade

  // Metas
  DEFAULT_DAILY_GOAL: 20,
  MIN_DAILY_GOAL: 5,
  MAX_DAILY_GOAL: 100,

  // Questões
  QUESTION_FETCH_MULTIPLIER: 5, // Buscar 5x mais para diversidade
  ANSWERED_QUESTIONS_LOOKBACK_DAYS: 90, // 3 meses

  // Tempo
  FAST_ANSWER_THRESHOLD_SECONDS: 30,
  MAX_QUESTION_TIME_SECONDS: 7200, // 2 horas

  // Achievements
  ACHIEVEMENTS: {
    FIRST_CORRECT: {
      key: 'FIRST_CORRECT',
      name: 'Primeira Acertada',
      description: 'Acerte sua primeira questão',
      icon: '🎯',
      points: 10,
    },
    STREAK_7: {
      key: 'STREAK_7',
      name: 'Uma Semana Firme',
      description: 'Mantenha uma sequência de 7 dias',
      icon: '🔥',
      points: 50,
    },
    STREAK_30: {
      key: 'STREAK_30',
      name: 'Mês de Disciplina',
      description: 'Mantenha uma sequência de 30 dias',
      icon: '💪',
      points: 200,
    },
    QUESTIONS_100: {
      key: 'QUESTIONS_100',
      name: 'Centenário',
      description: 'Responda 100 questões',
      icon: '💯',
      points: 100,
    },
    QUESTIONS_500: {
      key: 'QUESTIONS_500',
      name: 'Quinhentas!',
      description: 'Responda 500 questões',
      icon: '🏆',
      points: 300,
    },
    ACCURACY_90: {
      key: 'ACCURACY_90',
      name: 'Precisão Cirúrgica',
      description: 'Alcance 90% de acerto',
      icon: '🎯',
      points: 150,
    },
    SIMULATION_COMPLETE: {
      key: 'SIMULATION_COMPLETE',
      name: 'Simulado Completo',
      description: 'Complete seu primeiro simulado',
      icon: '📝',
      points: 50,
    },
    SIMULATION_PERFECT: {
      key: 'SIMULATION_PERFECT',
      name: 'Simulado Perfeito',
      description: 'Complete um simulado com 100% de acerto',
      icon: '⭐',
      points: 500,
    },
  },
} as const;

// Helper types
export type AchievementKey = keyof typeof GAMIFICATION_CONSTANTS.ACHIEVEMENTS;
export type Achievement =
  typeof GAMIFICATION_CONSTANTS.ACHIEVEMENTS[AchievementKey];
