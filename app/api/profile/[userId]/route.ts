import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        profile: {
          select: {
            totalPoints: true,
            level: true,
            streak: true,
            totalQuestions: true,
            correctAnswers: true,
            averageTime: true,
          },
        },
        achievements: {
          include: {
            achievement: true,
          },
          orderBy: { unlockedAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const accuracy = user.profile && user.profile.totalQuestions > 0
      ? Math.round((user.profile.correctAnswers / user.profile.totalQuestions) * 100)
      : 0;

    // Count rank
    const usersAbove = user.profile
      ? await prisma.userProfile.count({
          where: { totalPoints: { gt: user.profile.totalPoints } },
        })
      : 0;

    return NextResponse.json({
      id: user.id,
      name: user.name || 'Estudante',
      memberSince: user.createdAt,
      stats: {
        totalPoints: user.profile?.totalPoints || 0,
        level: user.profile?.level || 1,
        streak: user.profile?.streak || 0,
        totalQuestions: user.profile?.totalQuestions || 0,
        accuracy,
        rank: usersAbove + 1,
      },
      achievements: user.achievements.map(ua => ({
        id: ua.achievement.id,
        key: ua.achievement.key,
        name: ua.achievement.name,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        points: ua.achievement.points,
        unlockedAt: ua.unlockedAt,
      })),
    });
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
