// Sistema de Pontuação - Simulai OAB
// Baseado no PRD linha 292-302

import { Difficulty } from "@prisma/client";

export interface PointsCalculation {
  basePoints: number;
  speedBonus: number;
  difficultyMultiplier: number;
  streakBonus: number;
  totalPoints: number;
}

// Pontos base por resposta correta
const BASE_POINTS = 100;

// Multiplicadores de dificuldade
const DIFFICULTY_MULTIPLIERS: Record<Difficulty, number> = {
  EASY: 0.8,
  MEDIUM: 1.0,
  HARD: 1.5,
  VERY_HARD: 2.0,
};

// Bônus de velocidade (se responder em menos de 30 segundos)
const SPEED_BONUS = 50;
const SPEED_THRESHOLD = 30; // segundos

// Bônus de streak (por dia consecutivo)
const STREAK_BONUS_PER_DAY = 10;

/**
 * Calcula pontos ganhos por uma resposta correta
 */
export function calculatePoints(
  isCorrect: boolean,
  timeSpent: number, // em segundos
  difficulty: Difficulty | null,
  currentStreak: number
): PointsCalculation {
  if (!isCorrect) {
    return {
      basePoints: 0,
      speedBonus: 0,
      difficultyMultiplier: 1,
      streakBonus: 0,
      totalPoints: 0,
    };
  }

  const basePoints = BASE_POINTS;

  // Bônus de velocidade
  const speedBonus = timeSpent <= SPEED_THRESHOLD ? SPEED_BONUS : 0;

  // Multiplicador de dificuldade
  const difficultyMultiplier = difficulty
    ? DIFFICULTY_MULTIPLIERS[difficulty]
    : DIFFICULTY_MULTIPLIERS.MEDIUM;

  // Bônus de streak
  const streakBonus = currentStreak * STREAK_BONUS_PER_DAY;

  // Total: (base + speed bonus) * dificuldade + streak
  const totalPoints = Math.round(
    (basePoints + speedBonus) * difficultyMultiplier + streakBonus
  );

  return {
    basePoints,
    speedBonus,
    difficultyMultiplier,
    streakBonus,
    totalPoints,
  };
}

/**
 * Calcula nível baseado em pontos totais
 * Cada nível requer progressivamente mais pontos
 */
export function calculateLevel(totalPoints: number): number {
  // Fórmula: level = floor(sqrt(totalPoints / 1000))
  // Level 1: 0-999 pontos
  // Level 2: 1000-3999 pontos
  // Level 3: 4000-8999 pontos
  // Level 4: 9000-15999 pontos
  // etc.
  return Math.floor(Math.sqrt(totalPoints / 1000)) + 1;
}

/**
 * Calcula pontos necessários para próximo nível
 */
export function pointsToNextLevel(currentPoints: number): number {
  const currentLevel = calculateLevel(currentPoints);
  const nextLevelPoints = Math.pow(currentLevel, 2) * 1000;
  return nextLevelPoints - currentPoints;
}

/**
 * Verifica e atualiza streak do usuário
 * Retorna novo valor de streak
 */
export function updateStreak(lastStudyDate: Date | null): number {
  if (!lastStudyDate) {
    return 1; // Primeiro dia
  }

  const now = new Date();
  const lastStudy = new Date(lastStudyDate);

  // Zerar horas para comparar apenas datas
  now.setHours(0, 0, 0, 0);
  lastStudy.setHours(0, 0, 0, 0);

  const diffTime = now.getTime() - lastStudy.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Mesmo dia, streak não muda
    return 0; // Retorna 0 para indicar que não precisa atualizar
  } else if (diffDays === 1) {
    // Dia consecutivo, incrementa streak
    return -1; // Retorna -1 para indicar incremento
  } else {
    // Quebrou o streak, reinicia
    return 1;
  }
}
