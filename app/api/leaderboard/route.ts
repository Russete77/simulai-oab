import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/leaderboard
 * Retorna o ranking de usuários ordenado por pontos totais
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");

    // Buscar top usuários ordenados por pontos
    const topUsers = await prisma.userProfile.findMany({
      select: {
        id: true,
        userId: true,
        totalPoints: true,
        streak: true,
        level: true,
        totalQuestions: true,
        correctAnswers: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { totalPoints: "desc" },
        { level: "desc" },
        { streak: "desc" },
      ],
      take: limit,
    });

    // Formatar ranking com posições
    const leaderboard = topUsers.map((profile, index) => ({
      rank: index + 1,
      id: profile.id,
      userId: profile.userId,
      name: profile.user.name || "Usuário",
      email: profile.user.email,
      totalPoints: profile.totalPoints,
      level: profile.level,
      streak: profile.streak,
      correctAnswers: profile.correctAnswers,
      totalQuestions: profile.totalQuestions,
      isCurrentUser: profile.userId === user.id,
    }));

    // Buscar posição do usuário atual se não estiver no top
    let currentUserRank = leaderboard.find((u) => u.isCurrentUser);

    if (!currentUserRank) {
      const currentUserProfile = await prisma.userProfile.findUnique({
        where: { userId: user.id },
        select: {
          id: true,
          userId: true,
          totalPoints: true,
          streak: true,
          level: true,
          totalQuestions: true,
          correctAnswers: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (currentUserProfile) {
        const usersAbove = await prisma.userProfile.count({
          where: {
            OR: [
              { totalPoints: { gt: currentUserProfile.totalPoints } },
              {
                AND: [
                  { totalPoints: currentUserProfile.totalPoints },
                  { level: { gt: currentUserProfile.level } },
                ],
              },
              {
                AND: [
                  { totalPoints: currentUserProfile.totalPoints },
                  { level: currentUserProfile.level },
                  { streak: { gt: currentUserProfile.streak } },
                ],
              },
            ],
          },
        });

        currentUserRank = {
          rank: usersAbove + 1,
          id: currentUserProfile.id,
          userId: currentUserProfile.userId,
          name: currentUserProfile.user.name || "Usuário",
          email: currentUserProfile.user.email,
          totalPoints: currentUserProfile.totalPoints,
          level: currentUserProfile.level,
          streak: currentUserProfile.streak,
          correctAnswers: currentUserProfile.correctAnswers,
          totalQuestions: currentUserProfile.totalQuestions,
          isCurrentUser: true,
        };
      }
    }

    // Estatísticas gerais
    const totalUsers = await prisma.userProfile.count();
    const averagePointsResult = await prisma.userProfile.aggregate({
      _avg: {
        totalPoints: true,
      },
    });

    return NextResponse.json({
      leaderboard,
      currentUserRank,
      stats: {
        totalUsers,
        averagePoints: Math.round(averagePointsResult._avg.totalPoints || 0),
        topScore: leaderboard[0]?.totalPoints || 0,
      },
    });
  } catch (error) {
    console.error("❌ Leaderboard error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar leaderboard" },
      { status: 500 }
    );
  }
}
