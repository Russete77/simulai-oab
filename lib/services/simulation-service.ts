/**
 * Simulation Service
 * Encapsulates business logic for simulation creation and completion
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { incrementSimulationCount } from '@/lib/billing/limits';
import { SimulationType, Subject, Difficulty, Prisma } from '@prisma/client';

export interface CreateSimulationInput {
  type: SimulationType;
  subjects?: Subject[];
  targetDifficulty?: Difficulty;
  questionCount?: number;
}

export interface CreateSimulationResult {
  id: string;
  type: SimulationType;
  totalQuestions: number;
  status: string;
  createdAt: Date;
}

export interface FinishSimulationInput {
  simulationId: string;
}

export interface FinishSimulationResult {
  simulationId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  bySubject: {
    subject: Subject;
    accuracy: number;
    total: number;
    correct: number;
  }[];
  weakAreas: Subject[];
  recommendations: string[];
}

const SIMULATION_CONFIGS = {
  FULL_EXAM: {
    questionCount: 80,
    distribution: {
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
    },
  },
  ADAPTIVE: { questionCount: 40 },
  QUICK_PRACTICE: { questionCount: 20 },
  ERROR_REVIEW: { questionCount: 30 },
  BY_SUBJECT: { questionCount: 50 },
};

/**
 * Fisher-Yates shuffle algorithm
 */
function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Calculate weight of a year (prioritizes recent exams)
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
 * Shuffle questions with diversity weighting by year
 */
function shuffleWithDiversity(
  questions: Array<{ id: string; examYear: number; examPhase: number }>,
  count: number
): Array<{ id: string; examYear: number; examPhase: number }> {
  if (questions.length === 0) return [];
  if (questions.length <= count) return fisherYatesShuffle(questions);

  // Group by year
  const byYear = new Map<number, typeof questions>();
  questions.forEach((q) => {
    if (!byYear.has(q.examYear)) {
      byYear.set(q.examYear, []);
    }
    byYear.get(q.examYear)!.push(q);
  });

  const years = Array.from(byYear.keys()).sort((a, b) => b - a);

  // Calculate year weights
  const yearWeights = new Map<number, number>();
  let totalWeight = 0;

  years.forEach((year) => {
    const weight = getYearWeight(year);
    yearWeights.set(year, weight);
    totalWeight += weight;
  });

  // Distribute questions proportionally to weights
  const distribution = new Map<number, number>();
  let allocated = 0;

  years.forEach((year, index) => {
    const yearQuestions = byYear.get(year)!;
    const weight = yearWeights.get(year)!;

    let yearCount = Math.round((weight / totalWeight) * count);
    yearCount = Math.min(yearCount, yearQuestions.length);

    if (yearCount === 0 && yearQuestions.length > 0 && allocated < count) {
      yearCount = 1;
    }

    if (index === years.length - 1) {
      yearCount = Math.min(count - allocated, yearQuestions.length);
    }

    distribution.set(year, yearCount);
    allocated += yearCount;
  });

  // Redistribute remaining questions, prioritizing recent years
  let remaining = count - allocated;
  while (remaining > 0) {
    let distributed = false;

    for (const year of years) {
      if (remaining <= 0) break;

      const currentAlloc = distribution.get(year) || 0;
      const available = byYear.get(year)!.length;

      if (currentAlloc < available) {
        distribution.set(year, currentAlloc + 1);
        remaining--;
        distributed = true;
      }
    }

    if (!distributed) break;
  }

  // Select questions from each year
  const result: typeof questions = [];

  years.forEach((year) => {
    const yearQuestions = byYear.get(year)!;
    const neededCount = distribution.get(year) || 0;

    if (neededCount === 0) return;

    const shuffled = fisherYatesShuffle(yearQuestions);
    result.push(...shuffled.slice(0, neededCount));
  });

  // Final shuffle for diversity
  const finalResult = fisherYatesShuffle(result).slice(0, count);

  logger.info('[SHUFFLE_DIVERSITY] Distribuição ponderada por relevância:', {
    solicitado: count,
    retornado: finalResult.length,
    disponivel: questions.length,
  });

  return finalResult;
}

/**
 * Create a new simulation with questions
 */
export async function createSimulation(
  userId: string,
  data: CreateSimulationInput
): Promise<CreateSimulationResult> {
  try {
    logger.info('Creating simulation', {
      userId,
      type: data.type,
      questionCount: data.questionCount,
    });

    const config =
      SIMULATION_CONFIGS[
        data.type as keyof typeof SIMULATION_CONFIGS
      ];
    const questionCount = data.questionCount || config.questionCount;

    let where: Prisma.QuestionWhereInput = { nullified: false };

    // Get answered questions from last 90 days
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);

    const answeredQuestions = await prisma.userAnswer.findMany({
      where: {
        userId,
        createdAt: { gte: threeMonthsAgo },
      },
      select: { questionId: true },
      distinct: ['questionId'],
    });

    const answeredQuestionIds = new Set(answeredQuestions.map((a) => a.questionId));

    let questions: Array<{ id: string; examYear: number; examPhase: number }> = [];

    // Handle FULL_EXAM type with subject distribution
    if (data.type === 'FULL_EXAM') {
      const subjectEntries = Object.entries(
        SIMULATION_CONFIGS.FULL_EXAM.distribution
      );

      const questionPromises = subjectEntries.map(async ([subject, count]) => {
        if (count === 0) return [];

        const foundQuestions = await prisma.question.findMany({
          where: {
            subject: subject as any,
            nullified: false,
          },
          select: {
            id: true,
            examYear: true,
            examPhase: true,
          },
          take: Math.max(count * 10, 200),
          orderBy: { examYear: 'desc' },
        });

        const notAnswered = foundQuestions.filter(
          (q) => !answeredQuestionIds.has(q.id)
        );
        const answered = foundQuestions.filter((q) =>
          answeredQuestionIds.has(q.id)
        );

        const availableQuestions =
          notAnswered.length >= count
            ? notAnswered
            : [...notAnswered, ...answered];

        const shuffled = shuffleWithDiversity(availableQuestions, count);

        return shuffled.map((q) => q.id);
      });

      const questionsArrays = await Promise.all(questionPromises);
      const questionIds = questionsArrays.flat();
      const finalShuffled = fisherYatesShuffle(questionIds);

      logger.info('[FULL_EXAM] Simulado criado', {
        userId,
        total: finalShuffled.length,
        esperado: 80,
      });

      const simulation = await prisma.simulation.create({
        data: {
          userId,
          type: data.type,
          totalQuestions: finalShuffled.length,
          subjects: data.subjects || [],
          targetDifficulty: data.targetDifficulty,
          questions: {
            create: finalShuffled.map((questionId, index) => ({
              questionId,
              order: index + 1,
            })),
          },
        },
        select: {
          id: true,
          type: true,
          totalQuestions: true,
          status: true,
          createdAt: true,
        },
      });

      await incrementSimulationCount(userId);

      logger.info('Full exam simulation created successfully', {
        userId,
        simulationId: simulation.id,
        totalQuestions: simulation.totalQuestions,
      });

      return simulation;
    }

    // Handle other simulation types
    if (data.subjects && data.subjects.length > 0) {
      where.subject = { in: data.subjects };
    }

    if (data.targetDifficulty) {
      where.difficulty = data.targetDifficulty;
    }

    const allQuestions = await prisma.question.findMany({
      where,
      select: {
        id: true,
        examYear: true,
        examPhase: true,
      },
      take: Math.max(questionCount * 10, 500),
      orderBy: { examYear: 'desc' },
    });

    const notAnswered = allQuestions.filter(
      (q) => !answeredQuestionIds.has(q.id)
    );
    const answered = allQuestions.filter((q) =>
      answeredQuestionIds.has(q.id)
    );

    const availableQuestions =
      notAnswered.length >= questionCount
        ? notAnswered
        : [...notAnswered, ...answered];

    const shuffled = shuffleWithDiversity(availableQuestions, questionCount);

    logger.info(`[${data.type}] Simulado criado`, {
      userId,
      total: shuffled.length,
      esperado: questionCount,
    });

    const simulation = await prisma.simulation.create({
      data: {
        userId,
        type: data.type,
        totalQuestions: shuffled.length,
        subjects: data.subjects || [],
        targetDifficulty: data.targetDifficulty,
        questions: {
          create: shuffled.map((question, index) => ({
            questionId: question.id,
            order: index + 1,
          })),
        },
      },
      select: {
        id: true,
        type: true,
        totalQuestions: true,
        status: true,
        createdAt: true,
      },
    });

    await incrementSimulationCount(userId);

    logger.info('Simulation created successfully', {
      userId,
      simulationId: simulation.id,
      type: simulation.type,
      totalQuestions: simulation.totalQuestions,
    });

    return simulation;
  } catch (error) {
    logger.error('Error creating simulation', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });
    throw error;
  }
}

/**
 * Finish simulation and generate report
 */
export async function finishSimulation(
  userId: string,
  simulationId: string
): Promise<FinishSimulationResult> {
  try {
    logger.info('Finishing simulation', { userId, simulationId });

    // Fetch simulation and answers in parallel
    const [simulation, answers] = await Promise.all([
      prisma.simulation.findUnique({
        where: { id: simulationId },
        include: {
          questions: {
            include: {
              question: {
                select: { id: true, subject: true },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      }),
      prisma.userAnswer.findMany({
        where: { simulationId },
        select: { questionId: true, isCorrect: true, timeSpent: true },
      }),
    ]);

    if (!simulation) {
      throw new Error('Simulado não encontrado');
    }

    if (simulation.userId !== userId) {
      throw new Error('Não autorizado');
    }

    if (simulation.status === 'COMPLETED') {
      throw new Error('Simulado já finalizado');
    }

    // Calculate score and time
    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    const score = (correctAnswers / simulation.totalQuestions) * 100;
    const timeSpent = answers.reduce((sum, a) => sum + a.timeSpent, 0);

    // Update simulation status
    await prisma.simulation.update({
      where: { id: simulationId },
      data: {
        status: 'COMPLETED',
        score,
        timeSpent,
        completedAt: new Date(),
      },
    });

    // Create answer map for fast lookup
    const answerMap = new Map(answers.map((a) => [a.questionId, a]));

    // Calculate statistics by subject
    const bySubject = new Map<
      string,
      { total: number; correct: number }
    >();

    for (const simQuestion of simulation.questions) {
      const subject = simQuestion.question.subject;
      const answer = answerMap.get(simQuestion.questionId);

      if (!bySubject.has(subject)) {
        bySubject.set(subject, { total: 0, correct: 0 });
      }

      const stats = bySubject.get(subject)!;
      stats.total += 1;

      if (answer?.isCorrect) {
        stats.correct += 1;
      }
    }

    const bySubjectArray = Array.from(bySubject.entries()).map(
      ([subject, stats]) => ({
        subject: subject as any,
        accuracy: (stats.correct / stats.total) * 100,
        total: stats.total,
        correct: stats.correct,
      })
    );

    // Identify weak areas (< 60% accuracy)
    const weakAreas = bySubjectArray
      .filter((s) => s.accuracy < 60)
      .map((s) => s.subject);

    // Generate recommendations
    const recommendations: string[] = [];

    if (score < 50) {
      recommendations.push('Reforce os conceitos básicos de todas as matérias');
    } else if (score < 75) {
      recommendations.push('Você está no caminho certo! Continue praticando');
    } else {
      recommendations.push('Excelente desempenho! Mantenha o ritmo');
    }

    if (weakAreas.length > 0) {
      recommendations.push(
        `Foque nos estudos de: ${weakAreas.slice(0, 3).join(', ')}`
      );
    }

    logger.info('Simulation finished successfully', {
      userId,
      simulationId,
      score: Math.round(score * 10) / 10,
      correctAnswers,
    });

    return {
      simulationId,
      score: Math.round(score * 10) / 10,
      totalQuestions: simulation.totalQuestions,
      correctAnswers,
      timeSpent,
      bySubject: bySubjectArray,
      weakAreas,
      recommendations,
    };
  } catch (error) {
    logger.error('Error finishing simulation', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });
    throw error;
  }
}
