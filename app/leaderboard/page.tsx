'use client';

import { useEffect, useState, useCallback } from 'react';

// Força renderização dinâmica para garantir que ClerkProvider esteja disponível

import { Header } from '@/components/layout/header';
import { Card, Button } from '@/components/ui';
import { Trophy, Medal, Crown, TrendingUp, Users, Flame, Star, Target } from 'lucide-react';

interface LeaderboardUser {
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

interface LeaderboardData {
  leaderboard: LeaderboardUser[];
  currentUserRank: LeaderboardUser | null;
  stats: {
    totalUsers: number;
    averagePoints: number;
    topScore: number;
  };
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const response = await fetch(`/api/leaderboard?limit=${limit}`, { signal: controller.signal });
        const result = await response.json();
        setData(result);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (typeof error === 'string' && error === 'component unmounted') return;
        console.error('Erro ao buscar leaderboard:', error);
      } finally {
        // Não atualizar estado se o fetch foi abortado (React Strict Mode double-mount)
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchLeaderboard();
    return () => controller.abort('component unmounted');
  }, [limit]);

  const getRankIcon = useCallback((rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-ink-2">#{rank}</span>;
  }, []);

  const getRankColor = useCallback((rank: number) => {
    if (rank === 1) return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/50';
    if (rank === 2) return 'from-gray-400/20 to-gray-500/20 border-gray-400/50';
    if (rank === 3) return 'from-amber-600/20 to-amber-700/20 border-amber-600/50';
    return 'from-navy-800/50 to-navy-900/50 border';
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-bg">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card variant="glass" className="p-8 text-center">
            <p className="text-ink-2">Erro ao carregar leaderboard</p>
          </Card>
        </div>
      </div>
    );
  }

  const accuracy = data.currentUserRank
    ? Math.round((data.currentUserRank.correctAnswers / data.currentUserRank.totalQuestions) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-2xl">
              <Trophy className="w-12 h-12 text-yellow-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-ink-1 mb-2">
            🏆 Ranking Global
          </h1>
          <p className="text-ink-2 text-lg">
            Veja como você se compara aos outros estudantes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card variant="glass" className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent-soft rounded-xl">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-ink-2 text-sm">Total de Estudantes</p>
                <p className="text-2xl font-bold text-ink-1">{data.stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card variant="glass" className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-xl">
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-ink-2 text-sm">Maior Pontuação</p>
                <p className="text-2xl font-bold text-ink-1">{data.stats.topScore.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card variant="glass" className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-ink-2 text-sm">Pontuação Média</p>
                <p className="text-2xl font-bold text-ink-1">{data.stats.averagePoints.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Current User Card (if not in top) */}
        {data.currentUserRank && !data.leaderboard.find(u => u.isCurrentUser) && (
          <Card variant="glass" className="p-6 mb-6 border-2 border-accent/50 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-accent">
                  #{data.currentUserRank.rank}
                </div>
                <div>
                  <p className="text-ink-1 font-semibold text-lg">Sua Posição</p>
                  <div className="flex items-center gap-4 text-sm text-ink-2 mt-1">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {data.currentUserRank.totalPoints.toLocaleString()} pts
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-4 h-4" />
                      {data.currentUserRank.streak} dias
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {accuracy}% acerto
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-ink-1">
                  Nível {data.currentUserRank.level}
                </p>
                <p className="text-sm text-ink-2">
                  {data.currentUserRank.correctAnswers}/{data.currentUserRank.totalQuestions} acertos
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Leaderboard Table */}
        <Card variant="glass" className="overflow-hidden">
          <div className="p-6 border-b border">
            <h2 className="text-xl font-bold text-ink-1">Top {limit} Estudantes</h2>
          </div>

          <div className="divide-y divide-navy-800">
            {data.leaderboard.map((user) => {
              const userAccuracy = user.totalQuestions > 0
                ? Math.round((user.correctAnswers / user.totalQuestions) * 100)
                : 0;

              return (
                <div
                  key={user.id}
                  className={`p-6 transition-colors ${
                    user.isCurrentUser
                      ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-l-4 border-accent'
                      : 'hover:bg-surface-2'
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    {/* Rank + Name */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br ${getRankColor(user.rank)} border-2`}>
                        {getRankIcon(user.rank)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-ink-1 font-semibold text-lg truncate">
                            {user.name}
                          </p>
                          {user.isCurrentUser && (
                            <span className="px-2 py-1 bg-accent-soft text-accent text-xs rounded-lg flex-shrink-0">
                              Você
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-ink-2 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 flex-shrink-0" />
                            {user.totalPoints.toLocaleString()} pts
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-4 h-4 flex-shrink-0" />
                            {user.streak} dias
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-4 h-4 flex-shrink-0" />
                            {userAccuracy}% acerto
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-ink-1">
                        Nível {user.level}
                      </p>
                      <p className="text-sm text-ink-2">
                        {user.correctAnswers}/{user.totalQuestions} questões
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {data.leaderboard.length < data.stats.totalUsers && limit < 100 && (
            <div className="p-6 border-t border text-center">
              <Button
                variant="ghost"
                onClick={() => setLimit(Math.min(limit + 50, 100))}
              >
                Carregar Mais
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
