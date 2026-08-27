'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card, Button } from '@/components/ui';
import { BookOpen, Target, Calendar, TrendingUp, RefreshCw, Loader2, Brain, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const SUBJECT_LABELS: Record<string, string> = {
  ETHICS: 'Ética Profissional',
  CONSTITUTIONAL: 'Direito Constitucional',
  CIVIL: 'Direito Civil',
  CIVIL_PROCEDURE: 'Processo Civil',
  CRIMINAL: 'Direito Penal',
  CRIMINAL_PROCEDURE: 'Processo Penal',
  LABOUR: 'Direito do Trabalho',
  LABOUR_PROCEDURE: 'Processo do Trabalho',
  ADMINISTRATIVE: 'Direito Administrativo',
  TAXES: 'Direito Tributário',
  BUSINESS: 'Direito Empresarial',
  CONSUMER: 'Direito do Consumidor',
  ENVIRONMENTAL: 'Direito Ambiental',
  CHILDREN: 'ECA',
  INTERNATIONAL: 'Direito Internacional',
  HUMAN_RIGHTS: 'Direitos Humanos',
  GENERAL: 'Conhecimentos Gerais',
};

interface StudyPlanData {
  id: string;
  name: string;
  description: string | null;
  targetExamDate: string | null;
  weeklyGoal: number;
  focusSubjects: string[];
  weeklyProgress: number;
  weeklyPercentage: number;
  createdAt: string;
}

interface SubjectAnalysis {
  subject: string;
  label: string;
  accuracy: number;
  total: number;
}

export default function PlanoEstudosClient() {
  const [plan, setPlan] = useState<StudyPlanData | null>(null);
  const [analysis, setAnalysis] = useState<SubjectAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [examDate, setExamDate] = useState('');

  useEffect(() => {
    fetchPlan();
  }, []);

  async function fetchPlan() {
    try {
      setLoading(true);
      const res = await fetch('/api/study-plan');
      const data = await res.json();
      setPlan(data.plan);
    } catch (error) {
      console.error('Erro ao buscar plano:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generatePlan() {
    try {
      setGenerating(true);
      const res = await fetch('/api/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetExamDate: examDate || null }),
      });
      const data = await res.json();
      setPlan(data.plan);
      if (data.analysis) setAnalysis(data.analysis);
    } catch (error) {
      console.error('Erro ao gerar plano:', error);
    } finally {
      setGenerating(false);
    }
  }

  function getDaysUntilExam(): number | null {
    if (!plan?.targetExamDate) return null;
    const exam = new Date(plan.targetExamDate);
    const now = new Date();
    return Math.max(0, Math.ceil((exam.getTime() - now.getTime()) / (86400000)));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <Header />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-12 h-12 text-accent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-purple-500/10 rounded-xl">
            <Brain className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-ink-1">Plano de Estudos</h1>
            <p className="text-ink-2">Personalizado com base no seu desempenho</p>
          </div>
        </div>

        {!plan ? (
          /* No plan - Create one */
          <Card variant="glass" className="p-8">
            <div className="text-center max-w-md mx-auto">
              <div className="p-4 bg-purple-500/10 rounded-2xl w-fit mx-auto mb-6">
                <BookOpen className="w-12 h-12 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-ink-1 mb-3">
                Crie seu Plano Personalizado
              </h2>
              <p className="text-ink-2 mb-8">
                Vamos analisar seu desempenho e criar um plano focado nas suas matérias mais fracas.
              </p>

              <div className="mb-6">
                <label className="block text-sm text-ink-2 mb-2 text-left">
                  Data da prova (opcional)
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full bg-surface-2 border rounded-xl px-4 py-3 text-ink-1 placeholder-navy-500 focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>

              <Button
                variant="primary"
                onClick={generatePlan}
                disabled={generating}
                className="w-full py-4 text-lg"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analisando desempenho...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Brain className="w-5 h-5" />
                    Gerar Plano com IA
                  </span>
                )}
              </Button>
            </div>
          </Card>
        ) : (
          /* Has plan - Show it */
          <div className="space-y-6">
            {/* Plan Header */}
            <Card variant="glass" className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-ink-1">{plan.name}</h2>
                  <p className="text-ink-2 text-sm mt-1">{plan.description}</p>
                </div>
                <button
                  onClick={generatePlan}
                  disabled={generating}
                  className="text-ink-2 hover:text-ink-1 transition-colors p-2"
                  title="Regenerar plano"
                >
                  <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Exam countdown */}
              {getDaysUntilExam() !== null && (
                <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-400 font-semibold">
                    {getDaysUntilExam()} dias para a prova
                  </span>
                </div>
              )}

              {/* Weekly Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-ink-2">Progresso semanal</span>
                  <span className="text-ink-1 font-semibold">
                    {plan.weeklyProgress}/{plan.weeklyGoal} questões
                  </span>
                </div>
                <div className="w-full bg-surface-2 rounded-full h-3">
                  <div
                    className="bg-accent h-3 rounded-full transition-all duration-500"
                    style={{ width: `${plan.weeklyPercentage}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* Focus Subjects */}
            <Card variant="glass" className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-bold text-ink-1">Matérias para Focar</h3>
              </div>

              <div className="space-y-3">
                {plan.focusSubjects.map((subject) => {
                  const subjectData = analysis.find(a => a.subject === subject);
                  return (
                    <Link
                      key={subject}
                      href={`/practice?subject=${subject}`}
                      className="flex items-center justify-between p-4 bg-surface-2 hover:bg-surface-2 border-divider rounded-xl transition-colors group"
                    >
                      <div>
                        <p className="text-ink-1 font-medium">{SUBJECT_LABELS[subject] || subject}</p>
                        {subjectData && (
                          <p className="text-sm text-ink-2">
                            {subjectData.accuracy}% de acerto em {subjectData.total} questões
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-accent group-hover:text-accent">Praticar</span>
                        <ChevronRight className="w-4 h-4 text-accent group-hover:text-accent" />
                      </div>
                    </Link>
                  );
                })}

                {plan.focusSubjects.length === 0 && (
                  <p className="text-ink-2 text-center py-4">
                    Parabéns! Todas as matérias acima de 60%. Continue praticando!
                  </p>
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/practice">
                <Card variant="glass" className="p-6 hover:border-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent-soft rounded-lg">
                      <BookOpen className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-ink-1 font-semibold">Praticar Agora</p>
                      <p className="text-sm text-ink-2">Questões aleatórias</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link href="/simulations">
                <Card variant="glass" className="p-6 hover:border-purple-500/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-ink-1 font-semibold">Fazer Simulado</p>
                      <p className="text-sm text-ink-2">Prova completa</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
