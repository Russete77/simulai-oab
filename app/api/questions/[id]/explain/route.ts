import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { generateExplanation } from "@/lib/ai/explanation-service";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, aiRateLimit } from "@/lib/rate-limit";
import { createError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Rate limiting para IA
    const { success } = await checkRateLimit(user.id, aiRateLimit);
    if (!success) {
      logger.warn("AI rate limit exceeded", { userId: user.id, questionId: id });
      return NextResponse.json(
        createError("AI_RATE_LIMIT_EXCEEDED").toJSON(),
        { status: 429 }
      );
    }

    logger.info("Generating explanation", { questionId: id, userId: user.id });

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
      logger.warn("Question not found for explanation", { questionId: id });
      return NextResponse.json(
        createError("QUESTION_NOT_FOUND").toJSON(),
        { status: 404 }
      );
    }

    // Encontrar alternativa correta
    const correctAlternative = question.alternatives.find((a) => a.isCorrect);
    if (!correctAlternative) {
      logger.error("Question missing correct alternative", { questionId: id });
      return NextResponse.json(
        createError("INVALID_QUESTION_DATA").toJSON(),
        { status: 400 }
      );
    }

    // Verificar se usuário respondeu
    const userAnswer = question.userAnswers[0];
    const userAlternative = userAnswer
      ? question.alternatives.find((a) => a.id === userAnswer.alternativeId)
      : null;

    // Read optional style from request body
    const body = await request.json().catch(() => ({}));
    const style = body.style as 'professor' | 'concise' | 'chat' | undefined;

    // Gerar explicação
    const explanation = await generateExplanation({
      questionId: question.id,
      question: question.statement,
      alternatives: question.alternatives,
      userAnswer: userAlternative?.label,
      correctAnswer: correctAlternative.label,
      subject: question.subject,
      examYear: question.examYear,
    }, style);

    logger.info("Explanation generated successfully", {
      questionId: id,
      userId: user.id,
      wasCorrect: userAnswer?.isCorrect
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
    logger.error("Error generating explanation", {
      error: error instanceof Error ? error.message : "Unknown error",
      questionId: await params.then(p => p.id),
    });

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        createError("UNAUTHORIZED").toJSON(),
        { status: 401 }
      );
    }

    return NextResponse.json(
      createError("AI_SERVICE_ERROR").toJSON(),
      { status: 500 }
    );
  }
}
