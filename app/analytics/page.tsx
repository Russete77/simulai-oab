'use client';

import { useEffect, useState } from 'react';
import { Card, Button } from '@/components/ui';
import { Header } from '@/components/layout/header';
import { PerformanceChart } from '@/components/analytics/performance-chart';
import { SubjectChart } from '@/components/analytics/subject-chart';
import { ActivityChart } from '@/components/analytics/activity-chart';
import { StatsCard } from '@/components/analytics/stats-card';
import { ArrowLeft, Target, Clock, Flame, TrendingUp } from 'lucide-react';
import Link from 'next/link';

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

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics');

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

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

  if (!data) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <Card variant="glass" className="text-center p-8">
          <p className="text-white mb-4">Erro ao carregar análises</p>
          <Button variant="primary" onClick={loadAnalytics}>
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
            title="Total de Questões"
            value={data.overview.totalQuestions}
            subtitle={`${data.overview.correctAnswers} corretas`}
            icon={Target}
            color="blue"
          />
          <StatsCard
            title="Taxa de Acerto"
            value={`${data.overview.successRate.toFixed(1)}%`}
            subtitle="Média geral"
            icon={TrendingUp}
            color="green"
          />
          <StatsCard
            title="Tempo Médio"
            value={formatTime(data.overview.averageTime)}
            subtitle="Por questão"
            icon={Clock}
            color="purple"
          />
          <StatsCard
            title="Sequência"
            value={data.overview.streak}
            subtitle={data.overview.streak === 1 ? "acerto seguido" : "acertos seguidos"}
            icon={Flame}
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
                    <td className="text-center text-green-400 py-3 px-4">{subject.correct}</td>
                    <td className="text-center py-3 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          subject.percentage >= 70
                            ? 'bg-green-500/20 text-green-400'
                            : subject.percentage >= 50
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
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
