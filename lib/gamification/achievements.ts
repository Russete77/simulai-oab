// Sistema de Conquistas - Simulai OAB
// Baseado no PRD linha 303-310

export interface Achievement {
  key: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  condition: (stats: UserStats) => boolean;
}

export interface UserStats {
  totalQuestions: number;
  correctAnswers: number;
  streak: number;
  totalSimulations: number;
  perfectSimulations: number;
  subjectMastery: Record<string, number>; // subject -> accuracy %
  speedRuns: number; // questões < 30s
}

// Definição de todas as conquistas
export const ACHIEVEMENTS: Achievement[] = [
  {
    key: "FIRST_CORRECT",
    name: "🎯 Primeira Acertada",
    description: "Responda sua primeira questão corretamente",
    icon: "🎯",
    points: 50,
    condition: (stats) => stats.correctAnswers >= 1,
  },
  {
    key: "STREAK_7",
    name: "🔥 Sequência de 7 Dias",
    description: "Estude por 7 dias consecutivos",
    icon: "🔥",
    points: 200,
    condition: (stats) => stats.streak >= 7,
  },
  {
    key: "STREAK_30",
    name: "🔥 Sequência de 30 Dias",
    description: "Estude por 30 dias consecutivos",
    icon: "🔥",
    points: 1000,
    condition: (stats) => stats.streak >= 30,
  },
  {
    key: "PERFECT_SIMULATION",
    name: "🏆 Simulado Perfeito",
    description: "Acerte 100% das questões em um simulado",
    icon: "🏆",
    points: 500,
    condition: (stats) => stats.perfectSimulations >= 1,
  },
  {
    key: "MASTER_SUBJECT",
    name: "📚 Mestre da Matéria",
    description: "Alcance 90% de acerto em uma matéria (mín. 20 questões)",
    icon: "📚",
    points: 300,
    condition: (stats) =>
      Object.values(stats.subjectMastery).some((accuracy) => accuracy >= 90),
  },
  {
    key: "SPEEDSTER",
    name: "⚡ Velocista",
    description: "Responda 10 questões em menos de 30 segundos cada",
    icon: "⚡",
    points: 250,
    condition: (stats) => stats.speedRuns >= 10,
  },
  {
    key: "QUESTIONS_100",
    name: "🎓 Centurião",
    description: "Responda 100 questões",
    icon: "🎓",
    points: 200,
    condition: (stats) => stats.totalQuestions >= 100,
  },
  {
    key: "QUESTIONS_500",
    name: "🎓 Veterano",
    description: "Responda 500 questões",
    icon: "🎓",
    points: 500,
    condition: (stats) => stats.totalQuestions >= 500,
  },
  {
    key: "QUESTIONS_1000",
    name: "🎓 Lenda",
    description: "Responda 1000 questões",
    icon: "🎓",
    points: 1000,
    condition: (stats) => stats.totalQuestions >= 1000,
  },
  {
    key: "SIMULATIONS_10",
    name: "📝 Maratonista",
    description: "Complete 10 simulados",
    icon: "📝",
    points: 300,
    condition: (stats) => stats.totalSimulations >= 10,
  },
  {
    key: "ACCURACY_80",
    name: "🎯 Certeiro",
    description: "Alcance 80% de acerto geral (mín. 50 questões)",
    icon: "🎯",
    points: 400,
    condition: (stats) =>
      stats.totalQuestions >= 50 &&
      (stats.correctAnswers / stats.totalQuestions) * 100 >= 80,
  },
];

/**
 * Verifica quais conquistas o usuário desbloqueou
 * Retorna apenas as novas conquistas (que ainda não tinha)
 */
export function checkAchievements(
  stats: UserStats,
  unlockedKeys: string[]
): Achievement[] {
  const newAchievements: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    // Se já tem a conquista, pular
    if (unlockedKeys.includes(achievement.key)) {
      continue;
    }

    // Verificar se atende a condição
    if (achievement.condition(stats)) {
      newAchievements.push(achievement);
    }
  }

  return newAchievements;
}

/**
 * Calcula estatísticas do usuário para verificar conquistas
 * P0+P1 FIX: Usa agregação no banco ao invés de carregar tudo na memória
 */
export async function getUserStats(
  userId: string,
  prisma: any
): Promise<UserStats> {
  // Buscar dados em paralelo — usando agregação no banco
  const [profile, subjectAgg, simulationStats, speedRunCount] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),

    // P1 FIX: Agregar por matéria no banco (antes: findMany + forEach)
    prisma.$queryRaw`
      SELECT
        q.subject,
        COUNT(*)::int as total,
        SUM(CASE WHEN ua."isCorrect" THEN 1 ELSE 0 END)::int as correct
      FROM "UserAnswer" ua
      JOIN "Question" q ON ua."questionId" = q.id
      WHERE ua."userId" = ${userId}
      GROUP BY q.subject
      HAVING COUNT(*) >= 20
    ` as Promise<Array<{ subject: string; total: number; correct: number }>>,

    // P0 FIX: Contar simulados no banco (antes: findMany sem take)
    prisma.$queryRaw`
      SELECT
        COUNT(*)::int as total,
        SUM(CASE WHEN score = 100 THEN 1 ELSE 0 END)::int as perfect
      FROM "Simulation"
      WHERE "userId" = ${userId} AND status = 'COMPLETED'
    ` as Promise<[{ total: number; perfect: number }]>,

    // P0 FIX: Contar speed runs no banco (antes: findMany + filter em JS)
    prisma.userAnswer.count({
      where: { userId, timeSpent: { lt: 30 }, isCorrect: true },
    }),
  ]);

  // Converter agregação em subjectMastery
  const subjectMastery: Record<string, number> = {};
  for (const row of subjectAgg) {
    subjectMastery[row.subject] = (row.correct / row.total) * 100;
  }

  return {
    totalQuestions: profile?.totalQuestions || 0,
    correctAnswers: profile?.correctAnswers || 0,
    streak: profile?.streak || 0,
    totalSimulations: simulationStats[0]?.total || 0,
    perfectSimulations: simulationStats[0]?.perfect || 0,
    subjectMastery,
    speedRuns: speedRunCount,
  };
}
