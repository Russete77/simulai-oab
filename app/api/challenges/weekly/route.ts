import { NextRequest, NextResponse } from 'next/server';
import { requirePaidUser, handlePaymentRequired } from '@/lib/auth';

/**
 * GET /api/challenges/weekly
 * Get this week's challenges and user progress
 * Challenges are deterministic based on week number
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requirePaidUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate current week number
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - startOfYear.getTime();
    const weekNumber = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));

    // Define all possible challenges
    const allChallenges = [
      {
        id: 'questions-50',
        title: 'Responda 50 Questões',
        description: 'Complete 50 questões esta semana',
        type: 'questions',
        target: 50,
        reward: 250,
        difficulty: 'medium',
      },
      {
        id: 'correct-streak',
        title: '10 Acertos Seguidos',
        description: 'Acerte 10 questões consecutivas',
        type: 'streak',
        target: 10,
        reward: 300,
        difficulty: 'hard',
      },
      {
        id: 'subjects',
        title: 'Estude 5 Matérias',
        description: 'Responda questões de 5 matérias diferentes',
        type: 'subjects',
        target: 5,
        reward: 200,
        difficulty: 'medium',
      },
      {
        id: 'simulations',
        title: '3 Simulados Completos',
        description: 'Complete 3 simulados durante a semana',
        type: 'simulations',
        target: 3,
        reward: 400,
        difficulty: 'hard',
      },
      {
        id: 'daily-streak',
        title: 'Sequência de 7 Dias',
        description: 'Estude todos os dias desta semana',
        type: 'daily_streak',
        target: 7,
        reward: 350,
        difficulty: 'hard',
      },
      {
        id: 'accuracy',
        title: '80% de Acerto',
        description: 'Mantenha 80% ou mais de acerto nas questões',
        type: 'accuracy',
        target: 80,
        reward: 275,
        difficulty: 'medium',
      },
    ];

    // Select 3 challenges deterministically based on week number
    const selectedChallenges = [];
    for (let i = 0; i < 3; i++) {
      const index = (weekNumber + i) % allChallenges.length;
      selectedChallenges.push(allChallenges[index]);
    }

    // Get user progress (from UserProfile and UserAnswer queries)
    // For now, return mock progress - in production, this would query the database
    const userProgress = {
      questionsAnswered: user.profile?.totalQuestions || 0,
      correctAnswers: user.profile?.correctAnswers || 0,
      currentStreak: user.profile?.streak || 0,
      subjectsStudied: user.profile?.preferredSubjects?.length || 0,
      simulationsCompleted: 0, // Would be queried from Simulation table
      daysSinceLastAnswer: 0, // Would be calculated from lastStudyDate
      weeklyAccuracy: user.profile?.totalQuestions
        ? Math.round(
            ((user.profile?.correctAnswers || 0) / (user.profile?.totalQuestions || 1)) * 100
          )
        : 0,
    };

    // Calculate progress for each challenge
    const challengesWithProgress = selectedChallenges.map((challenge) => {
      let current = 0;

      switch (challenge.type) {
        case 'questions':
          current = userProgress.questionsAnswered;
          break;
        case 'streak':
          current = userProgress.currentStreak;
          break;
        case 'subjects':
          current = userProgress.subjectsStudied;
          break;
        case 'simulations':
          current = userProgress.simulationsCompleted;
          break;
        case 'daily_streak':
          current = userProgress.daysSinceLastAnswer;
          break;
        case 'accuracy':
          current = userProgress.weeklyAccuracy;
          break;
      }

      const progress = Math.min((current / challenge.target) * 100, 100);
      const completed = current >= challenge.target;

      return {
        ...challenge,
        current,
        progress,
        completed,
      };
    });

    // Calculate week end date
    const daysToFriday = 5 - now.getDay();
    const nextFriday = new Date(now);
    nextFriday.setDate(now.getDate() + (daysToFriday >= 0 ? daysToFriday : 7 + daysToFriday));
    nextFriday.setHours(23, 59, 59, 999);

    return NextResponse.json({
      weekNumber: weekNumber + 1,
      deadline: nextFriday.toISOString(),
      challenges: challengesWithProgress,
      totalXpAvailable: selectedChallenges.reduce((sum, ch) => sum + ch.reward, 0),
      totalXpEarned: challengesWithProgress.reduce((sum, ch) => {
        const baseReward = ch.reward;
        const earnedReward = Math.round(baseReward * (ch.progress / 100));
        return sum + earnedReward;
      }, 0),
    });
  } catch (error) {
    const paymentResp = handlePaymentRequired(error);
    if (paymentResp) return paymentResp;

    console.error('Error fetching weekly challenges:', error);
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}
