/**
 * Sistema de controle de limites por plano
 */

import { PlanType } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export interface PlanLimits {
  // Questões
  dailyQuestions: number;
  questionBankSize: number;

  // Simulados
  monthlySimulations: number;

  // IA
  dailyAiExplanations: number;
  dailyAiChats: number;

  // Features
  canUseAdaptiveSimulations: boolean;
  canExportPdf: boolean;
  hasAnalytics: 'basic' | 'medium' | 'advanced' | 'complete';
  hasErrorReview: 'none' | 'basic' | 'advanced' | 'ai';
  hasPrioritySupport: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    dailyQuestions: 20,
    questionBankSize: 500,
    monthlySimulations: 2,
    dailyAiExplanations: 3,  // ✅ Corrigido: era 0, agora 3/dia
    dailyAiChats: 3,         // ✅ Corrigido: era 0, agora 3/dia (mesmo que explicações)
    canUseAdaptiveSimulations: false,
    canExportPdf: false,
    hasAnalytics: 'basic',
    hasErrorReview: 'none',
    hasPrioritySupport: false,
  },

  BASIC: {
    dailyQuestions: 50,
    questionBankSize: 2000,
    monthlySimulations: 5,
    dailyAiExplanations: 5,
    dailyAiChats: 0,
    canUseAdaptiveSimulations: false,
    canExportPdf: false,
    hasAnalytics: 'medium',
    hasErrorReview: 'basic',
    hasPrioritySupport: false,
  },

  PRO: {
    dailyQuestions: Infinity,
    questionBankSize: 5605,
    monthlySimulations: 10,
    dailyAiExplanations: 20,
    dailyAiChats: 10,
    canUseAdaptiveSimulations: true,
    canExportPdf: true,
    hasAnalytics: 'advanced',
    hasErrorReview: 'advanced',
    hasPrioritySupport: false,
  },

  PREMIUM: {
    dailyQuestions: Infinity,
    questionBankSize: 5605,
    monthlySimulations: Infinity,
    dailyAiExplanations: Infinity,
    dailyAiChats: Infinity,
    canUseAdaptiveSimulations: true,
    canExportPdf: true,
    hasAnalytics: 'complete',
    hasErrorReview: 'ai',
    hasPrioritySupport: true,
  },
};

/**
 * Verificar se o usuário atingiu o limite de questões diárias
 */
export async function checkQuestionLimit(userId: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  resetAt: Date | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      planType: true,
      dailyQuestionsCount: true,
      dailyQuestionsResetAt: true,
    },
  });

  if (!user) {
    return { allowed: false, current: 0, limit: 0, resetAt: null };
  }

  const limits = PLAN_LIMITS[user.planType];

  // Reset se passou o dia
  if (shouldResetDaily(user.dailyQuestionsResetAt)) {
    await resetDailyQuestions(userId);
    return {
      allowed: true,
      current: 0,
      limit: limits.dailyQuestions,
      resetAt: new Date(),
    };
  }

  const allowed = user.dailyQuestionsCount < limits.dailyQuestions;

  return {
    allowed,
    current: user.dailyQuestionsCount,
    limit: limits.dailyQuestions,
    resetAt: user.dailyQuestionsResetAt,
  };
}

/**
 * Incrementar contador de questões
 */
export async function incrementQuestionCount(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      dailyQuestionsCount: { increment: 1 },
      dailyQuestionsResetAt: { set: new Date() },
    },
  });
}

/**
 * Verificar limite de simulados mensais
 */
export async function checkSimulationLimit(userId: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  resetAt: Date | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      planType: true,
      monthlySimulationsCount: true,
      monthlySimulationsResetAt: true,
    },
  });

  if (!user) {
    return { allowed: false, current: 0, limit: 0, resetAt: null };
  }

  const limits = PLAN_LIMITS[user.planType];

  // Reset se passou o mês
  if (shouldResetMonthly(user.monthlySimulationsResetAt)) {
    await resetMonthlySimulations(userId);
    return {
      allowed: true,
      current: 0,
      limit: limits.monthlySimulations,
      resetAt: new Date(),
    };
  }

  const allowed = user.monthlySimulationsCount < limits.monthlySimulations;

  return {
    allowed,
    current: user.monthlySimulationsCount,
    limit: limits.monthlySimulations,
    resetAt: user.monthlySimulationsResetAt,
  };
}

/**
 * Incrementar contador de simulados
 */
export async function incrementSimulationCount(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      monthlySimulationsCount: { increment: 1 },
      monthlySimulationsResetAt: { set: new Date() },
    },
  });
}

/**
 * Verificar limite de explicações IA
 */
export async function checkAiExplanationLimit(userId: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  resetAt: Date | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      planType: true,
      dailyAiExplanationsCount: true,
      dailyAiExplanationsResetAt: true,
    },
  });

  if (!user) {
    return { allowed: false, current: 0, limit: 0, resetAt: null };
  }

  const limits = PLAN_LIMITS[user.planType];

  // Reset se passou o dia
  if (shouldResetDaily(user.dailyAiExplanationsResetAt)) {
    await resetDailyAiExplanations(userId);
    return {
      allowed: true,
      current: 0,
      limit: limits.dailyAiExplanations,
      resetAt: new Date(),
    };
  }

  const allowed = user.dailyAiExplanationsCount < limits.dailyAiExplanations;

  return {
    allowed,
    current: user.dailyAiExplanationsCount,
    limit: limits.dailyAiExplanations,
    resetAt: user.dailyAiExplanationsResetAt,
  };
}

/**
 * Incrementar contador de explicações IA
 */
export async function incrementAiExplanationCount(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      dailyAiExplanationsCount: { increment: 1 },
      dailyAiExplanationsResetAt: { set: new Date() },
    },
  });
}

/**
 * Verificar limite de chat IA
 */
export async function checkAiChatLimit(userId: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  resetAt: Date | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      planType: true,
      dailyAiChatsCount: true,
      dailyAiChatsResetAt: true,
    },
  });

  if (!user) {
    return { allowed: false, current: 0, limit: 0, resetAt: null };
  }

  const limits = PLAN_LIMITS[user.planType];

  // Reset se passou o dia
  if (shouldResetDaily(user.dailyAiChatsResetAt)) {
    await resetDailyAiChats(userId);
    return {
      allowed: true,
      current: 0,
      limit: limits.dailyAiChats,
      resetAt: new Date(),
    };
  }

  const allowed = user.dailyAiChatsCount < limits.dailyAiChats;

  return {
    allowed,
    current: user.dailyAiChatsCount,
    limit: limits.dailyAiChats,
    resetAt: user.dailyAiChatsResetAt,
  };
}

/**
 * Incrementar contador de chat IA
 */
export async function incrementAiChatCount(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      dailyAiChatsCount: { increment: 1 },
      dailyAiChatsResetAt: { set: new Date() },
    },
  });
}

/**
 * Obter todos os limites do usuário
 */
export async function getUserLimits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      planType: true,
      dailyQuestionsCount: true,
      dailyQuestionsResetAt: true,
      monthlySimulationsCount: true,
      monthlySimulationsResetAt: true,
      dailyAiExplanationsCount: true,
      dailyAiExplanationsResetAt: true,
      dailyAiChatsCount: true,
      dailyAiChatsResetAt: true,
    },
  });

  if (!user) return null;

  const limits = PLAN_LIMITS[user.planType];

  return {
    planType: user.planType,
    limits,
    usage: {
      dailyQuestions: {
        current: user.dailyQuestionsCount,
        limit: limits.dailyQuestions,
        resetAt: user.dailyQuestionsResetAt,
      },
      monthlySimulations: {
        current: user.monthlySimulationsCount,
        limit: limits.monthlySimulations,
        resetAt: user.monthlySimulationsResetAt,
      },
      dailyAiExplanations: {
        current: user.dailyAiExplanationsCount,
        limit: limits.dailyAiExplanations,
        resetAt: user.dailyAiExplanationsResetAt,
      },
      dailyAiChats: {
        current: user.dailyAiChatsCount,
        limit: limits.dailyAiChats,
        resetAt: user.dailyAiChatsResetAt,
      },
    },
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function shouldResetDaily(lastReset: Date | null): boolean {
  if (!lastReset) return true;

  const now = new Date();
  const lastResetDate = new Date(lastReset);

  // Verificar se é um dia diferente
  return (
    now.getDate() !== lastResetDate.getDate() ||
    now.getMonth() !== lastResetDate.getMonth() ||
    now.getFullYear() !== lastResetDate.getFullYear()
  );
}

function shouldResetMonthly(lastReset: Date | null): boolean {
  if (!lastReset) return true;

  const now = new Date();
  const lastResetDate = new Date(lastReset);

  // Verificar se é um mês diferente
  return (
    now.getMonth() !== lastResetDate.getMonth() ||
    now.getFullYear() !== lastResetDate.getFullYear()
  );
}

async function resetDailyQuestions(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      dailyQuestionsCount: 0,
      dailyQuestionsResetAt: new Date(),
    },
  });
}

async function resetMonthlySimulations(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      monthlySimulationsCount: 0,
      monthlySimulationsResetAt: new Date(),
    },
  });
}

async function resetDailyAiExplanations(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      dailyAiExplanationsCount: 0,
      dailyAiExplanationsResetAt: new Date(),
    },
  });
}

async function resetDailyAiChats(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      dailyAiChatsCount: 0,
      dailyAiChatsResetAt: new Date(),
    },
  });
}
