'use client';

import { Timer, CheckCircle2, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { Card, Badge } from '@/components/ui';

interface Alternative {
  id: string;
  label: string;
  text: string;
}

interface Question {
  id: string;
  subject: string;
  statement: string;
  alternatives: Alternative[];
  examYear?: number;
  examPhase?: number;
  questionNumber?: number;
}

interface QuestionCardProps {
  question: Question;
  selectedAlternative?: string;
  showResult?: boolean;
  correctAlternativeId?: string;
  onSelectAlternative: (alternativeId: string) => void;
  timer?: number;
}

const SUBJECT_LABELS: Record<string, string> = {
  ETHICS: 'Ética',
  CONSTITUTIONAL: 'Constitucional',
  CIVIL: 'Civil',
  CIVIL_PROCEDURE: 'Processo Civil',
  CRIMINAL: 'Penal',
  CRIMINAL_PROCEDURE: 'Processo Penal',
  LABOUR: 'Trabalho',
  LABOUR_PROCEDURE: 'Processo do Trabalho',
  ADMINISTRATIVE: 'Administrativo',
  TAXES: 'Tributário',
  BUSINESS: 'Empresarial',
  CONSUMER: 'Consumidor',
  ENVIRONMENTAL: 'Ambiental',
  CHILDREN: 'ECA',
  INTERNATIONAL: 'Internacional',
  HUMAN_RIGHTS: 'Direitos Humanos',
  GENERAL: 'Geral',
};

export function QuestionCard({
  question,
  selectedAlternative,
  showResult,
  correctAlternativeId,
  onSelectAlternative,
  timer,
}: QuestionCardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <Card padding="none">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-6 py-4 border-b">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="accent">
            {SUBJECT_LABELS[question.subject] || question.subject}
          </Badge>
          {question.examYear && question.examPhase && (
            <Badge variant="default">
              OAB {question.examYear}/{question.examPhase}
            </Badge>
          )}
          {question.questionNumber && (
            <Badge variant="default">Q{question.questionNumber}</Badge>
          )}
        </div>
        {timer !== undefined && (
          <div className="flex items-center gap-1.5 text-xs text-ink-3 text-mono-tabular shrink-0">
            <Timer className="w-3.5 h-3.5" />
            <span>{formatTime(timer)}</span>
          </div>
        )}
      </div>

      {/* Statement */}
      <div className="px-6 py-6">
        <p className="text-ink-1 leading-relaxed whitespace-pre-wrap mb-6 text-[15px]">
          {question.statement}
        </p>

        {/* Alternatives */}
        <div className="space-y-2">
          {question.alternatives.map((alt) => {
            const isSelected = selectedAlternative === alt.id;
            const isCorrect = showResult && correctAlternativeId === alt.id;
            const isWrong = showResult && isSelected && !isCorrect;

            return (
              <button
                key={alt.id}
                onClick={() => !showResult && onSelectAlternative(alt.id)}
                disabled={showResult}
                className={clsx(
                  'w-full p-4 rounded-md text-left transition-all duration-150 border',
                  !showResult && 'cursor-pointer hover:bg-surface-2 hover:border-strong',
                  showResult && 'cursor-default',
                  isCorrect && 'border-success bg-success-soft',
                  isWrong && 'border-danger bg-danger-soft',
                  !isCorrect && !isWrong && isSelected && 'border-accent bg-accent-soft',
                  !isSelected && !isCorrect && !isWrong && 'bg-surface'
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={clsx(
                      'w-7 h-7 rounded-md font-semibold text-sm flex items-center justify-center shrink-0',
                      isCorrect && 'bg-success text-white',
                      isWrong && 'bg-danger text-white',
                      !isCorrect && !isWrong && isSelected && 'bg-accent text-accent-fg',
                      !isSelected && !isCorrect && !isWrong && 'bg-surface-2 text-ink-2'
                    )}
                  >
                    {alt.label}
                  </div>
                  <span className="flex-1 text-ink-1 leading-relaxed text-sm">
                    {alt.text}
                  </span>
                  {isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  )}
                  {isWrong && (
                    <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
