import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth";
import { AnswerQuestionSchema } from "@/lib/validations/question";
import { calculatePoints, updateStreak, calculateLevel } from "@/lib/gamification/points";
import { checkAchievements, getUserStats } from "@/lib/gamification/achievements";
import type { AnswerQuestionResponse } from "@/types/api";
import { checkRateLimit, answerRateLimit } from "@/lib/rate-limit";
import { createError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Rate limiting para respostas
    const { success } = await checkRateLimit(user.id, answerRateLimit);
    if (!success) {
      logger.warn("Answer rate limit exceeded", { userId: user.id });
      return NextResponse.json(
        createError("ANSWER_RATE_LIMIT_EXCEEDED").toJSON(),
        { status: 429 }
      );
    }

    // Validar dados
    const data = AnswerQuestionSchema.parse(body);

    // OTIMIZAÇÃO: Buscar apenas o necessário
    const [question, alternative] = await Promise.all([
      prisma.question.findUnique({
        where: { id: data.questionId },
        select: {
          id: true,
          difficulty: true,
          explanation: true,
        },
      }),
      prisma.alternative.findUnique({
        where: { id: data.alternativeId },
        select: {
          id: true,
          isCorrect: true,
          questionId: true,
        },
      }),
    ]);

    if (!question || !alternative) {
      logger.warn("Question or alternative not found", {
        questionId: data.questionId,
        alternativeId: data.alternativeId,
        userId: user.id
      });
      return NextResponse.json(
        createError("QUESTION_NOT_FOUND").toJSON(),
        { status: 404 }
      );
    }

    const isCorrect = alternative.isCorrect;

    // Buscar alternativa correta apenas se necessário (para modo prática)
    let correctAlternativeId = data.alternativeId;
    if (!data.simulationId) {
      const correctAlt = await prisma.alternative.findFirst({
        where: { questionId: data.questionId, isCorrect: true },
        select: { id: true },
      });
      correctAlternativeId = correctAlt?.id || data.alternativeId;
    }

    // OTIMIZAÇÃO: Registrar resposta SEM awaitar (fire-and-forget para simulados)
    const answerPromise = prisma.userAnswer.create({
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

    // Se for simulado, apenas registrar e retornar rápido
    if (data.simulationId) {
      // Aguardar apenas o registro da resposta
      await answerPromise;

      logger.debug("Simulation answer recorded", {
        simulationId: data.simulationId,
        questionId: data.questionId,
        isCorrect,
        userId: user.id
      });

      return NextResponse.json({
        isCorrect,
        correctAlternativeId,
      });
    }

    // Modo prática: fazer gamificação completa
    await answerPromise;

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
        newStreak = currentProfile.streak + 1;
      } else if (streakUpdate > 0) {
        newStreak = streakUpdate;
      }

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

      // OTIMIZAÇÃO: Achievements em background (não bloquear resposta)
      if (isCorrect) {
        // Fire-and-forget - não awaitar
        getUserStats(user.id, prisma).then(async (userStats) => {
          const unlockedAchievements = await prisma.userAchievement.findMany({
            where: { userId: user.id },
            select: { achievement: { select: { key: true } } },
          });
          const unlockedKeys = unlockedAchievements.map((ua) => ua.achievement.key);

          const newAchievements = checkAchievements(userStats, unlockedKeys);

          for (const achievement of newAchievements) {
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

            await prisma.userAchievement.create({
              data: {
                userId: user.id,
                achievementId: dbAchievement.id,
              },
            });

            await prisma.userProfile.update({
              where: { userId: user.id },
              data: {
                totalPoints: { increment: achievement.points },
              },
            });
          }
        }).catch(err => logger.error('Achievement processing error', {
          error: err instanceof Error ? err.message : 'Unknown error',
          userId: user.id
        }));
      }
    }

    // Calcular estatísticas em paralelo
    const [stats, correctCount] = await Promise.all([
      prisma.userAnswer.aggregate({
        where: { questionId: data.questionId },
        _avg: { timeSpent: true },
        _count: { _all: true },
      }),
      prisma.userAnswer.count({
        where: { questionId: data.questionId, isCorrect: true },
      }),
    ]);

    const successRate = stats._count._all > 0
      ? (correctCount / stats._count._all) * 100
      : 0;

    const response: AnswerQuestionResponse = {
      isCorrect,
      correctAlternativeId,
      explanation: question.explanation || undefined,
      statistics: {
        successRate: Math.round(successRate * 10) / 10,
        averageTime: Math.round(stats._avg.timeSpent || 0),
        yourTime: data.timeSpent,
      },
    };

    logger.info("Practice answer recorded successfully", {
      questionId: data.questionId,
      isCorrect,
      userId: user.id,
      timeSpent: data.timeSpent
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error answering question", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: (error as any).userId
    });

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        createError("UNAUTHORIZED").toJSON(),
        { status: 401 }
      );
    }

    return NextResponse.json(
      createError("DATABASE_ERROR").toJSON(),
      { status: 500 }
    );
  }
}
