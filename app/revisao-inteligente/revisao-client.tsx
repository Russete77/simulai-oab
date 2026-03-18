'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card, Button } from '@/components/ui';
import {
  Brain,
  Loader2,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface Alternative {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

interface ReviewQuestion {
  id: string;
  statement: string;
  subject: string;
  difficulty: string;
  examYear: number;
  alternatives: Alternative[];
  reviewSource: 'srs' | 'wrong_answer';
  reviewCardId: string | null;
  interval?: number;
  repetitions?: number;
}

interface ReviewStats {
  srsCards: number;
  wrongAnswers: number;
  totalReview: number;
}

export default function RevisaoClientPage() {
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ srsCards: 0, wrongAnswers: 0, totalReview: 0 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedAlternative, setSelectedAlternative] = useState<string | undefined>();
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timer, setTimer] = useState(0);
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    fetchReview();
  }, []);

  useEffect(() => {
    if (!showResult && questions.length > 0) {
      const interval = setInterval(() => setTimer(t => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [showResult, questions]);

  async function fetchReview() {
    try {
      setLoading(true);
      const res = await fetch('/api/review/smart');
      const data = await res.json();
      setQuestions(data.questions || []);
      setStats(data.stats || { srsCards: 0, wrongAnswers: 0, totalReview: 0 });
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectAlternative(altId: string) {
    if (showResult) return;
    setSelectedAlternative(altId);
  }

  function handleSubmit() {
    if (!selectedAlternative || !questions[currentIndex]) return;
    const question = questions[currentIndex];
    const correct = question.alternatives.find(a => a.id === selectedAlternative)?.isCorrect || false;
    setIsCorrect(correct);
    setShowResult(true);
    setCompleted(c => c + 1);

    // Record SRS review if applicable
    if (question.reviewCardId) {
      fetch('/api/review/srs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          isCorrect: correct,
          timeSpent: timer,
        }),
      }).catch(() => {});
    }
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedAlternative(undefined);
      setShowResult(false);
      setIsCorrect(false);
      setTimer(0);
    }
  }

  const question = questions[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950">
        <Header />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-navy-950">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card variant="glass" className="p-8 text-center">
            <div className="p-4 bg-green-500/10 rounded-2xl w-fit mx-auto mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Nenhuma revisão pendente!</h2>
            <p className="text-navy-400 mb-6">
              Todas as questões estão em dia. Continue praticando para adicionar novas ao sistema de revisão.
            </p>
            <Link href="/practice">
              <Button variant="primary">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Praticar Questões
                </span>
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link href="/dashboard">
            <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <span className="text-white font-bold text-lg">Revisão Inteligente</span>
          </div>
          <div className="flex gap-3 text-sm flex-wrap">
            <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400">
              {stats.srsCards} SRS pendentes
            </span>
            <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400">
              {stats.wrongAnswers} erros para revisar
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-navy-400 text-sm">
            Questão {currentIndex + 1} de {questions.length}
          </span>
          <span className="text-navy-400 text-sm">
            {completed} revisadas nesta sessão
          </span>
        </div>
        <div className="w-full bg-navy-800 rounded-full h-2 mb-6">
          <div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Source badge */}
        <div className="mb-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              question.reviewSource === 'srs'
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {question.reviewSource === 'srs' ? 'Revisão Espaçada' : 'Questão Errada'}
          </span>
        </div>

        {/* Question */}
        <Card variant="glass" className="p-6 mb-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 bg-navy-800/50 rounded text-navy-300">
                {question.subject}
              </span>
              <span className="text-xs px-2 py-1 bg-navy-800/50 rounded text-navy-300">
                {question.examYear}
              </span>
            </div>
            <span className="text-xs px-2 py-1 bg-blue-500/10 rounded text-blue-400">
              Tempo: {timer}s
            </span>
          </div>

          <p className="text-white text-lg leading-relaxed mb-6">{question.statement}</p>
          <div className="space-y-3">
            {question.alternatives.map(alt => (
              <button
                key={alt.id}
                onClick={() => handleSelectAlternative(alt.id)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all disabled:cursor-not-allowed ${
                  showResult
                    ? alt.isCorrect
                      ? 'bg-green-500/10 border-green-500/50 text-green-400'
                      : alt.id === selectedAlternative
                      ? 'bg-red-500/10 border-red-500/50 text-red-400'
                      : 'bg-navy-800/50 border-white/5 text-navy-400'
                    : alt.id === selectedAlternative
                    ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                    : 'bg-navy-800/50 border-white/10 text-white hover:border-white/20 hover:bg-navy-800/70'
                }`}
              >
                <span className="font-bold mr-2">{alt.label})</span>
                {alt.text}
              </button>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {!showResult ? (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!selectedAlternative}
            >
              Confirmar Resposta
            </Button>
          ) : currentIndex < questions.length - 1 ? (
            <Button variant="primary" onClick={handleNext}>
              <span className="flex items-center gap-2">
                Próxima
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button variant="ghost" onClick={fetchReview}>
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Carregar mais
                </span>
              </Button>
              <Link href="/dashboard">
                <Button variant="primary">Voltar ao Dashboard</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
