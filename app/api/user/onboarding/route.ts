import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

/**
 * GET /api/user/onboarding
 * Retorna o estado atual do onboarding do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Buscar perfil do usuário
    let profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: {
        onboardingCompleted: true,
        onboardingStep: true,
        onboardingStartedAt: true,
        onboardingCompletedAt: true,
      },
    });

    // Criar perfil se não existir
    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          onboardingCompleted: false,
          onboardingStep: 0,
        },
        select: {
          onboardingCompleted: true,
          onboardingStep: true,
          onboardingStartedAt: true,
          onboardingCompletedAt: true,
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    logger.error("Error fetching onboarding state", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erro ao buscar estado do onboarding" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/onboarding
 * Atualiza o progresso do onboarding
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { step, completed } = body;

    if (typeof step !== "number" || typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    logger.info("Updating onboarding progress", {
      userId: user.id,
      step,
      completed,
    });

    // Buscar ou criar perfil
    let profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Atualizar progresso
    const updateData: any = {
      onboardingStep: step,
      onboardingCompleted: completed,
    };

    // Marcar início do onboarding se for o primeiro passo
    if (step === 1 && !profile.onboardingStartedAt) {
      updateData.onboardingStartedAt = new Date();
    }

    // Marcar conclusão se completo
    if (completed && !profile.onboardingCompletedAt) {
      updateData.onboardingCompletedAt = new Date();
    }

    const updatedProfile = await prisma.userProfile.update({
      where: { userId: user.id },
      data: updateData,
      select: {
        onboardingCompleted: true,
        onboardingStep: true,
        onboardingStartedAt: true,
        onboardingCompletedAt: true,
      },
    });

    logger.info("Onboarding progress updated successfully", {
      userId: user.id,
      step,
      completed,
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    logger.error("Error updating onboarding progress", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erro ao atualizar progresso do onboarding" },
      { status: 500 }
    );
  }
}
