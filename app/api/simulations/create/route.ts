import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth";
import { CreateSimulationSchema } from "@/lib/validations/simulation";
import { SimulationType, Prisma } from "@prisma/client";
import { checkRateLimit, simulationRateLimit } from "@/lib/rate-limit";
import { createError } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * Embaralha questões com diversificação de anos
 * Garante que não haja muitas questões seguidas do mesmo ano
 */
function shuffleWithDiversity(
  questions: Array<{ id: string; examYear: number; examPhase: number }>,
  count: number
): Array<{ id: string; examYear: number; examPhase: number }> {
  // Agrupar por ano
  const byYear = new Map<number, typeof questions>();
  questions.forEach((q) => {
    const year = q.examYear;
    if (!byYear.has(year)) {
      byYear.set(year, []);
    }
    byYear.get(year)!.push(q);
  });

  // Embaralhar cada grupo de ano
  byYear.forEach((yearQuestions) => {
    yearQuestions.sort(() => Math.random() - 0.5);
  });

  // Distribuir questões de forma intercalada (round-robin por ano)
  const result: typeof questions = [];
  const years = Array.from(byYear.keys()).sort(() => Math.random() - 0.5);
  let yearIndex = 0;

  while (result.length < count && result.length < questions.length) {
    const year = years[yearIndex];
    const yearQuestions = byYear.get(year);

    if (yearQuestions && yearQuestions.length > 0) {
      result.push(yearQuestions.shift()!);
    }

    yearIndex = (yearIndex + 1) % years.length;

    // Remover anos vazios
    if (byYear.get(year)?.length === 0) {
      const emptyYearIndex = years.indexOf(year);
      if (emptyYearIndex !== -1) {
        years.splice(emptyYearIndex, 1);
      }
    }

    // Se não há mais questões, parar
    if (years.length === 0) break;
  }

  return result.slice(0, count);
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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Rate limiting para criação de simulados
    const { success } = await checkRateLimit(user.id, simulationRateLimit);
    if (!success) {
      logger.warn("Simulation creation rate limit exceeded", { userId: user.id });
      return NextResponse.json(
        createError("SIMULATION_RATE_LIMIT_EXCEEDED").toJSON(),
        { status: 429 }
      );
    }

    // Validar dados
    const data = CreateSimulationSchema.parse(body);

    logger.info("Creating simulation", {
      userId: user.id,
      type: data.type,
      questionCount: data.questionCount
    });

    const config = SIMULATION_CONFIGS[data.type];
    const questionCount = data.questionCount || config.questionCount;

    // Construir where clause baseado no tipo de simulado
    let where: Prisma.QuestionWhereInput = { nullified: false };

    if (data.type === "FULL_EXAM") {
      // Simulado completo usa distribuição específica
      const subjectEntries = Object.entries(SIMULATION_CONFIGS.FULL_EXAM.distribution);

      // Buscar questões já respondidas pelo usuário (últimos 90 dias)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);

      const answeredQuestions = await prisma.userAnswer.findMany({
        where: {
          userId: user.id,
          createdAt: { gte: threeMonthsAgo },
        },
        select: { questionId: true },
        distinct: ['questionId'],
      });

      const answeredQuestionIds = new Set(answeredQuestions.map(a => a.questionId));

      // Buscar questões em paralelo por matéria com aleatorização inteligente
      const questionPromises = subjectEntries.map(async ([subject, count]) => {
        if (count === 0) return [];

        // ESTRATÉGIA: Buscar MAIS questões para poder filtrar e aleatorizar
        const questions = await prisma.question.findMany({
          where: {
            subject: subject as any,
            nullified: false,
          },
          select: {
            id: true,
            examYear: true,
            examPhase: true,
          },
          take: count * 5, // Buscar 5x mais para ter opções
        });

        // Filtrar questões já respondidas (priorizar não respondidas)
        const notAnswered = questions.filter(q => !answeredQuestionIds.has(q.id));
        const answered = questions.filter(q => answeredQuestionIds.has(q.id));

        // Combinar: priorizar não respondidas, mas incluir algumas respondidas se necessário
        const availableQuestions = notAnswered.length >= count
          ? notAnswered
          : [...notAnswered, ...answered];

        // Aleatorizar com diversificação de anos
        const shuffled = shuffleWithDiversity(availableQuestions, count);

        return shuffled.map(q => q.id);
      });

      const questionsArrays = await Promise.all(questionPromises);
      const questions = questionsArrays.flat();

      // Shuffle final para misturar matérias
      const finalShuffled = questions.sort(() => Math.random() - 0.5);

      logger.debug("Full exam simulation questions selected", {
        userId: user.id,
        totalQuestions: finalShuffled.length,
        expectedQuestions: 80
      });

      // Criar simulado com menos includes (otimização)
      const simulation = await prisma.simulation.create({
        data: {
          userId: user.id,
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

      logger.info("Full exam simulation created successfully", {
        userId: user.id,
        simulationId: simulation.id,
        totalQuestions: simulation.totalQuestions
      });

      return NextResponse.json(simulation);
    }

    // Para outros tipos, usar seleção aleatória com diversificação
    if (data.subjects && data.subjects.length > 0) {
      where.subject = { in: data.subjects };
    }

    if (data.targetDifficulty) {
      where.difficulty = data.targetDifficulty;
    }

    // Buscar questões já respondidas pelo usuário (últimos 90 dias)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);

    const answeredQuestions = await prisma.userAnswer.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: threeMonthsAgo },
      },
      select: { questionId: true },
      distinct: ['questionId'],
    });

    const answeredQuestionIds = new Set(answeredQuestions.map(a => a.questionId));

    // Buscar mais questões para ter opções de aleatorização
    const allQuestions = await prisma.question.findMany({
      where,
      select: {
        id: true,
        examYear: true,
        examPhase: true,
      },
      take: questionCount * 3, // Buscar 3x mais para ter opções
    });

    // Filtrar e priorizar questões não respondidas
    const notAnswered = allQuestions.filter(q => !answeredQuestionIds.has(q.id));
    const answered = allQuestions.filter(q => answeredQuestionIds.has(q.id));

    const availableQuestions = notAnswered.length >= questionCount
      ? notAnswered
      : [...notAnswered, ...answered];

    // Embaralhar com diversificação de anos
    const shuffled = shuffleWithDiversity(availableQuestions, questionCount);
    const questions = shuffled;

    // Criar simulado (otimizado - sem includes desnecessários)
    const simulation = await prisma.simulation.create({
      data: {
        userId: user.id,
        type: data.type,
        totalQuestions: questions.length,
        subjects: data.subjects || [],
        targetDifficulty: data.targetDifficulty,
        questions: {
          create: questions.map((question, index) => ({
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

    logger.info("Simulation created successfully", {
      userId: user.id,
      simulationId: simulation.id,
      type: simulation.type,
      totalQuestions: simulation.totalQuestions
    });

    return NextResponse.json(simulation);
  } catch (error) {
    logger.error("Error creating simulation", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        createError("UNAUTHORIZED").toJSON(),
        { status: 401 }
      );
    }

    return NextResponse.json(
      createError("DATABASE_ERROR").toJSON(),
      { status: 500 }
    );
  }
}
