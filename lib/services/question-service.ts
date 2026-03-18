/**
 * Question Service
 * Encapsulates business logic for question answering and retrieval
 */

import { prisma } from '@/lib/db/prisma';
import {
  calculatePoints,
  updateStreak,
  calculateLevel,
} from '@/lib/gamification/points';
import {
  checkAchievements,
  getUserStats,
} from '@/lib/gamification/achievements';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

export interface AnswerQuestionInput {
  questionId: string;
  alternativeId: string;
  timeSpent: number;
  confidence?: number;
  simulationId?: string;
}

export interface AnswerQuestionResult {
  isCorrect: boolean;
  correctAlternativeId: string;
  explanation?: string;
  statistics?: {
    successRate: number;
    averageTime: number;
    yourTime: number;
  };
}

export interface GetNextQuestionInput {
  subject?: string;
  difficulty?: string;
  excludeAnswered?: boolean;
  questionId?: string;
}

export interface NextQuestionResult {
  id: string;
  statement: string;
  subject: string;
  difficulty: string;
  examYear: number;
  examPhase: number;
  questionNumber: number;
  alternatives: Array<{
    id: string;
    label: string;
    text: string;
  }>;
}

/**
 * Calculate weighted year preference (prioritizes recent exams)
 */
function getYearWeight(year: number): number {
  const currentYear = new Date().getFullYear();
  if (year >= currentYear - 2) return 10.0;
  if (year >= 2020) return 5.0;
  if (year >= 2017) return 2.0;
  if (year >= 2014) return 1.0;
  if (year >= 2011) return 0.3;
  return 0.1;
}

/**
 * Select a weighted random question from available options
 */
function selectWeightedQuestion(
  questions: Array<{ id: string; examYear: number }>
): { id: string; examYear: number } {
  if (questions.length === 0) {
    throw new Error('Nenhuma questão disponível');
  }

  if (questions.length === 1) {
    return questions[0];
  }

  const weightedQuestions = questions.map((q) => ({
    question: q,
    weight: getYearWeight(q.examYear),
  }));

  const totalWeight = weightedQuestions.reduce((sum, wq) => sum + wq.weight, 0);

  let random = Math.random() * totalWeight;

  for (const wq of weightedQuestions) {
    random -= wq.weight;
    if (random <= 0) {
      return wq.question;
    }
  }

  return weightedQuestions[weightedQuestions.length - 1].question;
}

/**
 * Process user answer and return results
 * Handles validation, recording, and gamification
 */
export async function answerQuestion(
  userId: string,
  data: AnswerQuestionInput
): Promise<AnswerQuestionResult> {
  try {
    // Fetch question and alternative in parallel
    const [question, alternative] = await Promise.all([
      prisma.question.findUnique({
        where: { id: data.questionId },
        select: {
          id: true,
          difficulty: true,
          explanation: true,
        },
      }),
      prisma.alternative.findUnique({
        where: { id: data.alternativeId },
        select: {
          id: true,
          isCorrect: true,
          questionId: true,
        },
      }),
    ]);

    if (!question || !alternative) {
      logger.warn('Question or alternative not found', {
        questionId: data.questionId,
        alternativeId: data.alternativeId,
        userId,
      });
      throw new Error('Questão ou alternativa não encontrada');
    }

    const isCorrect = alternative.isCorrect;

    // Find correct alternative if in practice mode (not simulation)
    let correctAlternativeId = data.alternativeId;
    if (!data.simulationId) {
      const correctAlt = await prisma.alternative.findFirst({
        where: { questionId: data.questionId, isCorrect: true },
        select: { id: true },
      });
      correctAlternativeId = correctAlt?.id || data.alternativeId;
    }

    // Record answer
    await prisma.userAnswer.create({
      data: {
        userId,
        questionId: data.questionId,
        alternativeId: data.alternativeId,
        simulationId: data.simulationId ?? undefined,
        isCorrect,
        timeSpent: data.timeSpent,
        confidence: data.confidence,
      },
    });

    // If simulation, return early without gamification
    if (data.simulationId) {
      logger.debug('Simulation answer recorded', {
        simulationId: data.simulationId,
        questionId: data.questionId,
        isCorrect,
        userId,
      });

      return {
        isCorrect,
        correctAlternativeId,
      };
    }

    // Practice mode: apply gamification
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        streak: true,
        totalPoints: true,
        correctAnswers: true,
        totalQuestions: true,
        lastStudyDate: true,
      },
    });

    if (userProfile) {
      // Calculate points
      const pointsCalc = calculatePoints(
        isCorrect,
        data.timeSpent,
        question.difficulty,
        userProfile.streak
      );

      // Update streak
      const streakUpdate = updateStreak(userProfile.lastStudyDate);
      let newStreak = userProfile.streak;

      if (streakUpdate === -1) {
        newStreak = userProfile.streak + 1;
      } else if (streakUpdate > 0) {
        newStreak = streakUpdate;
      }

      // Calculate new points and level
      const newTotalPoints = userProfile.totalPoints + pointsCalc.totalPoints;
      const newLevel = calculateLevel(newTotalPoints);

      // Update profile
      await prisma.userProfile.update({
        where: { userId },
        data: {
          totalQuestions: { increment: 1 },
          correctAnswers: isCorrect ? { increment: 1 } : undefined,
          totalPoints: newTotalPoints,
          level: newLevel,
          streak: newStreak,
          lastStudyDate: new Date(),
        },
      });

      // Process achievements in background
      if (isCorrect) {
        getUserStats(userId, prisma)
          .then(async (userStats) => {
            const unlockedAchievements =
              await prisma.userAchievement.findMany({
                where: { userId },
                select: { achievement: { select: { key: true } } },
              });
            const unlockedKeys = unlockedAchievements.map(
              (ua) => ua.achievement.key
            );

            const newAchievements = checkAchievements(userStats, unlockedKeys);

            if (newAchievements.length === 0) return;

            const achievementKeys = newAchievements.map((a) => a.key);
            const existingAchievements = await prisma.achievement.findMany({
              where: { key: { in: achievementKeys } },
              select: { id: true, key: true },
            });

            const existingAchievementMap = new Map(
              existingAchievements.map((a) => [a.key, a.id])
            );

            const achievementsToCreate = newAchievements.filter(
              (a) => !existingAchievementMap.has(a.key)
            );

            if (achievementsToCreate.length > 0) {
              await prisma.achievement.createMany({
                data: achievementsToCreate.map((a) => ({
                  key: a.key,
                  name: a.name,
                  description: a.description,
                  icon: a.icon,
                  points: a.points,
                })),
                skipDuplicates: true,
              });

              const created = await prisma.achievement.findMany({
                where: {
                  key: { in: achievementsToCreate.map((a) => a.key) },
                },
                select: { id: true, key: true },
              });
              created.forEach((a) => existingAchievementMap.set(a.key, a.id));
            }

            const userAchievementsData = newAchievements.map((achievement) => ({
              userId,
              achievementId: existingAchievementMap.get(achievement.key)!,
            }));

            await prisma.userAchievement.createMany({
              data: userAchievementsData,
              skipDuplicates: true,
            });

            const totalPoints = newAchievements.reduce(
              (sum, a) => sum + a.points,
              0
            );
            if (totalPoints > 0) {
              await prisma.userProfile.update({
                where: { userId },
                data: {
                  totalPoints: { increment: totalPoints },
                },
              });
            }
          })
          .catch((err) =>
            logger.error('Achievement processing error', {
              error: err instanceof Error ? err.message : 'Unknown error',
              userId,
            })
          );
      }
    }

    // Calculate question statistics
    const [stats, correctCount] = await Promise.all([
      prisma.userAnswer.aggregate({
        where: { questionId: data.questionId },
        _avg: { timeSpent: true },
        _count: { _all: true },
      }),
      prisma.userAnswer.count({
        where: { questionId: data.questionId, isCorrect: true },
      }),
    ]);

    const successRate =
      stats._count._all > 0 ? (correctCount / stats._count._all) * 100 : 0;

    logger.info('Practice answer recorded successfully', {
      questionId: data.questionId,
      isCorrect,
      userId,
      timeSpent: data.timeSpent,
    });

    return {
      isCorrect,
      correctAlternativeId,
      explanation: question.explanation || undefined,
      statistics: {
        successRate: Math.round(successRate * 10) / 10,
        averageTime: Math.round(stats._avg.timeSpent || 0),
        yourTime: data.timeSpent,
      },
    };
  } catch (error) {
    logger.error('Error answering question', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });
    throw error;
  }
}

/**
 * Get next question to answer
 * Handles filtering, exclusion of answered questions, and weighted selection
 */
export async function getNextQuestion(
  userId: string,
  filters?: GetNextQuestionInput
): Promise<NextQuestionResult> {
  try {
    // If specific question ID provided, fetch and return it
    if (filters?.questionId) {
      logger.debug('Fetching specific question', {
        questionId: filters.questionId,
      });

      const question = await prisma.question.findUnique({
        where: { id: filters.questionId },
        include: {
          alternatives: {
            orderBy: { label: 'asc' },
          },
        },
      });

      if (!question || question.nullified) {
        throw new Error('Questão não encontrada');
      }

      const alternatives = question.alternatives.map(
        ({ isCorrect, ...alt }) => alt
      );

      return {
        ...question,
        alternatives,
      } as NextQuestionResult;
    }

    // Build filter conditions
    const where: Prisma.QuestionWhereInput = {
      nullified: false,
      ...(filters?.subject && { subject: filters.subject }),
      ...(filters?.difficulty && { difficulty: filters.difficulty }),
    };

    // Exclude answered questions if requested
    if (filters?.excludeAnswered) {
      const answeredQuestions = await prisma.userAnswer.findMany({
        where: { userId },
        select: { questionId: true },
      });

      where.id = {
        notIn: answeredQuestions.map((a) => a.questionId),
      };
    }

    // Fetch available questions (minimal data for selection)
    const availableQuestions = await prisma.question.findMany({
      where,
      select: {
        id: true,
        examYear: true,
      },
    });

    if (availableQuestions.length === 0) {
      throw new Error('Nenhuma questão disponível com os critérios fornecidos');
    }

    // Select weighted question
    const selectedQuestion = selectWeightedQuestion(availableQuestions);

    logger.debug('Question selected with weighted algorithm', {
      id: selectedQuestion.id,
      examYear: selectedQuestion.examYear,
      weight: getYearWeight(selectedQuestion.examYear),
    });

    // Fetch full question with alternatives
    const question = await prisma.question.findUnique({
      where: { id: selectedQuestion.id },
      include: {
        alternatives: {
          orderBy: { label: 'asc' },
        },
      },
    });

    if (!question) {
      throw new Error('Questão não encontrada após seleção');
    }

    // Remove correct answer from alternatives
    const alternatives = question.alternatives.map(
      ({ isCorrect, ...alt }) => alt
    );

    logger.info('Next question fetched successfully', {
      questionId: question.id,
      userId,
    });

    return {
      ...question,
      alternatives,
    } as NextQuestionResult;
  } catch (error) {
    logger.error('Error getting next question', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });
    throw error;
  }
}
