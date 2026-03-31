/**
 * Helpers de estatísticas e gamificação
 *
 * Funções utilitárias para cálculos de estatísticas,
 * eliminando duplicação de código.
 */

import type { UserProfile } from '@prisma/client';

/**
 * Calcula a taxa de acerto do usuário
 */
export function calculateAccuracy(profile: UserProfile | null | undefined): number {
  if (!profile || profile.totalQuestions === 0) return 0;
  return Math.round((profile.correctAnswers / profile.totalQuestions) * 100);
}

/**
 * Retorna o nível de performance baseado na taxa de acerto
 */
export function getPerformanceLevel(accuracy: number): {
  level: string;
  color: 'green' | 'blue' | 'yellow' | 'red';
  icon: string;
  message: string;
} {
  if (accuracy >= 90) {
    return {
      level: 'Excelente',
      color: 'green',
      icon: '🌟',
      message: 'Você está pronto para a prova!',
    };
  }

  if (accuracy >= 70) {
    return {
      level: 'Bom',
      color: 'blue',
      icon: '👍',
      message: 'Continue assim, você está no caminho certo!',
    };
  }

  if (accuracy >= 50) {
    return {
      level: 'Regular',
      color: 'yellow',
      icon: '⚠️',
      message: 'Foque nas matérias com mais dificuldade.',
    };
  }

  return {
    level: 'Precisa Melhorar',
    color: 'red',
    icon: '📚',
    message: 'Estude mais e revise os conceitos básicos.',
  };
}

/**
 * Calcula o progresso até o próximo nível
 */
export function getLevelProgress(
  totalPoints: number,
  pointsPerLevel: number = 100
): {
  currentLevel: number;
  nextLevel: number;
  pointsInLevel: number;
  pointsToNextLevel: number;
  progressPercentage: number;
} {
  const currentLevel = Math.floor(totalPoints / pointsPerLevel) + 1;
  const nextLevel = currentLevel + 1;
  const pointsInLevel = totalPoints % pointsPerLevel;
  const pointsToNextLevel = pointsPerLevel - pointsInLevel;
  const progressPercentage = Math.round((pointsInLevel / pointsPerLevel) * 100);

  return {
    currentLevel,
    nextLevel,
    pointsInLevel,
    pointsToNextLevel,
    progressPercentage,
  };
}

/**
 * Retorna mensagem motivacional baseada no streak
 */
export function getStreakMessage(streak: number): string {
  if (streak === 0) return 'Comece sua sequência hoje!';
  if (streak === 1) return 'Primeira vitória! Continue amanhã!';
  if (streak < 7) return `${streak} dias! Continue assim!`;
  if (streak < 30) return `${streak} dias! Você está em chamas! 🔥`;
  if (streak < 90) return `${streak} dias! Disciplina impressionante! 💪`;
  return `${streak} dias! Você é uma máquina! 🏆`;
}

/**
 * Calcula tempo médio formatado
 */
export function formatAverageTime(averageSeconds: number | null | undefined): string {
  if (!averageSeconds) return '0s';

  const seconds = Math.round(averageSeconds);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes}min`;
  }

  return `${minutes}min ${remainingSeconds}s`;
}

/**
 * Compara performance com média
 */
export function compareWithAverage(
  userTime: number,
  averageTime: number
): {
  comparison: 'faster' | 'slower' | 'equal';
  difference: number;
  message: string;
} {
  const difference = Math.abs(userTime - averageTime);

  if (difference < 5) {
    return {
      comparison: 'equal',
      difference: 0,
      message: 'Na média',
    };
  }

  if (userTime < averageTime) {
    return {
      comparison: 'faster',
      difference,
      message: `${difference}s mais rápido que a média`,
    };
  }

  return {
    comparison: 'slower',
    difference,
    message: `${difference}s mais lento que a média`,
  };
}

/**
 * Calcula pontos de progresso na meta diária
 */
export function getDailyGoalProgress(
  questionsToday: number,
  dailyGoal: number
): {
  completed: number;
  remaining: number;
  percentage: number;
  isCompleted: boolean;
  message: string;
} {
  const percentage = Math.min(Math.round((questionsToday / dailyGoal) * 100), 100);
  const isCompleted = questionsToday >= dailyGoal;

  let message = '';
  if (isCompleted) {
    message = 'Meta diária cumprida! 🎉';
  } else if (percentage >= 75) {
    message = 'Quase lá! Continue!';
  } else if (percentage >= 50) {
    message = 'Metade do caminho!';
  } else if (percentage >= 25) {
    message = 'Bom começo!';
  } else {
    message = `Faltam ${dailyGoal - questionsToday} questões para sua meta`;
  }

  return {
    completed: questionsToday,
    remaining: Math.max(0, dailyGoal - questionsToday),
    percentage,
    isCompleted,
    message,
  };
}
