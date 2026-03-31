/**
 * Leaderboard Service
 * Encapsulates business logic for leaderboard queries and rankings
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export interface LeaderboardEntry {
  rank: number;
  id: string;
  userId: string;
  name: string;
  email: string;
  totalPoints: number;
  level: number;
  streak: number;
  correctAnswers: number;
  totalQuestions: number;
  isCurrentUser: boolean;
}

export interface LeaderboardStats {
  totalUsers: number;
  averagePoints: number;
  topScore: number;
}

export interface LeaderboardResult {
  leaderboard: LeaderboardEntry[];
  currentUserRank: LeaderboardEntry | null;
  stats: LeaderboardStats;
}

/**
 * Get leaderboard with user ranking
 * Includes top users and current user's position
 */
export async function getLeaderboard(
  userId: string,
  limit: number = 100
): Promise<LeaderboardResult> {
  try {
    logger.info('Fetching leaderboard', { userId, limit });

    // Fetch top users
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
        { totalPoints: 'desc' },
        { level: 'desc' },
        { streak: 'desc' },
      ],
      take: limit,
    });

    // Format leaderboard with ranks
    const leaderboard: LeaderboardEntry[] = topUsers.map((profile, index) => ({
      rank: index + 1,
      id: profile.id,
      userId: profile.userId,
      name: profile.user.name || 'Usuário',
      email: profile.user.email,
      totalPoints: profile.totalPoints,
      level: profile.level,
      streak: profile.streak,
      correctAnswers: profile.correctAnswers,
      totalQuestions: profile.totalQuestions,
      isCurrentUser: profile.userId === userId,
    }));

    // Find current user in leaderboard
    let currentUserRank = leaderboard.find((u) => u.isCurrentUser) || null;

    // If current user not in top, fetch their position
    if (!currentUserRank) {
      const currentUserProfile = await prisma.userProfile.findUnique({
        where: { userId },
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
        // Count users above current user
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
          name: currentUserProfile.user.name || 'Usuário',
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

    // Fetch global statistics
    const totalUsers = await prisma.userProfile.count();
    const averagePointsResult = await prisma.userProfile.aggregate({
      _avg: {
        totalPoints: true,
      },
    });

    const stats: LeaderboardStats = {
      totalUsers,
      averagePoints: Math.round(averagePointsResult._avg.totalPoints || 0),
      topScore: leaderboard[0]?.totalPoints || 0,
    };

    logger.info('Leaderboard fetched successfully', {
      userId,
      leaderboardSize: leaderboard.length,
      currentUserRank: currentUserRank?.rank,
      totalUsers,
    });

    return {
      leaderboard,
      currentUserRank,
      stats,
    };
  } catch (error) {
    logger.error('Error fetching leaderboard', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });
    throw error;
  }
}

/**
 * Get top N users from leaderboard
 */
export async function getLeaderboardTop(
  userId: string,
  limit: number = 10
): Promise<LeaderboardResult> {
  return getLeaderboard(userId, limit);
}

/**
 * Get user's ranking information
 */
export async function getUserRanking(userId: string): Promise<LeaderboardEntry | null> {
  try {
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
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

    if (!userProfile) {
      return null;
    }

    // Count users above
    const usersAbove = await prisma.userProfile.count({
      where: {
        OR: [
          { totalPoints: { gt: userProfile.totalPoints } },
          {
            AND: [
              { totalPoints: userProfile.totalPoints },
              { level: { gt: userProfile.level } },
            ],
          },
          {
            AND: [
              { totalPoints: userProfile.totalPoints },
              { level: userProfile.level },
              { streak: { gt: userProfile.streak } },
            ],
          },
        ],
      },
    });

    return {
      rank: usersAbove + 1,
      id: userProfile.id,
      userId: userProfile.userId,
      name: userProfile.user.name || 'Usuário',
      email: userProfile.user.email,
      totalPoints: userProfile.totalPoints,
      level: userProfile.level,
      streak: userProfile.streak,
      correctAnswers: userProfile.correctAnswers,
      totalQuestions: userProfile.totalQuestions,
      isCurrentUser: true,
    };
  } catch (error) {
    logger.error('Error fetching user ranking', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });
    throw error;
  }
}

/**
 * Get leaderboard statistics without user rankings
 */
export async function getLeaderboardStats(): Promise<LeaderboardStats> {
  try {
    const totalUsers = await prisma.userProfile.count();
    const averagePointsResult = await prisma.userProfile.aggregate({
      _avg: {
        totalPoints: true,
      },
    });

    const topUserProfile = await prisma.userProfile.findFirst({
      orderBy: { totalPoints: 'desc' },
      select: { totalPoints: true },
    });

    return {
      totalUsers,
      averagePoints: Math.round(averagePointsResult._avg.totalPoints || 0),
      topScore: topUserProfile?.totalPoints || 0,
    };
  } catch (error) {
    logger.error('Error fetching leaderboard stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
