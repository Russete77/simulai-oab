import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth";
import { AnswerQuestionSchema } from "@/lib/validations/question";
import { calculatePoints, updateStreak, calculateLevel } from "@/lib/gamification/points";
import { checkAchievements, getUserStats } from "@/lib/gamification/achievements";
import type { AnswerQuestionResponse } from "@/types/api";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Validar dados
    const data = AnswerQuestionSchema.parse(body);

    // Buscar questão com alternativa correta
    const question = await prisma.question.findUnique({
      where: { id: data.questionId },
      include: {
        alternatives: true,
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Questão não encontrada" },
        { status: 404 }
      );
    }

    // Verificar alternativa selecionada
    const selectedAlternative = question.alternatives.find(
      (a) => a.id === data.alternativeId
    );

    if (!selectedAlternative) {
      return NextResponse.json(
        { error: "Alternativa não encontrada" },
        { status: 404 }
      );
    }

    const correctAlternative = question.alternatives.find((a) => a.isCorrect)!;
    const isCorrect = selectedAlternative.isCorrect;

    // Registrar resposta
    await prisma.userAnswer.create({
      data: {
        userId: user.id,
        questionId: data.questionId,
        alternativeId: data.alternativeId,
        simulationId: data.simulationId ?? undefined,
        isCorrect,
        timeSpent: data.timeSpent,
        confidence: data.confidence,
      },
    });

    // Atualizar perfil do usuário com gamificação
    if (user.profile) {
      const currentProfile = user.profile;

      // Calcular pontos
      const pointsCalc = calculatePoints(
        isCorrect,
        data.timeSpent,
        question.difficulty,
        currentProfile.streak
      );

      // Atualizar streak
      const streakUpdate = updateStreak(currentProfile.lastStudyDate);
      let newStreak = currentProfile.streak;

      if (streakUpdate === -1) {
        // Incrementar streak
        newStreak = currentProfile.streak + 1;
      } else if (streakUpdate > 0) {
        // Resetar streak
        newStreak = streakUpdate;
      }
      // Se streakUpdate === 0, manter streak atual (mesmo dia)

      // Calcular novo total de pontos e nível
      const newTotalPoints = currentProfile.totalPoints + pointsCalc.totalPoints;
      const newLevel = calculateLevel(newTotalPoints);

      // Atualizar perfil
      await prisma.userProfile.update({
        where: { userId: user.id },
        data: {
          totalQuestions: { increment: 1 },
          correctAnswers: isCorrect ? { increment: 1 } : undefined,
          totalPoints: newTotalPoints,
          level: newLevel,
          streak: newStreak,
          lastStudyDate: new Date(),
        },
      });

      // Verificar conquistas (apenas se acertou)
      if (isCorrect) {
        const userStats = await getUserStats(user.id, prisma);
        const unlockedAchievements = await prisma.userAchievement.findMany({
          where: { userId: user.id },
          select: { achievement: { select: { key: true } } },
        });
        const unlockedKeys = unlockedAchievements.map((ua) => ua.achievement.key);

        const newAchievements = checkAchievements(userStats, unlockedKeys);

        // Criar conquistas no banco se não existirem e desbloquear
        for (const achievement of newAchievements) {
          // Criar achievement se não existir
          let dbAchievement = await prisma.achievement.findUnique({
            where: { key: achievement.key },
          });

          if (!dbAchievement) {
            dbAchievement = await prisma.achievement.create({
              data: {
                key: achievement.key,
                name: achievement.name,
                description: achievement.description,
                icon: achievement.icon,
                points: achievement.points,
              },
            });
          }

          // Desbloquear para o usuário
          await prisma.userAchievement.create({
            data: {
              userId: user.id,
              achievementId: dbAchievement.id,
            },
          });

          // Adicionar pontos da conquista
          await prisma.userProfile.update({
            where: { userId: user.id },
            data: {
              totalPoints: { increment: achievement.points },
            },
          });
        }
      }
    }

    // Calcular estatísticas
    const stats = await prisma.userAnswer.aggregate({
      where: { questionId: data.questionId },
      _avg: { timeSpent: true },
      _count: { _all: true },
    });

    const correctCount = await prisma.userAnswer.count({
      where: { questionId: data.questionId, isCorrect: true },
    });

    const successRate = stats._count._all > 0
      ? (correctCount / stats._count._all) * 100
      : 0;

    const response: AnswerQuestionResponse = {
      isCorrect,
      correctAlternativeId: correctAlternative.id,
      explanation: question.explanation || undefined,
      statistics: {
        successRate: Math.round(successRate * 10) / 10,
        averageTime: Math.round(stats._avg.timeSpent || 0),
        yourTime: data.timeSpent,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error answering question:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erro ao registrar resposta" },
      { status: 500 }
    );
  }
}
