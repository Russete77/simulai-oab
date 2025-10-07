import { Subject, Difficulty, SimulationType } from "@prisma/client";

// API Request Types
export interface GetNextQuestionRequest {
  subject?: Subject;
  difficulty?: Difficulty;
  excludeAnswered?: boolean;
}

export interface AnswerQuestionRequest {
  questionId: string;
  alternativeId: string;
  timeSpent: number;
  confidence?: number;
}

export interface CreateSimulationRequest {
  type: SimulationType;
  subjects?: Subject[];
  targetDifficulty?: Difficulty;
  questionCount?: number;
}

export interface FinishSimulationRequest {
  simulationId: string;
}

// API Response Types
export interface AnswerQuestionResponse {
  isCorrect: boolean;
  correctAlternativeId: string;
  explanation?: string;
  statistics: {
    successRate: number;
    averageTime: number;
    yourTime: number;
  };
}

export interface SimulationReportResponse {
  simulationId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  bySubject: {
    subject: Subject;
    accuracy: number;
    total: number;
    correct: number;
  }[];
  weakAreas: Subject[];
  recommendations: string[];
}

export interface DashboardAnalyticsResponse {
  totalQuestions: number;
  accuracy: number;
  bySubject: {
    subject: Subject;
    accuracy: number;
    trend: number;
    total: number;
  }[];
  weakAreas: Subject[];
  predictions: {
    examScore: number;
    probability: number;
  };
  recentActivity: {
    date: string;
    questionsAnswered: number;
    accuracy: number;
  }[];
}
