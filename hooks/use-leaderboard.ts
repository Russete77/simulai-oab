'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/swr/fetcher';
import { swrKeys } from '@/lib/swr/keys';

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

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  currentUserRank: LeaderboardEntry | null;
  stats: {
    totalUsers: number;
    averagePoints: number;
    topScore: number;
  };
}

export interface UseLeaderboardOptions {
  limit?: number;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  dedupingInterval?: number;
}

/**
 * Hook to fetch leaderboard data
 * Includes top users and current user's ranking
 */
export function useLeaderboard(options?: UseLeaderboardOptions) {
  const limit = options?.limit ?? 100;

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<LeaderboardResponse>(
    swrKeys.leaderboard(limit),
    fetcher,
    {
      revalidateOnFocus: options?.revalidateOnFocus ?? true,
      revalidateOnReconnect: options?.revalidateOnReconnect ?? true,
      dedupingInterval: options?.dedupingInterval ?? 60000, // 1 minute
      errorRetryCount: 2,
      errorRetryInterval: 5000,
    }
  );

  return {
    leaderboard: data?.leaderboard,
    currentUserRank: data?.currentUserRank,
    stats: data?.stats,
    error,
    isLoading,
    /** Manually trigger a refresh */
    refresh: mutate,
  };
}

/**
 * Hook to fetch a specific range of leaderboard with custom limit
 */
export function useLeaderboardTop(
  limit: number = 10,
  options?: Omit<UseLeaderboardOptions, 'limit'>
) {
  return useLeaderboard({ ...options, limit });
}
