'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { Timer, CheckCircle, XCircle } from 'lucide-react';
import { clsx } from 'clsx';

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
    <div className="bg-navy-900/70 backdrop-blur-2xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 p-5 border-b border-white/5">
        <div className="flex justify-between items-center gap-4">
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-lg text-xs font-medium tracking-wide">
              {SUBJECT_LABELS[question.subject] || question.subject}
            </span>
            {question.examYear && question.examPhase && (
              <span className="px-3 py-1.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-lg text-xs font-medium">
                OAB {question.examYear}/{question.examPhase}
              </span>
            )}
            {question.questionNumber && (
              <span className="px-3 py-1.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-lg text-xs font-medium">
                Questão {question.questionNumber}
              </span>
            )}
          </div>
          {timer !== undefined && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-navy-800/50 rounded-lg">
              <Timer className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-sm text-cyan-400">{formatTime(timer)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Question */}
      <div className="p-8">
        <p className="text-white/95 leading-[1.8] mb-8 text-[15px] font-['Plus_Jakarta_Sans']">
          {question.statement}
        </p>

        {/* Alternatives */}
        <div className="space-y-2.5">
          {question.alternatives.map((alternative) => {
            const isSelected = selectedAlternative === alternative.id;
            const isCorrect = showResult && correctAlternativeId === alternative.id;
            const isWrong = showResult && isSelected && !isCorrect;

            return (
              <button
                key={alternative.id}
                onClick={() => !showResult && onSelectAlternative(alternative.id)}
                disabled={showResult}
                className={clsx(
                  'w-full group relative rounded-2xl p-4 text-left transition-all duration-200',
                  !showResult && [
                    'bg-navy-800/30 border-2 border-navy-700/50',
                    'hover:border-blue-500/50 hover:bg-blue-500/10',
                    isSelected && '!border-blue-500 !bg-blue-600/50 shadow-lg shadow-blue-500/20',
                  ],
                  showResult && [
                    isCorrect && 'bg-green-500/20 border-2 border-green-500',
                    isWrong && 'bg-red-500/20 border-2 border-red-500',
                    !isCorrect && !isWrong && 'bg-navy-800/20 border-2 border-navy-700/30',
                  ]
                )}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={clsx(
                      'flex items-center justify-center w-9 h-9 rounded-xl font-semibold text-sm transition-all',
                      !showResult && [
                        'bg-navy-700/50 text-white/60',
                        'group-hover:bg-blue-500/30 group-hover:text-blue-200',
                        isSelected && '!bg-blue-500 !text-white shadow-md shadow-blue-500/30',
                      ],
                      showResult && [
                        isCorrect && 'bg-green-500 text-white',
                        isWrong && 'bg-red-500 text-white',
                        !isCorrect && !isWrong && 'bg-navy-700/30 text-white/40',
                      ]
                    )}
                  >
                    {alternative.label}
                  </span>
                  <span className={clsx(
                    'flex-1 transition-colors leading-[1.7] text-[14.5px] font-["Plus_Jakarta_Sans"]',
                    !showResult && [
                      'text-white/85 group-hover:text-white/95',
                      isSelected && '!text-white font-medium'
                    ],
                    showResult && [
                      isCorrect && 'text-green-50',
                      isWrong && 'text-red-50',
                      !isCorrect && !isWrong && 'text-white/40',
                    ]
                  )}>
                    {alternative.text}
                  </span>
                  {showResult && isCorrect && (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  )}
                  {showResult && isWrong && (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
