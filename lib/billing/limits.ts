/**
 * Sistema de controle de limites por plano
 */

import { PlanType } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { getEffectivePlanType } from "./free-access-mode";

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
  // FREE — R$ 0 — Extremamente limitado para incentivar upgrade
  FREE: {
    dailyQuestions: 5,
    questionBankSize: 100,
    monthlySimulations: 1,
    dailyAiExplanations: 0,
    dailyAiChats: 0,
    canUseAdaptiveSimulations: false,
    canExportPdf: false,
    hasAnalytics: 'basic',
    hasErrorReview: 'none',
    hasPrioritySupport: false,
  },

  // BASIC = Essencial — R$ 19,99/mês — Tudo liberado, SEM IA
  BASIC: {
    dailyQuestions: Infinity,
    questionBankSize: 5605,
    monthlySimulations: Infinity,
    dailyAiExplanations: 0,
    dailyAiChats: 0,
    canUseAdaptiveSimulations: true,
    canExportPdf: false,
    hasAnalytics: 'advanced',
    hasErrorReview: 'advanced',
    hasPrioritySupport: false,
  },

  // PRO — R$ 89,99/mês — Tudo + IA ilimitada + Chat IA
  PRO: {
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

  // PREMIUM = alias do PRO (compatibilidade com assinaturas existentes)
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

  const effectivePlan = getEffectivePlanType(user.planType) as PlanType;
  const limits = PLAN_LIMITS[effectivePlan];

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

  const effectivePlan = getEffectivePlanType(user.planType) as PlanType;
  const limits = PLAN_LIMITS[effectivePlan];

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

  const effectivePlan = getEffectivePlanType(user.planType) as PlanType;
  const limits = PLAN_LIMITS[effectivePlan];

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

  const effectivePlan = getEffectivePlanType(user.planType) as PlanType;
  const limits = PLAN_LIMITS[effectivePlan];

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

  const effectivePlan = getEffectivePlanType(user.planType) as PlanType;
  const limits = PLAN_LIMITS[effectivePlan];

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
