import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth";
import type { DashboardAnalyticsResponse } from "@/types/api";
import { Subject } from "@prisma/client";

// Tipo para resultado da query raw de agregação por matéria
interface SubjectAggregation {
  subject: Subject;
  total: number;
  correct: number;
  percentage: number;
}

// Tipo para resultado da query raw de atividade recente
interface DailyActivity {
  date: string;
  total: number;
  correct: number;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // P0+P1 FIX: Usar agregação no banco ao invés de carregar tudo na memória
    // Antes: findMany sem take → forEach/Map em JS
    // Agora: 3 queries paralelas com GROUP BY no PostgreSQL

    const [totalStats, subjectStats, recentActivity] = await Promise.all([
      // Total e acertos gerais
      prisma.$queryRaw<[{ total: bigint; correct: bigint }]>`
        SELECT
          COUNT(*)::bigint as total,
          SUM(CASE WHEN "isCorrect" THEN 1 ELSE 0 END)::bigint as correct
        FROM "UserAnswer"
        WHERE "userId" = ${user.id}
      `,

      // Agregação por matéria (feita no banco, não em JS)
      prisma.$queryRaw<SubjectAggregation[]>`
        SELECT
          q.subject,
          COUNT(*)::int as total,
          SUM(CASE WHEN ua."isCorrect" THEN 1 ELSE 0 END)::int as correct,
          ROUND(AVG(CASE WHEN ua."isCorrect" THEN 1.0 ELSE 0.0 END) * 100, 1)::float as percentage
        FROM "UserAnswer" ua
        JOIN "Question" q ON ua."questionId" = q.id
        WHERE ua."userId" = ${user.id}
        GROUP BY q.subject
        ORDER BY percentage ASC
      `,

      // Atividade dos últimos 7 dias (agregada no banco)
      prisma.$queryRaw<DailyActivity[]>`
        SELECT
          TO_CHAR("createdAt", 'YYYY-MM-DD') as date,
          COUNT(*)::int as total,
          SUM(CASE WHEN "isCorrect" THEN 1 ELSE 0 END)::int as correct
        FROM "UserAnswer"
        WHERE "userId" = ${user.id}
          AND "createdAt" >= NOW() - INTERVAL '7 days'
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
        ORDER BY date ASC
      `,
    ]);

    const totalQuestions = Number(totalStats[0]?.total || 0);
    const correctAnswers = Number(totalStats[0]?.correct || 0);

    if (totalQuestions === 0) {
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

    const accuracy = (correctAnswers / totalQuestions) * 100;

    // Trend por matéria: últimas 10 respostas por matéria via window function
    const recentBySubject = await prisma.$queryRaw<
      { subject: Subject; recent_accuracy: number }[]
    >`
      SELECT subject, recent_accuracy FROM (
        SELECT
          q.subject,
          ROUND(AVG(CASE WHEN ua."isCorrect" THEN 1.0 ELSE 0.0 END) * 100, 1)::float as recent_accuracy
        FROM (
          SELECT ua2.*, ROW_NUMBER() OVER (
            PARTITION BY q2.subject
            ORDER BY ua2."createdAt" DESC
          ) as rn
          FROM "UserAnswer" ua2
          JOIN "Question" q2 ON ua2."questionId" = q2.id
          WHERE ua2."userId" = ${user.id}
        ) ua
        JOIN "Question" q ON ua."questionId" = q.id
        WHERE ua.rn <= 10
        GROUP BY q.subject
      ) sub
    `;

    const recentMap = new Map(
      recentBySubject.map((r) => [r.subject, r.recent_accuracy])
    );

    const bySubject = subjectStats.map((stats) => {
      const recentAccuracy = recentMap.get(stats.subject) ?? stats.percentage;
      const trend = recentAccuracy - stats.percentage;

      return {
        subject: stats.subject,
        accuracy: Math.round(stats.percentage * 10) / 10,
        trend: Math.round(trend * 10) / 10,
        total: stats.total,
      };
    });

    // Identificar áreas fracas (< 60% de acerto)
    const weakAreas = bySubject
      .filter((s) => s.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3)
      .map((s) => s.subject);

    // Predição simples de score no exame
    const examScore = Math.min(100, accuracy * 1.1);
    const probability = Math.min(95, accuracy * 0.9);

    const formattedActivity = recentActivity.map((day) => ({
      date: day.date,
      questionsAnswered: day.total,
      accuracy: day.total > 0
        ? Math.round((day.correct / day.total) * 100 * 10) / 10
        : 0,
    }));

    const response: DashboardAnalyticsResponse = {
      totalQuestions,
      accuracy: Math.round(accuracy * 10) / 10,
      bySubject,
      weakAreas,
      predictions: {
        examScore: Math.round(examScore * 10) / 10,
        probability: Math.round(probability * 10) / 10,
      },
      recentActivity: formattedActivity,
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
