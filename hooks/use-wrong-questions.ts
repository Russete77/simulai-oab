'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/swr/fetcher';
import { swrKeys } from '@/lib/swr/keys';
import type { Subject } from '@prisma/client';

export interface UserAnswerData {
  alternativeId: string;
  timeSpent: number;
  createdAt: string;
}

export interface AlternativeData {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

export interface WrongQuestion {
  id: string;
  statement: string;
  subject: Subject;
  examYear: number;
  examPhase: number;
  questionNumber: number;
  alternatives: AlternativeData[];
  userAnswer: UserAnswerData;
  correctAlternativeId: string;
}

export interface WrongQuestionsResponse {
  questions: WrongQuestion[];
  summary: {
    total: number;
    bySubject: Record<string, number>;
  };
}

export interface UseWrongQuestionsOptions {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  dedupingInterval?: number;
}

/**
 * Hook to fetch user's wrong questions for review
 * Provides detailed information about incorrect answers
 */
export function useWrongQuestions(options?: UseWrongQuestionsOptions) {
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<WrongQuestionsResponse>(
    swrKeys.wrongQuestions,
    fetcher,
    {
      revalidateOnFocus: options?.revalidateOnFocus ?? true,
      revalidateOnReconnect: options?.revalidateOnReconnect ?? true,
      dedupingInterval: options?.dedupingInterval ?? 120000, // 2 minutes
      errorRetryCount: 2,
      errorRetryInterval: 5000,
    }
  );

  return {
    questions: data?.questions,
    summary: data?.summary,
    error,
    isLoading,
    /** Manually trigger a refresh */
    refresh: mutate,
  };
}

/**
 * Hook to fetch wrong questions for a specific subject
 */
export function useWrongQuestionsBySubject(
  subject?: Subject,
  options?: UseWrongQuestionsOptions
) {
  const { questions, summary, error, isLoading, refresh } = useWrongQuestions(options);

  const filteredQuestions = questions?.filter(q => q.subject === subject);
  const filteredSummary = subject
    ? {
        total: filteredQuestions?.length || 0,
        bySubject: { [subject]: filteredQuestions?.length || 0 },
      }
    : summary;

  return {
    questions: filteredQuestions,
    summary: filteredSummary,
    error,
    isLoading,
    refresh,
  };
}
