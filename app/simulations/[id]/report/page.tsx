'use client';

import { use, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, Button } from '@/components/ui';
import { ArrowLeft, Download, RefreshCw, BookOpen, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SimulationSubjectChart = dynamic(() => import('@/components/simulation/simulation-subject-chart').then(mod => ({ default: mod.SimulationSubjectChart })), {
  ssr: false,
  loading: () => <div className="h-64 bg-surface-2 rounded-xl animate-pulse" />,
});

interface SimulationAnalytics {
  simulation: {
    id: string;
    type: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    successRate: number;
    startedAt: string;
    completedAt: string;
    duration: number;
  };
  subjectPerformance: Array<{
    subject: string;
    subjectLabel: string;
    total: number;
    correct: number;
    percentage: number;
  }>;
  wrongAnswers: Array<{
    questionId: string;
    subject: string;
    subjectLabel: string;
    statement: string;
    userAnswer?: string;
    correctAnswer?: string;
  }>;
}

export default function SimulationReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<SimulationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        const response = await fetch(`/api/simulations/${id}/analytics`);

        if (!response.ok) {
          throw new Error('Failed to fetch report');
        }

        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error loading report:', error);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [id]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min ${secs}s`;
  };

  const getPerformanceMessage = (rate: number) => {
    if (rate >= 75) return { text: 'Excelente! Você está pronto!', color: 'text-green-500' };
    if (rate >= 60) return { text: 'Bom desempenho! Continue praticando.', color: 'text-accent' };
    if (rate >= 50) return { text: 'Precisa melhorar. Foque nos erros.', color: 'text-yellow-400' };
    return { text: 'Continue estudando. Você consegue!', color: 'text-red-500' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-ink-3">Gerando relatório...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Card variant="glass" className="text-center p-8">
          <p className="text-ink-1 mb-4">Erro ao carregar relatório</p>
          <Button variant="primary" onClick={() => router.refresh()}>
            Tentar Novamente
          </Button>
        </Card>
      </div>
    );
  }

  const performanceMsg = getPerformanceMessage(data.simulation.successRate);

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="border-b border bg-surface sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/simulations">
                <button className="p-2 hover:bg-surface-2 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5 text-ink-2" />
                </button>
              </Link>
              <h1 className="text-2xl font-bold font-heading bg-gradient-primary bg-clip-text text-transparent">
                Relatório do Simulado
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Score Card */}
        <Card variant="glass" className="p-8 mb-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
              <div className="text-center">
                <p className="text-5xl font-bold text-ink-1">{data.simulation.score}</p>
                <p className="text-sm text-ink-1/80">pontos</p>
              </div>
            </div>

            <h2 className={`text-3xl font-bold mb-2 ${performanceMsg.color}`}>
              {performanceMsg.text}
            </h2>

            <div className="flex items-center justify-center gap-8 mt-6 text-ink-1/80">
              <div>
                <p className="text-ink-2 text-sm">Acertos</p>
                <p className="text-2xl font-bold text-green-500">
                  {data.simulation.correctAnswers}/{data.simulation.totalQuestions}
                </p>
              </div>
              <div>
                <p className="text-ink-2 text-sm">Taxa de Acerto</p>
                <p className="text-2xl font-bold text-accent">
                  {data.simulation.successRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-ink-2 text-sm">Duração</p>
                <p className="text-2xl font-bold text-purple-400">
                  {formatDuration(data.simulation.duration)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Subject Performance Chart */}
        <div className="mb-6">
          <SimulationSubjectChart data={data.subjectPerformance} />
        </div>

        {/* Wrong Answers Section */}
        {data.wrongAnswers.length > 0 && (
          <Card variant="glass" className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h3 className="text-xl font-semibold text-ink-1">
                Questões Erradas ({data.wrongAnswers.length})
              </h3>
            </div>

            <div className="space-y-4">
              {data.wrongAnswers.map((wrong, index) => (
                <div
                  key={index}
                  className="bg-surface-2 border border-red-500/20 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <span className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-xs font-medium">
                      {wrong.subjectLabel}
                    </span>
                  </div>
                  <p className="text-ink-1/90 mb-3 leading-relaxed">
                    {wrong.statement}
                  </p>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-ink-2">Sua resposta: </span>
                      <span className="text-red-500 font-medium">
                        {wrong.userAnswer || 'Não respondida'}
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-2">Correta: </span>
                      <span className="text-green-500 font-medium">
                        {wrong.correctAnswer}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2"
            onClick={() => router.push('/simulations')}
          >
            <RefreshCw className="w-4 h-4" />
            Novo Simulado
          </Button>

          <Button
            variant="outline"
            className="flex items-center justify-center gap-2"
            onClick={() => router.push(`/simulations/${id}/result`)}
          >
            <BookOpen className="w-4 h-4" />
            Revisar Erros
          </Button>

          <Button
            variant="primary"
            className="flex items-center justify-center gap-2"
            onClick={() => router.push('/dashboard')}
          >
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
