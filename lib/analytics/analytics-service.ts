import { prisma } from "@/lib/db/prisma";
import { Subject } from "@prisma/client";

export interface SubjectPerformance {
  subject: Subject;
  total: number;
  correct: number;
  percentage: number;
}

export interface PerformanceOverTime {
  date: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface DifficultyAnalysis {
  easy: { correct: number; total: number; percentage: number };
  medium: { correct: number; total: number; percentage: number };
  hard: { correct: number; total: number; percentage: number };
}

export interface AnalyticsData {
  overview: {
    totalQuestions: number;
    correctAnswers: number;
    successRate: number;
    averageTime: number;
    streak: number;
  };
  subjectPerformance: SubjectPerformance[];
  performanceOverTime: PerformanceOverTime[];
  difficultyAnalysis: DifficultyAnalysis;
  recentActivity: {
    date: string;
    questionsAnswered: number;
  }[];
}

const SUBJECT_LABELS: Record<Subject, string> = {
  ETHICS: "Ética",
  CONSTITUTIONAL: "Constitucional",
  CIVIL: "Civil",
  CIVIL_PROCEDURE: "Processo Civil",
  CRIMINAL: "Penal",
  CRIMINAL_PROCEDURE: "Processo Penal",
  LABOUR: "Trabalho",
  LABOUR_PROCEDURE: "Processo do Trabalho",
  ADMINISTRATIVE: "Administrativo",
  TAXES: "Tributário",
  BUSINESS: "Empresarial",
  CONSUMER: "Consumidor",
  ENVIRONMENTAL: "Ambiental",
  CHILDREN: "ECA",
  INTERNATIONAL: "Internacional",
  HUMAN_RIGHTS: "Direitos Humanos",
  GENERAL: "Geral",
};

export async function getUserAnalytics(userId: string): Promise<AnalyticsData> {
  // Get all user answers
  const userAnswers = await prisma.userAnswer.findMany({
    where: { userId },
    include: {
      question: {
        include: { alternatives: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate overview
  const totalQuestions = userAnswers.length;
  const correctAnswers = userAnswers.filter((a) => a.isCorrect).length;
  const successRate = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  const averageTime = totalQuestions > 0
    ? userAnswers.reduce((sum, a) => sum + a.timeSpent, 0) / totalQuestions
    : 0;

  // Calculate streak (consecutive correct answers)
  let streak = 0;
  for (const answer of userAnswers) {
    if (answer.isCorrect) {
      streak++;
    } else {
      break;
    }
  }

  // Subject performance
  const subjectMap = new Map<Subject, { correct: number; total: number }>();
  for (const answer of userAnswers) {
    const subject = answer.question.subject;
    const current = subjectMap.get(subject) || { correct: 0, total: 0 };
    current.total++;
    if (answer.isCorrect) current.correct++;
    subjectMap.set(subject, current);
  }

  const subjectPerformance: SubjectPerformance[] = Array.from(subjectMap.entries())
    .map(([subject, { correct, total }]) => ({
      subject,
      subjectLabel: SUBJECT_LABELS[subject],
      total,
      correct,
      percentage: (correct / total) * 100,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Performance over time (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentAnswers = userAnswers.filter(
    (a) => a.createdAt >= thirtyDaysAgo
  );

  // Group by date
  const dateMap = new Map<string, { correct: number; total: number }>();
  for (const answer of recentAnswers) {
    const dateKey = answer.createdAt.toISOString().split("T")[0];
    const current = dateMap.get(dateKey) || { correct: 0, total: 0 };
    current.total++;
    if (answer.isCorrect) current.correct++;
    dateMap.set(dateKey, current);
  }

  const performanceOverTime: PerformanceOverTime[] = Array.from(dateMap.entries())
    .map(([date, { correct, total }]) => ({
      date,
      correct,
      total,
      percentage: (correct / total) * 100,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Difficulty analysis (mock for now - we don't have difficulty in schema yet)
  const difficultyAnalysis: DifficultyAnalysis = {
    easy: { correct: 0, total: 0, percentage: 0 },
    medium: { correct: 0, total: 0, percentage: 0 },
    hard: { correct: 0, total: 0, percentage: 0 },
  };

  // Recent activity (questions per day, last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const last7DaysAnswers = userAnswers.filter(
    (a) => a.createdAt >= sevenDaysAgo
  );

  const activityMap = new Map<string, number>();
  for (const answer of last7DaysAnswers) {
    const dateKey = answer.createdAt.toISOString().split("T")[0];
    activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 1);
  }

  const recentActivity = Array.from(activityMap.entries())
    .map(([date, questionsAnswered]) => ({ date, questionsAnswered }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    overview: {
      totalQuestions,
      correctAnswers,
      successRate: Math.round(successRate * 10) / 10,
      averageTime: Math.round(averageTime),
      streak,
    },
    subjectPerformance,
    performanceOverTime,
    difficultyAnalysis,
    recentActivity,
  };
}

export async function getSimulationAnalytics(simulationId: string) {
  const simulation = await prisma.simulation.findUnique({
    where: { id: simulationId },
    include: {
      answers: {
        include: {
          question: {
            include: { alternatives: true },
          },
        },
      },
    },
  });

  if (!simulation) {
    throw new Error("Simulação não encontrada");
  }

  const totalQuestions = simulation.answers.length;
  const correctAnswers = simulation.answers.filter((a) => a.isCorrect).length;
  const successRate = (correctAnswers / totalQuestions) * 100;

  // Subject breakdown
  const subjectMap = new Map<Subject, { correct: number; total: number }>();
  for (const answer of simulation.answers) {
    const subject = answer.question.subject;
    const current = subjectMap.get(subject) || { correct: 0, total: 0 };
    current.total++;
    if (answer.isCorrect) current.correct++;
    subjectMap.set(subject, current);
  }

  const subjectPerformance: SubjectPerformance[] = Array.from(subjectMap.entries())
    .map(([subject, { correct, total }]) => ({
      subject,
      subjectLabel: SUBJECT_LABELS[subject],
      total,
      correct,
      percentage: (correct / total) * 100,
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject));

  // Wrong answers details
  const wrongAnswers = simulation.answers
    .filter((a) => !a.isCorrect)
    .map((a) => ({
      questionId: a.questionId,
      subject: a.question.subject,
      subjectLabel: SUBJECT_LABELS[a.question.subject],
      statement: a.question.statement,
      userAnswer: a.question.alternatives.find(
        (alt) => alt.id === a.alternativeId
      )?.label,
      correctAnswer: a.question.alternatives.find((alt) => alt.isCorrect)?.label,
    }));

  return {
    simulation: {
      id: simulation.id,
      type: simulation.type,
      score: simulation.score,
      totalQuestions,
      correctAnswers,
      successRate: Math.round(successRate * 10) / 10,
      startedAt: simulation.startedAt,
      completedAt: simulation.completedAt,
      duration: simulation.completedAt
        ? Math.floor(
            (simulation.completedAt.getTime() - simulation.startedAt.getTime()) / 1000
          )
        : 0,
    },
    subjectPerformance,
    wrongAnswers,
  };
}
