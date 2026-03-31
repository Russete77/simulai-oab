/**
 * Serviço SRS — Gerencia cards de revisão espaçada
 */

import { prisma } from '@/lib/db/prisma';
import { calculateSRS } from './algorithm';
import { logger } from '@/lib/logger';

/**
 * Busca questões pendentes de revisão para hoje
 */
export async function getDueReviewCards(userId: string, limit: number = 10) {
  const now = new Date();

  const cards = await prisma.reviewCard.findMany({
    where: {
      userId,
      nextReviewAt: { lte: now },
    },
    include: {
      question: {
        include: {
          alternatives: {
            orderBy: { label: 'asc' },
          },
        },
      },
    },
    orderBy: [
      { nextReviewAt: 'asc' },
    ],
    take: limit,
  });

  return cards;
}

/**
 * Conta total de revisões pendentes
 */
export async function countDueReviews(userId: string): Promise<number> {
  const now = new Date();
  return prisma.reviewCard.count({
    where: {
      userId,
      nextReviewAt: { lte: now },
    },
  });
}

/**
 * Registra resultado de uma revisão e atualiza o card
 */
export async function recordReview(
  userId: string,
  questionId: string,
  isCorrect: boolean,
  timeSpent: number
) {
  const card = await prisma.reviewCard.findUnique({
    where: { userId_questionId: { userId, questionId } },
  });

  if (!card) {
    logger.warn('Review card not found', { userId, questionId });
    return null;
  }

  const result = calculateSRS(
    isCorrect,
    timeSpent,
    card.easeFactor,
    card.interval,
    card.repetitions
  );

  const updated = await prisma.reviewCard.update({
    where: { id: card.id },
    data: {
      easeFactor: result.easeFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      nextReviewAt: result.nextReviewAt,
      lastReviewAt: new Date(),
      totalReviews: { increment: 1 },
      correctReviews: isCorrect ? { increment: 1 } : undefined,
    },
  });

  logger.debug('Review recorded', {
    userId,
    questionId,
    isCorrect,
    newInterval: result.interval,
    newRepetitions: result.repetitions,
  });

  return updated;
}

/**
 * Cria ou atualiza card de revisão quando o aluno erra uma questão
 * Chamado automaticamente ao responder questões
 */
export async function ensureReviewCard(userId: string, questionId: string, isCorrect: boolean) {
  // Guard: prisma.reviewCard pode não existir se `prisma generate` não rodou
  // após adicionar o model ReviewCard ao schema
  if (!(prisma as any).reviewCard) {
    logger.warn('ReviewCard model not available — run `npx prisma generate` and `npx prisma db push`');
    return null;
  }

  if (isCorrect) {
    // Se acertou e já tem card, atualizar normalmente
    const existing = await prisma.reviewCard.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });
    if (existing) {
      // Card exists - will be updated when user does review
      return existing;
    }
    // No card and correct - no need to create
    return null;
  }

  // Errou - criar ou resetar card
  const card = await prisma.reviewCard.upsert({
    where: { userId_questionId: { userId, questionId } },
    update: {
      // Reset the card - user got it wrong again
      interval: 1,
      repetitions: 0,
      nextReviewAt: new Date(), // Review now
      easeFactor: 2.5,
    },
    create: {
      userId,
      questionId,
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReviewAt: new Date(),
    },
  });

  logger.debug('Review card ensured', { userId, questionId, isCorrect });

  return card;
}

/**
 * Retorna estatísticas SRS do usuário
 */
export async function getSRSStats(userId: string) {
  const now = new Date();

  const [totalCards, dueCards, masteredCards] = await Promise.all([
    prisma.reviewCard.count({ where: { userId } }),
    prisma.reviewCard.count({
      where: { userId, nextReviewAt: { lte: now } },
    }),
    prisma.reviewCard.count({
      where: { userId, interval: { gte: 30 } }, // 30+ days = mastered
    }),
  ]);

  return {
    totalCards,
    dueCards,
    masteredCards,
    learningCards: totalCards - masteredCards,
  };
}
