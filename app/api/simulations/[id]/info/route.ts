import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requirePaidUser, handlePaymentRequired } from "@/lib/auth";

/**
 * GET /api/simulations/[id]/info
 * Busca informações básicas do simulado SEM carregar todas as questões (otimização)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePaidUser();
    const { id: simulationId } = await params;

    // Buscar simulação com informações mínimas
    const simulation = await prisma.simulation.findUnique({
      where: { id: simulationId },
      select: {
        id: true,
        userId: true,
        type: true,
        status: true,
        totalQuestions: true,
        score: true,
        timeSpent: true,
        subjects: true,
        targetDifficulty: true,
        startedAt: true,
        completedAt: true,
        // NÃO incluir questions (economy massivo de dados)
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

    // Buscar respostas já dadas (se houver)
    const answers = await prisma.userAnswer.findMany({
      where: {
        simulationId,
        userId: user.id,
      },
      select: {
        questionId: true,
        alternativeId: true,
        isCorrect: true,
        timeSpent: true,
      },
    });

    return NextResponse.json({
      simulation,
      answeredQuestions: answers,
    });
  } catch (error) {
    const paymentResp = handlePaymentRequired(error);
    if (paymentResp) return paymentResp;

    console.error("[API] Error fetching simulation info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
