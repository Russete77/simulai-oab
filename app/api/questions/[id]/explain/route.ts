import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { generateExplanation } from "@/lib/ai/explanation-service";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    console.log(`🔍 Gerando explicação para questão ${id}...`);

    // Buscar questão completa
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        alternatives: true,
        userAnswers: {
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Questão não encontrada" },
        { status: 404 }
      );
    }

    // Encontrar alternativa correta
    const correctAlternative = question.alternatives.find((a) => a.isCorrect);
    if (!correctAlternative) {
      return NextResponse.json(
        { error: "Questão sem alternativa correta definida" },
        { status: 400 }
      );
    }

    // Verificar se usuário respondeu
    const userAnswer = question.userAnswers[0];
    const userAlternative = userAnswer
      ? question.alternatives.find((a) => a.id === userAnswer.alternativeId)
      : null;

    // Gerar explicação
    const explanation = await generateExplanation({
      questionId: question.id,
      question: question.statement,
      alternatives: question.alternatives,
      userAnswer: userAlternative?.label,
      correctAnswer: correctAlternative.label,
      subject: question.subject,
      examYear: question.examYear,
    });

    return NextResponse.json({
      explanation,
      metadata: {
        isCorrect: userAnswer?.isCorrect,
        userAnswer: userAlternative?.label,
        correctAnswer: correctAlternative.label,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao gerar explicação:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao gerar explicação",
      },
      { status: 500 }
    );
  }
}
