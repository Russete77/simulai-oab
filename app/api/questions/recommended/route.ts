import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Subject } from "@prisma/client";
import { logger } from "@/lib/logger";

/**
 * GET /api/questions/recommended
 * Retorna questões recomendadas baseadas nas matérias com pior desempenho
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    logger.info("Fetching recommended questions", { userId: user.id });

    // 1. Analisar performance por matéria
    const userAnswers = await prisma.userAnswer.findMany({
      where: { userId: user.id },
      select: {
        isCorrect: true,
        question: {
          select: {
            subject: true,
          },
        },
      },
    });

    // Se usuário ainda não respondeu nada, retornar questões aleatórias
    if (userAnswers.length === 0) {
      const randomQuestions = await prisma.question.findMany({
        where: { nullified: false },
        include: { alternatives: true },
        take: 10,
        orderBy: { examYear: "desc" },
      });

      return NextResponse.json({
        recommendations: [],
        questions: randomQuestions,
        message: "Responda algumas questões para receber recomendações personalizadas!",
      });
    }

    // 2. Calcular taxa de acerto por matéria
    const subjectStats = new Map<
      Subject,
      { correct: number; total: number; percentage: number }
    >();

    userAnswers.forEach((answer) => {
      const subject = answer.question.subject;
      const current = subjectStats.get(subject) || { correct: 0, total: 0, percentage: 0 };
      current.total++;
      if (answer.isCorrect) current.correct++;
      subjectStats.set(subject, current);
    });

    // Calcular percentuais
    subjectStats.forEach((stats, subject) => {
      stats.percentage = Math.round((stats.correct / stats.total) * 100);
    });

    // 3. Identificar matérias com <70% de acerto (mínimo 5 questões respondidas)
    const weakSubjects = Array.from(subjectStats.entries())
      .filter(([_, stats]) => stats.percentage < 70 && stats.total >= 5)
      .sort((a, b) => a[1].percentage - b[1].percentage) // Pior primeiro
      .slice(0, 3) // Top 3 piores
      .map(([subject, stats]) => ({
        subject,
        percentage: stats.percentage,
        total: stats.total,
        correct: stats.correct,
      }));

    // Se não tem matérias fracas, pegar as com menos questões respondidas
    if (weakSubjects.length === 0) {
      const leastPracticedSubjects = Array.from(subjectStats.entries())
        .sort((a, b) => a[1].total - b[1].total) // Menos praticadas primeiro
        .slice(0, 3)
        .map(([subject, stats]) => ({
          subject,
          percentage: stats.percentage,
          total: stats.total,
          correct: stats.correct,
          reason: "Pratique mais esta matéria",
        }));

      const subjectsToRecommend = leastPracticedSubjects.map((s) => s.subject);

      // Buscar questões dessas matérias
      const questions = await getQuestionsForSubjects(user.id, subjectsToRecommend);

      return NextResponse.json({
        recommendations: leastPracticedSubjects,
        questions,
        message: "Continue praticando estas matérias para melhorar seu desempenho!",
      });
    }

    // 4. Buscar questões das matérias fracas que o usuário ainda não respondeu
    const subjectsToRecommend = weakSubjects.map((s) => s.subject);
    const questions = await getQuestionsForSubjects(user.id, subjectsToRecommend);

    logger.info("Recommended questions generated", {
      userId: user.id,
      weakSubjects: weakSubjects.length,
      questionsFound: questions.length,
    });

    return NextResponse.json({
      recommendations: weakSubjects.map((s) => ({
        ...s,
        reason: `Apenas ${s.percentage}% de acerto`,
      })),
      questions,
      message: "Foque nestas matérias para melhorar seu desempenho!",
    });
  } catch (error) {
    logger.error("Error fetching recommended questions", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erro ao buscar questões recomendadas" },
      { status: 500 }
    );
  }
}

/**
 * Helper: Busca questões de matérias específicas que o usuário ainda não respondeu
 */
async function getQuestionsForSubjects(
  userId: string,
  subjects: Subject[]
): Promise<any[]> {
  // Buscar questões já respondidas
  const answeredQuestions = await prisma.userAnswer.findMany({
    where: { userId },
    select: { questionId: true },
    distinct: ["questionId"],
  });

  const answeredIds = new Set(answeredQuestions.map((a) => a.questionId));

  // Buscar questões não respondidas das matérias recomendadas
  const questions = await prisma.question.findMany({
    where: {
      subject: { in: subjects },
      nullified: false,
      id: { notIn: Array.from(answeredIds) },
    },
    include: { alternatives: true },
    take: 20, // 20 questões recomendadas
    orderBy: [
      { examYear: "desc" }, // Priorizar questões mais recentes
      { examPhase: "desc" },
    ],
  });

  // Se não há questões não respondidas, permitir questões já respondidas
  if (questions.length < 10) {
    const additionalQuestions = await prisma.question.findMany({
      where: {
        subject: { in: subjects },
        nullified: false,
      },
      include: { alternatives: true },
      take: 20 - questions.length,
      orderBy: { examYear: "desc" },
    });

    return [...questions, ...additionalQuestions];
  }

  return questions;
}
