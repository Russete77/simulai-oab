import { NextRequest, NextResponse } from "next/server";
import { requirePaidUser, handlePaymentRequired } from "@/lib/auth";
import { generateExplanation } from "@/lib/ai/explanation-service";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, aiRateLimit } from "@/lib/rate-limit";
import { createError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { checkAiExplanationLimit, incrementAiExplanationCount } from "@/lib/billing/limits";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePaidUser();
    const { id } = await params;

    // Verificar limite diário de explicações IA
    const limitCheck = await checkAiExplanationLimit(user.id);
    if (!limitCheck.allowed) {
      logger.warn("AI explanation limit exceeded", {
        userId: user.id,
        questionId: id,
        limit: limitCheck.limit,
        current: limitCheck.current
      });
      return NextResponse.json(
        {
          error: "Limite diário de explicações IA atingido",
          limit: limitCheck.limit,
          current: limitCheck.current,
          resetAt: limitCheck.resetAt,
          planType: user.planType,
          message: `Você atingiu o limite de ${limitCheck.limit} explicações por dia do plano ${user.planType}. Faça upgrade para continuar!`
        },
        { status: 429 }
      );
    }

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

    // Incrementar contador de explicações IA
    await incrementAiExplanationCount(user.id);

    // Parse JSON estruturado da IA
    let structuredExplanation;
    try {
      structuredExplanation = JSON.parse(explanation);
    } catch (parseError) {
      logger.error("Failed to parse AI explanation as JSON", {
        questionId: id,
        explanation: explanation.substring(0, 200),
      });
      // Fallback: retorna texto bruto se não conseguir parsear
      structuredExplanation = {
        resumo: "Explicação gerada",
        correta: { motivo: explanation, baseLegal: "" },
        incorretas: [],
        dica: "",
        pegadinhas: [],
      };
    }

    return NextResponse.json({
      explanation: structuredExplanation,
      metadata: {
        isCorrect: userAnswer?.isCorrect,
        userAnswer: userAlternative?.label,
        correctAnswer: correctAlternative.label,
      },
    });
  } catch (error) {
    const paymentResp = handlePaymentRequired(error);
    if (paymentResp) return paymentResp;

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
