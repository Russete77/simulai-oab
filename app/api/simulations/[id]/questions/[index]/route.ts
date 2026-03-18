import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/simulations/[id]/questions/[index]
 * Busca uma questão específica do simulado por índice (otimização - carrega só o necessário)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: simulationId, index: indexStr } = await params;
    const index = parseInt(indexStr);

    if (isNaN(index) || index < 0) {
      return NextResponse.json(
        { error: "Invalid question index" },
        { status: 400 }
      );
    }

    // Buscar simulação (verificar se pertence ao usuário)
    const simulation = await prisma.simulation.findUnique({
      where: { id: simulationId },
      select: {
        id: true,
        userId: true,
        totalQuestions: true,
      },
    });

    if (!simulation) {
      return NextResponse.json(
        { error: "Simulation not found" },
        { status: 404 }
      );
    }

    if (simulation.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Buscar questão específica por ordem
    const simulationQuestion = await prisma.simulationQuestion.findFirst({
      where: {
        simulationId,
        order: index + 1, // order começa em 1
      },
      include: {
        question: {
          include: {
            alternatives: {
              select: {
                id: true,
                label: true,
                text: true,
                // NÃO incluir isCorrect (só depois de responder)
              },
            },
          },
        },
      },
    });

    if (!simulationQuestion) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      question: {
        id: simulationQuestion.question.id,
        examId: simulationQuestion.question.examId,
        examYear: simulationQuestion.question.examYear,
        examPhase: simulationQuestion.question.examPhase,
        questionNumber: simulationQuestion.question.questionNumber,
        subject: simulationQuestion.question.subject,
        statement: simulationQuestion.question.statement,
        nullified: simulationQuestion.question.nullified,
        alternatives: simulationQuestion.question.alternatives,
      },
      index,
      totalQuestions: simulation.totalQuestions,
    });
  } catch (error) {
    console.error("[API] Error fetching simulation question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
