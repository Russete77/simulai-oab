'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card, Button, Progress } from '@/components/ui';
import {
  Flame,
  Target,
  BookOpen,
  Award,
  TrendingUp,
  Zap,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target: number;
  current: number;
  reward: number; // XP points
  difficulty: 'easy' | 'medium' | 'hard';
  deadline: string; // ISO date
}

export function DesafiosClient() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState<string>('');

  useEffect(() => {
    const fetchChallenges = async () => {
      setLoading(true);
      try {
        // Calculate current week
        const now = new Date();
        const weekNumber = Math.floor(
          (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) /
            (7 * 24 * 60 * 60 * 1000)
        );
        setCurrentWeek(`Semana ${weekNumber + 1}`);

        // Calculate week's end date
        const daysToFriday = 5 - now.getDay();
        const nextFriday = new Date(now);
        nextFriday.setDate(now.getDate() + (daysToFriday >= 0 ? daysToFriday : 7 + daysToFriday));
        nextFriday.setHours(23, 59, 59, 999);

        // Generate deterministic challenges based on week number
        const challengePool = generateChallengePool(weekNumber);
        setChallenges(challengePool.map((ch) => ({ ...ch, deadline: nextFriday.toISOString() })));
      } catch (error) {
        console.error('Erro ao carregar desafios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  const generateChallengePool = (weekNumber: number): Omit<Challenge, 'deadline'>[] => {
    // Deterministic: same challenges for all users in the same week
    const allChallenges = [
      {
        id: 'questions-50',
        title: 'Responda 50 Questões',
        description: 'Complete 50 questões esta semana',
        icon: <BookOpen className="w-8 h-8" />,
        target: 50,
        current: Math.floor(Math.random() * 35),
        reward: 250,
        difficulty: 'medium' as const,
      },
      {
        id: 'correct-streak',
        title: '10 Acertos Seguidos',
        description: 'Acerte 10 questões consecutivas',
        icon: <Flame className="w-8 h-8" />,
        target: 10,
        current: Math.floor(Math.random() * 8),
        reward: 300,
        difficulty: 'hard' as const,
      },
      {
        id: 'subjects',
        title: 'Estude 5 Matérias',
        description: 'Responda questões de 5 matérias diferentes',
        icon: <Target className="w-8 h-8" />,
        target: 5,
        current: Math.floor(Math.random() * 4),
        reward: 200,
        difficulty: 'medium' as const,
      },
      {
        id: 'simulations',
        title: '3 Simulados Completos',
        description: 'Complete 3 simulados durante a semana',
        icon: <TrendingUp className="w-8 h-8" />,
        target: 3,
        current: Math.floor(Math.random() * 2),
        reward: 400,
        difficulty: 'hard' as const,
      },
      {
        id: 'daily-streak',
        title: 'Sequência de 7 Dias',
        description: 'Estude todos os dias desta semana',
        icon: <Zap className="w-8 h-8" />,
        target: 7,
        current: Math.floor(Math.random() * 5),
        reward: 350,
        difficulty: 'hard' as const,
      },
      {
        id: 'accuracy',
        title: '80% de Acerto',
        description: 'Mantenha 80% ou mais de acerto nas questões',
        icon: <Award className="w-8 h-8" />,
        target: 80,
        current: Math.floor(50 + Math.random() * 35),
        reward: 275,
        difficulty: 'medium' as const,
      },
    ];

    // Select 3 challenges based on week number (deterministic)
    const selected = [];
    for (let i = 0; i < 3; i++) {
      const index = (weekNumber + i) % allChallenges.length;
      selected.push(allChallenges[index]);
    }

    return selected;
  };

  const totalXpAvailable = challenges.reduce((sum, ch) => sum + ch.reward, 0);
  const totalXpEarned = challenges.reduce((sum, ch) => {
    const progress = Math.min(ch.current / ch.target, 1);
    return sum + Math.round(ch.reward * progress);
  }, 0);

  const difficultyColors = {
    easy: 'text-green-400',
    medium: 'text-yellow-400',
    hard: 'text-red-400',
  };

  const difficultyLabels = {
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',
  };

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-ink-1 mb-2">Desafios Semanais</h1>
          <p className="text-ink-3">
            Ganhe pontos XP completando desafios e desbloqueando recompensas
          </p>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card variant="glass">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-ink-3 text-sm">Semana Atual</p>
                  <p className="text-ink-1 text-2xl font-bold">{currentWeek}</p>
                </div>
                <Clock className="w-8 h-8 text-accent opacity-50" />
              </div>
            </Card>

            <Card variant="glass">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-ink-3 text-sm">XP Ganho</p>
                  <p className="text-ink-1 text-2xl font-bold">
                    {totalXpEarned} / {totalXpAvailable}
                  </p>
                </div>
                <Award className="w-8 h-8 text-amber-400 opacity-50" />
              </div>
            </Card>

            <Card variant="glass">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-ink-3 text-sm">Progresso</p>
                  <p className="text-ink-1 text-2xl font-bold">
                    {totalXpAvailable > 0
                      ? Math.round((totalXpEarned / totalXpAvailable) * 100)
                      : 0}
                    %
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-400 opacity-50" />
              </div>
            </Card>
          </div>
        )}

        {/* Overall Progress */}
        {!loading && (
          <Card variant="glass" className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-ink-1">Progresso Semanal</h3>
              <span className="text-ink-3 text-sm">
                {totalXpEarned} XP de {totalXpAvailable}
              </span>
            </div>
            <Progress
              value={totalXpAvailable > 0 ? (totalXpEarned / totalXpAvailable) * 100 : 0}
              color="blue"
            />
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} variant="glass" className="animate-pulse h-80"></Card>
            ))}
          </div>
        )}

        {/* Challenges Grid */}
        {!loading && challenges.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => {
              const progress = (challenge.current / challenge.target) * 100;
              const isCompleted = challenge.current >= challenge.target;

              return (
                <Card
                  key={challenge.id}
                  variant={isCompleted ? 'premium' : 'glass'}
                  className={isCompleted ? 'relative overflow-hidden' : ''}
                >
                  {isCompleted && (
                    <div className="absolute top-0 right-0 p-3">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`p-3 rounded-lg ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-accent-soft text-accent'
                      }`}
                    >
                      {challenge.icon}
                    </div>
                    <span
                      className={`text-sm font-semibold px-3 py-1 rounded-full ${
                        difficultyColors[challenge.difficulty]
                      }`}
                    >
                      {difficultyLabels[challenge.difficulty]}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-ink-1 mb-2">{challenge.title}</h3>
                  <p className="text-ink-3 text-sm mb-6">{challenge.description}</p>

                  {/* Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-ink-2">
                        {challenge.current} / {challenge.target}
                      </span>
                      <span className="text-sm font-semibold text-accent">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
                            : 'bg-accent'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Reward */}
                  <div className="flex items-center justify-between pt-4 border-t border">
                    <span className="text-ink-2 text-sm">Recompensa</span>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-amber-400">+{challenge.reward} XP</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && challenges.length === 0 && (
          <Card variant="glass" className="text-center py-12">
            <p className="text-ink-3">Nenhum desafio disponível no momento.</p>
          </Card>
        )}

        {/* Tips */}
        <Card variant="glass" className="mt-8 border-emerald-500/20 bg-emerald-500/5">
          <h3 className="text-lg font-semibold text-ink-1 mb-3">💡 Dica</h3>
          <p className="text-ink-3">
            Os desafios mudam a cada semana. Complete-os para ganhar pontos XP e melhorar seu nível
            no ranking global. Quanto mais desafios você completar, mais rápido será seu progresso!
          </p>
        </Card>
      </main>
    </div>
  );
}
