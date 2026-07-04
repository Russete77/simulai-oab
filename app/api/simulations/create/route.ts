import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requirePaidUserOrDiagnostic, handlePaymentRequired } from "@/lib/auth";
import { OAB_EXAM_DISTRIBUTION } from "@/lib/constants/exam";
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
 * Calcula peso de um ano baseado em quão recente ele é
 * Anos mais recentes = maior peso = maior chance de seleção
 *
 * PESOS:
 * - 2020-2024: peso 5.0 (prioridade máxima - legislação atual)
 * - 2017-2019: peso 3.0 (alta prioridade)
 * - 2014-2016: peso 2.0 (média prioridade)
 * - 2011-2013: peso 1.0 (baixa prioridade)
 * - Antes 2011: peso 0.5 (mínima - pode ter lei desatualizada)
 */
function getYearWeight(year: number): number {
  const currentYear = new Date().getFullYear();

  // PESOS AJUSTADOS - Anos recentes dominam MUITO mais
  if (year >= currentYear - 2) return 10.0; // Últimos 2 anos: PRIORIDADE MÁXIMA
  if (year >= 2020) return 5.0;  // 2020-2023: Alta prioridade
  if (year >= 2017) return 2.0;  // 2017-2019: Média prioridade
  if (year >= 2014) return 1.0;  // 2014-2016: Baixa prioridade
  if (year >= 2011) return 0.3;  // 2011-2013: Muito baixa
  return 0.1;                     // Antes 2011: MÍNIMA (quase zero)
}

/**
 * Embaralha questões com distribuição PONDERADA POR RELEVÂNCIA
 *
 * ALGORITMO:
 * 1. Agrupa questões por ano
 * 2. Calcula PESO de cada ano (anos recentes têm maior peso)
 * 3. Distribui questões proporcionalmente aos pesos (não à quantidade)
 * 4. Garante diversidade embaralhando resultado final
 *
 * OBJETIVO:
 * - Priorizar questões RECENTES (legislação atual, jurisprudência atualizada)
 * - Reduzir questões ANTIGAS (pode ter lei revogada, entendimento superado)
 * - Manter DIVERSIDADE de anos
 *
 * EXEMPLO (80 questões):
 * - 2020-2024: ~40 questões (50%) - peso 5.0
 * - 2017-2019: ~25 questões (30%) - peso 3.0
 * - 2014-2016: ~10 questões (13%) - peso 2.0
 * - 2011-2013: ~5 questões (7%)   - peso 1.0
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

  const years = Array.from(byYear.keys()).sort((a, b) => b - a); // Ordenar do mais recente ao mais antigo

  // PASSO 2: Calcular peso total e distribuição
  const yearWeights = new Map<number, number>();
  let totalWeight = 0;

  years.forEach((year) => {
    const weight = getYearWeight(year);
    const available = byYear.get(year)!.length;

    // Peso efetivo = peso do ano * quantidade disponível
    // Isso evita que anos com poucas questões dominem
    // Peso puro (sem normalização - prioriza anos recentes)
    const effectiveWeight = weight;

    yearWeights.set(year, effectiveWeight);
    totalWeight += effectiveWeight;
  });

  // PASSO 3: Distribuir questões proporcionalmente aos pesos
  const distribution = new Map<number, number>();
  let allocated = 0;

  years.forEach((year, index) => {
    const yearQuestions = byYear.get(year)!;
    const weight = yearWeights.get(year)!;

    // Calcular quantas questões deste ano baseado no peso
    let yearCount = Math.round((weight / totalWeight) * count);

    // Garantir que não excede disponível
    yearCount = Math.min(yearCount, yearQuestions.length);

    // Garantir pelo menos 1 questão se há disponível (diversidade)
    if (yearCount === 0 && yearQuestions.length > 0 && allocated < count) {
      yearCount = 1;
    }

    // Última iteração: ajustar para bater exatamente `count`
    if (index === years.length - 1) {
      yearCount = Math.min(count - allocated, yearQuestions.length);
    }

    distribution.set(year, yearCount);
    allocated += yearCount;
  });

  // PASSO 4: Se ainda falta, redistribuir priorizando anos RECENTES
  let remaining = count - allocated;
  while (remaining > 0) {
    let distributed = false;

    // Tentar distribuir para anos mais recentes primeiro
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

    // Evitar loop infinito
    if (!distributed) break;
  }

  // PASSO 5: Selecionar questões de cada ano
  const result: typeof questions = [];

  years.forEach((year) => {
    const yearQuestions = byYear.get(year)!;
    const neededCount = distribution.get(year) || 0;

    if (neededCount === 0) return;

    // Embaralhar questões do ano e pegar as N primeiras
    const shuffled = fisherYatesShuffle(yearQuestions);
    result.push(...shuffled.slice(0, neededCount));
  });

  // PASSO 6: Embaralhar resultado final para diversificar ordem
  const finalResult = fisherYatesShuffle(result).slice(0, count);

  // LOGGING DETALHADO (para debug)
  const yearDistribution = new Map<number, number>();
  finalResult.forEach((q) => {
    yearDistribution.set(q.examYear, (yearDistribution.get(q.examYear) || 0) + 1);
  });

  logger.info('[SHUFFLE_DIVERSITY] Distribuição ponderada por relevância:', {
    solicitado: count,
    retornado: finalResult.length,
    disponivel: questions.length,
    distribuicaoPorAno: Object.fromEntries(
      Array.from(yearDistribution.entries()).sort((a, b) => b[0] - a[0]) // Mais recente primeiro
    ),
    pesosPorAno: Object.fromEntries(
      Array.from(yearWeights.entries()).sort((a, b) => b[0] - a[0])
    ),
  });

  return finalResult;
}

const SIMULATION_CONFIGS = {
  FULL_EXAM: {
    questionCount: 80,
    // Fonte única: lib/constants/exam.ts (compartilhada com o Readiness Score)
    distribution: OAB_EXAM_DISTRIBUTION,
  },
  ADAPTIVE: { questionCount: 40 },
  QUICK_PRACTICE: { questionCount: 20 },
  ERROR_REVIEW: { questionCount: 30 },
  BY_SUBJECT: { questionCount: 50 },
};

export async function POST(request: NextRequest) {
  try {
    const { user, diagnostic } = await requirePaidUserOrDiagnostic();
    const body = await request.json();

    // Fluxo diagnóstico: 1 simulado grátis por usuário sem plano
    if (diagnostic) {
      const existing = await prisma.simulation.count({ where: { userId: user.id } });
      if (existing >= 1) {
        return NextResponse.json(
          {
            error: "Diagnóstico já utilizado",
            message:
              "Você já fez seu simulado diagnóstico grátis. Assine um plano para simulados ilimitados!",
            upgrade: true,
          },
          { status: 402 }
        );
      }
    }

    // Verificar limite mensal de simulados (não se aplica ao diagnóstico grátis)
    const limitCheck = diagnostic
      ? { allowed: true, limit: 1, current: 0, resetAt: null }
      : await checkSimulationLimit(user.id);
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
    const parsed = CreateSimulationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // Diagnóstico é sempre o formato rápido de 20 questões
    if (diagnostic) {
      data.type = SimulationType.QUICK_PRACTICE;
      data.questionCount = 20;
    }

    logger.info("🚀🚀🚀 VERSÃO NOVA COM WEIGHTED ALGORITHM 🚀🚀🚀 Creating simulation", {
      userId: user.id,
      type: data.type,
      questionCount: data.questionCount,
      timestamp: new Date().toISOString(),
      version: "WEIGHTED_V2"
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

        // P0 FIX: Adicionar take limit — antes carregava TODAS as questões (~10k)
        // Buscar candidatas suficientes para o weighted algorithm
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
          take: Math.max(count * 10, 200), // Margem para weighted selection
          orderBy: { examYear: 'desc' }, // Priorizar recentes na seleção
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

      // P1 FIX: Logging sem re-fetch — calcular distribuição a partir dos dados já carregados
      // (antes: query extra desnecessária buscando questões já na memória)
      logger.info('[FULL_EXAM] Simulado criado', {
        userId: user.id,
        total: finalShuffled.length,
        esperado: 80,
        // Distribuição por matéria já está implícita na config SIMULATION_CONFIGS.FULL_EXAM
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

    // P0 FIX: Adicionar take limit (antes: sem take, carregava tudo)
    const allQuestions = await prisma.question.findMany({
      where,
      select: {
        id: true,
        examYear: true,
        examPhase: true,
      },
      take: Math.max(questionCount * 10, 500), // Margem para weighted selection
      orderBy: { examYear: 'desc' },
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

    // P1 FIX: Logging sem re-fetch (antes: query extra desnecessária)
    // Distribuição por ano já disponível nos dados em memória
    const yearDistribution = new Map<number, number>();
    questions.forEach((q) => {
      yearDistribution.set(q.examYear, (yearDistribution.get(q.examYear) || 0) + 1);
    });

    logger.info(`[${data.type}] Simulado criado`, {
      userId: user.id,
      total: questions.length,
      esperado: questionCount,
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
    const paymentResp = handlePaymentRequired(error);
    if (paymentResp) return paymentResp;

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
