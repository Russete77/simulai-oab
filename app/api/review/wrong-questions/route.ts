import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Buscar questões que o usuário errou
    const wrongAnswers = await prisma.userAnswer.findMany({
      where: {
        userId: user.id,
        isCorrect: false,
      },
      include: {
        question: {
          include: {
            alternatives: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      distinct: ["questionId"], // Pegar apenas a última tentativa de cada questão
    });

    // Formatar resposta
    const questions = wrongAnswers.map((answer) => ({
      id: answer.question.id,
      statement: answer.question.statement,
      subject: answer.question.subject,
      examYear: answer.question.examYear,
      examPhase: answer.question.examPhase,
      questionNumber: answer.question.questionNumber,
      alternatives: answer.question.alternatives.map((alt) => ({
        id: alt.id,
        label: alt.label,
        text: alt.text,
        isCorrect: alt.isCorrect,
      })),
      userAnswer: {
        alternativeId: answer.alternativeId,
        timeSpent: answer.timeSpent,
        createdAt: answer.createdAt,
      },
      correctAlternativeId: answer.question.alternatives.find((a) => a.isCorrect)?.id,
    }));

    // Agrupar por matéria
    const bySubject = questions.reduce((acc, q) => {
      acc[q.subject] = (acc[q.subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      questions,
      summary: {
        total: questions.length,
        bySubject,
      },
    });
  } catch (error) {
    console.error("Error fetching wrong questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch wrong questions" },
      { status: 500 }
    );
  }
}
