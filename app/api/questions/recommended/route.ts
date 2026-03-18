import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Subject } from "@prisma/client";
import { logger } from "@/lib/logger";

// Tipo para resultado da agregação por matéria no banco
interface SubjectPerformance {
  subject: Subject;
  total: number;
  correct: number;
  percentage: number;
}

/**
 * GET /api/questions/recommended
 * Retorna questões recomendadas baseadas nas matérias com pior desempenho
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    logger.info("Fetching recommended questions", { userId: user.id });

    // P0+P1 FIX: Usar agregação no banco ao invés de findMany + forEach em JS
    const subjectStats = await prisma.$queryRaw<SubjectPerformance[]>`
      SELECT
        q.subject,
        COUNT(*)::int as total,
        SUM(CASE WHEN ua."isCorrect" THEN 1 ELSE 0 END)::int as correct,
        ROUND(AVG(CASE WHEN ua."isCorrect" THEN 1.0 ELSE 0.0 END) * 100, 0)::int as percentage
      FROM "UserAnswer" ua
      JOIN "Question" q ON ua."questionId" = q.id
      WHERE ua."userId" = ${user.id}
      GROUP BY q.subject
    `;

    // Se usuário ainda não respondeu nada, retornar questões aleatórias
    if (subjectStats.length === 0) {
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

    // Identificar matérias com <70% de acerto (mínimo 5 questões respondidas)
    const weakSubjects = subjectStats
      .filter((s) => s.percentage < 70 && s.total >= 5)
      .sort((a, b) => a.percentage - b.percentage) // Pior primeiro
      .slice(0, 3) // Top 3 piores
      .map((s) => ({
        subject: s.subject,
        percentage: s.percentage,
        total: s.total,
        correct: s.correct,
      }));

    // Se não tem matérias fracas, pegar as com menos questões respondidas
    if (weakSubjects.length === 0) {
      const leastPracticedSubjects = subjectStats
        .sort((a, b) => a.total - b.total) // Menos praticadas primeiro
        .slice(0, 3)
        .map((s) => ({
          subject: s.subject,
          percentage: s.percentage,
          total: s.total,
          correct: s.correct,
          reason: "Pratique mais esta matéria",
        }));

      const subjectsToRecommend = leastPracticedSubjects.map((s) => s.subject);
      const questions = await getQuestionsForSubjects(user.id, subjectsToRecommend);

      return NextResponse.json({
        recommendations: leastPracticedSubjects,
        questions,
        message: "Continue praticando estas matérias para melhorar seu desempenho!",
      });
    }

    // Buscar questões das matérias fracas que o usuário ainda não respondeu
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
  // P0 FIX: Adicionar take limit — antes carregava TODOS os questionIds sem limite
  const answeredQuestions = await prisma.userAnswer.findMany({
    where: { userId },
    select: { questionId: true },
    distinct: ["questionId"],
    take: 5000, // Limite de segurança
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
    take: 20,
    orderBy: [
      { examYear: "desc" },
      { examPhase: "desc" },
    ],
  });

  // Se não há questões não respondidas suficientes, permitir questões já respondidas
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
