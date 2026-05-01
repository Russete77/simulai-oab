'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge, Skeleton } from '@/components/ui';
import { CheckCircle2, XCircle, Share2, Copy, Calendar } from 'lucide-react';
import { clsx } from 'clsx';

interface Alternative {
  id: string;
  label: string;
  text: string;
}

interface DailyQuestion {
  id: string;
  statement: string;
  subject: string;
  difficulty: string;
  alternatives: Alternative[];
  explanation?: string;
  todayDate: string;
}

const SUBJECT_LABEL: Record<string, string> = {
  ETHICS: 'Ética',
  CONSTITUTIONAL: 'Direito Constitucional',
  CIVIL: 'Direito Civil',
  CIVIL_PROCEDURE: 'Direito Processual Civil',
  CRIMINAL: 'Direito Penal',
  CRIMINAL_PROCEDURE: 'Direito Processual Penal',
  LABOUR: 'Direito do Trabalho',
  LABOUR_PROCEDURE: 'Direito Processual do Trabalho',
  ADMINISTRATIVE: 'Direito Administrativo',
  TAXES: 'Direito Tributário',
  BUSINESS: 'Direito Empresarial',
  CONSUMER: 'Direito do Consumidor',
  ENVIRONMENTAL: 'Direito Ambiental',
  CHILDREN: 'Direito da Criança e Adolescente',
  INTERNATIONAL: 'Direito Internacional',
  HUMAN_RIGHTS: 'Direitos Humanos',
  GENERAL: 'Geral',
};

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: 'Fácil',
  MEDIUM: 'Médio',
  HARD: 'Difícil',
  VERY_HARD: 'Muito Difícil',
};

function difficultyVariant(d: string): 'success' | 'warning' | 'danger' | 'default' {
  const k = (d || '').toUpperCase();
  if (k === 'EASY') return 'success';
  if (k === 'MEDIUM') return 'warning';
  if (k === 'HARD' || k === 'VERY_HARD') return 'danger';
  return 'default';
}

export function DailyQuestionCard() {
  const [question, setQuestion] = useState<DailyQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAlternative, setCorrectAlternative] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchDailyQuestion();
  }, []);

  async function fetchDailyQuestion() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/questions/daily');
      if (!response.ok) throw new Error('Falha ao carregar questão do dia');
      const data = await response.json();
      setQuestion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar questão');
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswer(alternativeId: string) {
    if (isAnswered || !question) return;
    setSelectedAnswer(alternativeId);

    try {
      const res = await fetch('/api/questions/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, alternativeId }),
      });
      if (res.ok) {
        const result = await res.json();
        setIsCorrect(result.isCorrect);
        setCorrectAlternative(result.correctAlternativeId);
      }
    } catch {
      // ignore
    }
    setIsAnswered(true);
  }

  async function handleShare() {
    if (!question) return;
    const text = `Acabei de responder a Questão do Dia no Simulai OAB! ${isCorrect ? '✓ Acertei' : '× Errei'} - ${SUBJECT_LABEL[question.subject] || question.subject}`;
    try {
      if (navigator.share) {
        await navigator.share({ text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(text + ' ' + window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
          <div className="space-y-2 pt-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-8">
        <p className="text-danger mb-4">{error}</p>
        <Button onClick={fetchDailyQuestion} size="sm">Tentar novamente</Button>
      </Card>
    );
  }

  if (!question) return null;

  return (
    <Card>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-5 mb-5 border-b">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink-1">Questão do dia</h2>
          <p className="text-xs text-ink-3 mt-0.5 inline-flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            {question.todayDate}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-end">
          {question.difficulty && (
            <Badge variant={difficultyVariant(question.difficulty)} size="sm">
              {DIFFICULTY_LABEL[question.difficulty.toUpperCase()] || question.difficulty}
            </Badge>
          )}
          <Badge variant="accent" size="sm">
            {SUBJECT_LABEL[question.subject] || question.subject}
          </Badge>
        </div>
      </div>

      {/* Statement */}
      <p className="text-ink-1 leading-relaxed whitespace-pre-wrap mb-6">
        {question.statement}
      </p>

      {/* Alternatives */}
      <div className="space-y-2 mb-6">
        {question.alternatives.map((alt) => {
          const isSelected = selectedAnswer === alt.id;
          const isCorrectOption = correctAlternative === alt.id;
          const showCorrect = isAnswered && isCorrectOption;
          const showIncorrect = isAnswered && isSelected && !isCorrect;

          return (
            <button
              key={alt.id}
              onClick={() => handleAnswer(alt.id)}
              disabled={isAnswered}
              className={clsx(
                'w-full p-4 rounded-md text-left transition-all duration-150 border',
                isAnswered ? 'cursor-default' : 'cursor-pointer hover:bg-surface-2 hover:border-strong',
                showCorrect && 'border-success bg-success-soft',
                showIncorrect && 'border-danger bg-danger-soft',
                !showCorrect && !showIncorrect && isSelected && 'border-accent bg-accent-soft',
                !isSelected && !showCorrect && !showIncorrect && 'bg-surface'
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={clsx(
                    'w-7 h-7 rounded-md font-semibold text-sm flex items-center justify-center shrink-0',
                    showCorrect && 'bg-success text-white',
                    showIncorrect && 'bg-danger text-white',
                    !showCorrect && !showIncorrect && isSelected && 'bg-accent text-accent-fg',
                    !isSelected && !showCorrect && !showIncorrect && 'bg-surface-2 text-ink-2'
                  )}
                >
                  {alt.label}
                </div>
                <span className="flex-1 text-ink-1 leading-relaxed text-sm">
                  {alt.text}
                </span>
                {isAnswered && showCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                )}
                {isAnswered && showIncorrect && (
                  <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Result + Explanation */}
      {isAnswered && (
        <div
          className={clsx(
            'p-4 rounded-md mb-5 border',
            isCorrect ? 'bg-success-soft border-success' : 'bg-danger-soft border-danger'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-sm font-semibold text-success">Resposta correta</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-danger" />
                <span className="text-sm font-semibold text-danger">Resposta incorreta</span>
              </>
            )}
          </div>
          {question.explanation && (
            <div className="text-sm text-ink-2 leading-relaxed whitespace-pre-wrap mt-3 pt-3 border-t border">
              <p className="font-medium text-ink-1 mb-1.5">Explicação</p>
              {question.explanation}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        {isAnswered ? (
          <Button onClick={handleShare} variant="secondary" size="sm">
            {copied ? <><Copy className="w-3.5 h-3.5" />Copiado</> : <><Share2 className="w-3.5 h-3.5" />Compartilhar</>}
          </Button>
        ) : (
          <p className="text-sm text-ink-3">Selecione uma alternativa para responder</p>
        )}
      </div>
    </Card>
  );
}
