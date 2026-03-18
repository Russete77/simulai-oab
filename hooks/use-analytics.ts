'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/swr/fetcher';
import { swrKeys } from '@/lib/swr/keys';
import type { DashboardAnalyticsResponse } from '@/types/api';

export interface UseAnalyticsOptions {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  dedupingInterval?: number;
}

/**
 * Hook to fetch user analytics data
 * Automatically handles loading states, errors, and data caching
 */
export function useAnalytics(options?: UseAnalyticsOptions) {
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<DashboardAnalyticsResponse>(
    swrKeys.analytics,
    fetcher,
    {
      revalidateOnFocus: options?.revalidateOnFocus ?? true,
      revalidateOnReconnect: options?.revalidateOnReconnect ?? true,
      dedupingInterval: options?.dedupingInterval ?? 60000, // 1 minute
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    analytics: data,
    error,
    isLoading,
    /** Manually trigger a refresh */
    refresh: mutate,
  };
}

/**
 * Hook to fetch analytics dashboard with different revalidation strategy
 */
export function useAnalyticsDashboard(options?: UseAnalyticsOptions) {
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<DashboardAnalyticsResponse>(
    swrKeys.analyticsDashboard,
    fetcher,
    {
      revalidateOnFocus: options?.revalidateOnFocus ?? false,
      revalidateOnReconnect: options?.revalidateOnReconnect ?? true,
      dedupingInterval: options?.dedupingInterval ?? 120000, // 2 minutes
      errorRetryCount: 2,
      errorRetryInterval: 10000,
    }
  );

  return {
    analytics: data,
    error,
    isLoading,
    refresh: mutate,
  };
}
