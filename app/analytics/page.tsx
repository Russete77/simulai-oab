'use client';

import { useEffect, useState, useCallback } from 'react';
import nextDynamic from 'next/dynamic';

// Força renderização dinâmica para garantir que ClerkProvider esteja disponível
export const dynamic = 'force-dynamic';
import { Card, Button, StatsCard } from '@/components/ui';
import { Header } from '@/components/layout/header';
import { Target, Clock, Flame, TrendingUp } from 'lucide-react';

const PerformanceChart = nextDynamic(() => import('@/components/analytics/performance-chart').then(mod => ({ default: mod.PerformanceChart })), {
  ssr: false,
  loading: () => <div className="h-64 bg-navy-800/30 rounded-xl animate-pulse" />,
});
const SubjectChart = nextDynamic(() => import('@/components/analytics/subject-chart').then(mod => ({ default: mod.SubjectChart })), {
  ssr: false,
  loading: () => <div className="h-64 bg-navy-800/30 rounded-xl animate-pulse" />,
});
const ActivityChart = nextDynamic(() => import('@/components/analytics/activity-chart').then(mod => ({ default: mod.ActivityChart })), {
  ssr: false,
  loading: () => <div className="h-64 bg-navy-800/30 rounded-xl animate-pulse" />,
});

interface AnalyticsData {
  overview: {
    totalQuestions: number;
    correctAnswers: number;
    successRate: number;
    averageTime: number;
    streak: number;
  };
  subjectPerformance: Array<{
    subject: string;
    subjectLabel: string;
    total: number;
    correct: number;
    percentage: number;
  }>;
  performanceOverTime: Array<{
    date: string;
    correct: number;
    total: number;
    percentage: number;
  }>;
  recentActivity: Array<{
    date: string;
    questionsAnswered: number;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadAnalytics = useCallback(async (controller?: AbortController) => {
    try {
      setLoading(true);
      setError(false);
      const response = await fetch('/api/analytics', { signal: controller?.signal });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (typeof err === 'string' && err === 'component unmounted') return;
      console.error('Error loading analytics:', err);
      setError(true);
    } finally {
      // Só atualizar estado se este fetch NÃO foi abortado (React Strict Mode double-mount)
      if (!controller?.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadAnalytics(controller);
    return () => controller.abort('component unmounted');
  }, [loadAnalytics]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-navy-600">Carregando análises...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <Card variant="glass" className="text-center p-8">
          <p className="text-white mb-4">Erro ao carregar análises</p>
          <Button variant="primary" onClick={() => loadAnalytics()}>
            Tentar Novamente
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            variant="compact"
            title="Total de Questões"
            value={data.overview.totalQuestions}
            subtitle={`${data.overview.correctAnswers} corretas`}
            icon={<Target className="w-5 h-5" />}
            color="blue"
          />
          <StatsCard
            variant="compact"
            title="Taxa de Acerto"
            value={`${data.overview.successRate.toFixed(1)}%`}
            subtitle="Média geral"
            icon={<TrendingUp className="w-5 h-5" />}
            color="green"
          />
          <StatsCard
            variant="compact"
            title="Tempo Médio"
            value={formatTime(data.overview.averageTime)}
            subtitle="Por questão"
            icon={<Clock className="w-5 h-5" />}
            color="purple"
          />
          <StatsCard
            variant="compact"
            title="Sequência"
            value={data.overview.streak}
            subtitle={data.overview.streak === 1 ? "acerto seguido" : "acertos seguidos"}
            icon={<Flame className="w-5 h-5" />}
            color="cyan"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <PerformanceChart data={data.performanceOverTime} />
          <ActivityChart data={data.recentActivity} />
        </div>

        {/* Charts Row 2 */}
        <div className="mb-6">
          <SubjectChart data={data.subjectPerformance} />
        </div>

        {/* Detailed Subject Stats */}
        <Card variant="glass" className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6">
            Estatísticas Detalhadas por Matéria
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-700">
                  <th className="text-left text-navy-400 font-medium pb-3 px-4">Matéria</th>
                  <th className="text-center text-navy-400 font-medium pb-3 px-4">Total</th>
                  <th className="text-center text-navy-400 font-medium pb-3 px-4">Corretas</th>
                  <th className="text-center text-navy-400 font-medium pb-3 px-4">Taxa</th>
                </tr>
              </thead>
              <tbody>
                {data.subjectPerformance.map((subject, index) => (
                  <tr key={index} className="border-b border-navy-800/50">
                    <td className="text-white py-3 px-4">{subject.subjectLabel}</td>
                    <td className="text-center text-navy-300 py-3 px-4">{subject.total}</td>
                    <td className="text-center text-green-500 py-3 px-4">{subject.correct}</td>
                    <td className="text-center py-3 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          subject.percentage >= 70
                            ? 'bg-green-500/20 text-green-500'
                            : subject.percentage >= 50
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-500'
                        }`}
                      >
                        {subject.percentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
