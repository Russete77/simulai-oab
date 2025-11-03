import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth";
import { CreateSimulationSchema } from "@/lib/validations/simulation";
import { SimulationType, Prisma } from "@prisma/client";
import { checkRateLimit, simulationRateLimit } from "@/lib/rate-limit";
import { createError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { checkSimulationLimit, incrementSimulationCount } from "@/lib/billing/limits";

/**
 * Fisher-Yates shuffle algorithm (correto)
 * Melhor que Math.random() - 0.5
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
 * Embaralha questões com distribuição PROPORCIONAL e BALANCEADA por ano
 *
 * ALGORITMO:
 * 1. Agrupa questões por ano
 * 2. Calcula distribuição proporcional (quantas de cada ano selecionar)
 * 3. Seleciona aleatoriamente dentro de cada ano
 * 4. Embaralha resultado final para evitar blocos do mesmo ano
 *
 * EXEMPLO:
 * - Input: 100 questões (50 de 2010, 30 de 2012, 20 de 2015)
 * - Precisa: 10 questões
 * - Output: ~5 de 2010, ~3 de 2012, ~2 de 2015 (proporcional)
 */
function shuffleWithDiversity(
  questions: Array<{ id: string; examYear: number; examPhase: number }>,
  count: number
): Array<{ id: string; examYear: number; examPhase: number }> {
  if (questions.length === 0) return [];
  if (questions.length <= count) return fisherYatesShuffle(questions);

  // PASSO 1: Agrupar por ano
  const byYear = new Map<number, typeof questions>();
  questions.forEach((q) => {
    if (!byYear.has(q.examYear)) {
      byYear.set(q.examYear, []);
    }
    byYear.get(q.examYear)!.push(q);
  });

  const totalAvailable = questions.length;
  const years = Array.from(byYear.keys()).sort((a, b) => a - b);

  // PASSO 2: Calcular distribuição proporcional
  const distribution = new Map<number, number>();
  let allocated = 0;

  years.forEach((year, index) => {
    const yearQuestions = byYear.get(year)!;
    const proportion = yearQuestions.length / totalAvailable;

    // Distribuir proporcionalmente
    let yearCount = Math.round(proportion * count);

    // Garantir que não excede disponível
    yearCount = Math.min(yearCount, yearQuestions.length);

    // Última iteração: ajustar para bater exatamente `count`
    if (index === years.length - 1) {
      yearCount = Math.min(count - allocated, yearQuestions.length);
    }

    distribution.set(year, yearCount);
    allocated += yearCount;
  });

  // PASSO 3: Se ainda falta (devido a arredondamentos), redistribuir
  let remaining = count - allocated;
  while (remaining > 0) {
    // Buscar anos que ainda têm questões disponíveis
    for (const year of years) {
      if (remaining <= 0) break;

      const currentAlloc = distribution.get(year) || 0;
      const available = byYear.get(year)!.length;

      if (currentAlloc < available) {
        distribution.set(year, currentAlloc + 1);
        remaining--;
      }
    }

    // Evitar loop infinito
    if (remaining > 0 && years.every(y => (distribution.get(y) || 0) >= byYear.get(y)!.length)) {
      break;
    }
  }

  // PASSO 4: Selecionar questões de cada ano
  const result: typeof questions = [];

  years.forEach((year) => {
    const yearQuestions = byYear.get(year)!;
    const neededCount = distribution.get(year) || 0;

    if (neededCount === 0) return;

    // Embaralhar questões do ano e pegar as N primeiras
    const shuffled = fisherYatesShuffle(yearQuestions);
    result.push(...shuffled.slice(0, neededCount));
  });

  // PASSO 5: Embaralhar resultado final para diversificar ordem
  const finalResult = fisherYatesShuffle(result).slice(0, count);

  // LOGGING DETALHADO (para debug)
  const yearDistribution = new Map<number, number>();
  finalResult.forEach((q) => {
    yearDistribution.set(q.examYear, (yearDistribution.get(q.examYear) || 0) + 1);
  });

  logger.info('[SHUFFLE_DIVERSITY] Distribuição final:', {
    solicitado: count,
    retornado: finalResult.length,
    disponivel: totalAvailable,
    anos: Object.fromEntries(
      Array.from(yearDistribution.entries()).sort((a, b) => a[0] - b[0])
    ),
  });

  return finalResult;
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

    // Verificar limite mensal de simulados
    const limitCheck = await checkSimulationLimit(user.id);
    if (!limitCheck.allowed) {
      logger.warn("Monthly simulation limit exceeded", {
        userId: user.id,
        limit: limitCheck.limit,
        current: limitCheck.current
      });
      return NextResponse.json(
        {
          error: "Limite mensal de simulados atingido",
          limit: limitCheck.limit,
          current: limitCheck.current,
          resetAt: limitCheck.resetAt,
          planType: user.planType,
          message: `Você atingiu o limite de ${limitCheck.limit} simulados por mês do plano ${user.planType}. Faça upgrade para continuar!`
        },
        { status: 429 }
      );
    }

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

        // OTIMIZAÇÃO: Stage 1 - Contar questões não respondidas disponíveis
        const availableCount = await prisma.question.count({
          where: {
            subject: subject as any,
            nullified: false,
            id: { notIn: Array.from(answeredQuestionIds) },
          },
        });

        // Stage 2 - Buscar quantidade otimizada (1.5x para margem de segurança)
        const fetchMultiplier = availableCount >= count ? 1.5 : 2.5;
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
          take: Math.ceil(count * fetchMultiplier), // Reduzido de 5x para 1.5-2.5x
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

      // Shuffle final para misturar matérias (Fisher-Yates)
      const finalShuffled = fisherYatesShuffle(questions);

      // LOGGING DETALHADO: Distribuição por matéria e ano
      const subjectDistribution: Record<string, number> = {};
      const yearDistributionFinal = new Map<number, number>();

      // Buscar informações completas das questões para logging
      const fullQuestions = await prisma.question.findMany({
        where: { id: { in: finalShuffled } },
        select: { id: true, subject: true, examYear: true },
      });

      fullQuestions.forEach((q) => {
        subjectDistribution[q.subject] = (subjectDistribution[q.subject] || 0) + 1;
        yearDistributionFinal.set(q.examYear, (yearDistributionFinal.get(q.examYear) || 0) + 1);
      });

      logger.info('[FULL_EXAM] Distribuição de questões:', {
        userId: user.id,
        total: finalShuffled.length,
        esperado: 80,
        porMateria: subjectDistribution,
        porAno: Object.fromEntries(
          Array.from(yearDistributionFinal.entries()).sort((a, b) => a[0] - b[0])
        ),
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

      // Incrementar contador mensal de simulados
      await incrementSimulationCount(user.id);

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

    // OTIMIZAÇÃO: Stage 1 - Contar questões não respondidas disponíveis
    const whereNotAnswered: Prisma.QuestionWhereInput = {
      ...where,
      id: { notIn: Array.from(answeredQuestionIds) },
    };

    const availableCount = await prisma.question.count({
      where: whereNotAnswered,
    });

    // Stage 2 - Buscar quantidade otimizada baseada na disponibilidade
    const fetchMultiplier = availableCount >= questionCount ? 1.5 : 2.5;
    const allQuestions = await prisma.question.findMany({
      where,
      select: {
        id: true,
        examYear: true,
        examPhase: true,
      },
      take: Math.ceil(questionCount * fetchMultiplier), // Reduzido de 3x para 1.5-2.5x
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

    // LOGGING DETALHADO: Distribuição por matéria e ano (outros tipos)
    const subjectDistribution: Record<string, number> = {};
    const yearDistribution = new Map<number, number>();

    const fullQuestions = await prisma.question.findMany({
      where: { id: { in: questions.map(q => q.id) } },
      select: { id: true, subject: true, examYear: true },
    });

    fullQuestions.forEach((q) => {
      subjectDistribution[q.subject] = (subjectDistribution[q.subject] || 0) + 1;
      yearDistribution.set(q.examYear, (yearDistribution.get(q.examYear) || 0) + 1);
    });

    logger.info(`[${data.type}] Distribuição de questões:`, {
      userId: user.id,
      total: questions.length,
      esperado: questionCount,
      porMateria: subjectDistribution,
      porAno: Object.fromEntries(
        Array.from(yearDistribution.entries()).sort((a, b) => a[0] - b[0])
      ),
    });

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

    // Incrementar contador mensal de simulados
    await incrementSimulationCount(user.id);

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
