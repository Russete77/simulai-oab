import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth";
import type { DashboardAnalyticsResponse } from "@/types/api";
import { Subject } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Buscar todas as respostas do usuário
    const userAnswers = await prisma.userAnswer.findMany({
      where: { userId: user.id },
      include: {
        question: {
          select: {
            subject: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (userAnswers.length === 0) {
      return NextResponse.json({
        totalQuestions: 0,
        accuracy: 0,
        bySubject: [],
        weakAreas: [],
        predictions: {
          examScore: 0,
          probability: 0,
        },
        recentActivity: [],
      });
    }

    // Calcular métricas gerais
    const totalQuestions = userAnswers.length;
    const correctAnswers = userAnswers.filter((a) => a.isCorrect).length;
    const accuracy = (correctAnswers / totalQuestions) * 100;

    // Calcular por matéria
    const bySubjectMap = new Map<
      Subject,
      { total: number; correct: number; recent: boolean[] }
    >();

    userAnswers.forEach((answer) => {
      const subject = answer.question.subject;

      if (!bySubjectMap.has(subject)) {
        bySubjectMap.set(subject, { total: 0, correct: 0, recent: [] });
      }

      const stats = bySubjectMap.get(subject)!;
      stats.total += 1;

      if (answer.isCorrect) {
        stats.correct += 1;
      }

      // Últimas 10 respostas para calcular trend
      if (stats.recent.length < 10) {
        stats.recent.push(answer.isCorrect);
      }
    });

    const bySubject = Array.from(bySubjectMap.entries()).map(
      ([subject, stats]) => {
        const accuracy = (stats.correct / stats.total) * 100;

        // Calcular trend (diferença entre últimas 10 e média geral)
        const recentAccuracy =
          stats.recent.length > 0
            ? (stats.recent.filter((r) => r).length / stats.recent.length) * 100
            : accuracy;

        const trend = recentAccuracy - accuracy;

        return {
          subject,
          accuracy: Math.round(accuracy * 10) / 10,
          trend: Math.round(trend * 10) / 10,
          total: stats.total,
        };
      }
    );

    // Identificar áreas fracas (< 60% de acerto)
    const weakAreas = bySubject
      .filter((s) => s.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3)
      .map((s) => s.subject);

    // Predição simples de score no exame (baseado na média ponderada)
    const examScore = Math.min(100, accuracy * 1.1); // 10% de bônus otimista
    const probability = Math.min(95, accuracy * 0.9); // Probabilidade de aprovação

    // Atividade recente (últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAnswers = userAnswers.filter(
      (a) => a.createdAt >= sevenDaysAgo
    );

    const activityByDay = new Map<string, { total: number; correct: number }>();

    recentAnswers.forEach((answer) => {
      const date = answer.createdAt.toISOString().split("T")[0];

      if (!activityByDay.has(date)) {
        activityByDay.set(date, { total: 0, correct: 0 });
      }

      const day = activityByDay.get(date)!;
      day.total += 1;

      if (answer.isCorrect) {
        day.correct += 1;
      }
    });

    const recentActivity = Array.from(activityByDay.entries()).map(
      ([date, stats]) => ({
        date,
        questionsAnswered: stats.total,
        accuracy: Math.round((stats.correct / stats.total) * 100 * 10) / 10,
      })
    );

    const response: DashboardAnalyticsResponse = {
      totalQuestions,
      accuracy: Math.round(accuracy * 10) / 10,
      bySubject,
      weakAreas,
      predictions: {
        examScore: Math.round(examScore * 10) / 10,
        probability: Math.round(probability * 10) / 10,
      },
      recentActivity,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erro ao buscar analytics" },
      { status: 500 }
    );
  }
}
