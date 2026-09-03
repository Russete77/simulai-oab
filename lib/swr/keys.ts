/**
 * SWR Cache Keys
 * Centralized definitions for all SWR data fetching keys
 */

export const swrKeys = {
  // Analytics
  analytics: '/api/analytics',
  analyticsDashboard: '/api/analytics/dashboard',

  // Leaderboard
  leaderboard: (limit?: number) =>
    limit ? `/api/leaderboard?limit=${limit}` : '/api/leaderboard',

  // Questions
  nextQuestion: (subject?: string, difficulty?: string, excludeAnswered?: boolean) => {
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    if (difficulty) params.append('difficulty', difficulty);
    if (excludeAnswered) params.append('excludeAnswered', 'true');
    const queryString = params.toString();
    return `/api/questions/next${queryString ? `?${queryString}` : ''}`;
  },

  questionById: (id: string) => `/api/questions/next?questionId=${id}`,

  recommended: '/api/questions/recommended',

  // Simulations
  simulationInfo: (id: string) => `/api/simulations/${id}/info`,
  simulationAnalytics: (id: string) => `/api/simulations/${id}/analytics`,
  simulationQuestion: (id: string, index: number) =>
    `/api/simulations/${id}/questions/${index}`,

  // User
  userProfile: '/api/user/profile',
} as const;

/**
 * Helper to generate mutation keys (for form submissions)
 */
export const mutationKeys = {
  answerQuestion: '/api/questions/answer',
  createSimulation: '/api/simulations/create',
  finishSimulation: '/api/simulations/finish',
  explainQuestion: (id: string) => `/api/questions/${id}/explain`,
} as const;
