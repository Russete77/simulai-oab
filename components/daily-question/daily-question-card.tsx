'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui';
import { CheckCircle, XCircle, Share2, Copy } from 'lucide-react';

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
      const response = await fetch('/api/questions/daily');

      if (!response.ok) {
        throw new Error('Falha ao carregar questão do dia');
      }

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

    // Buscar a resposta correta do servidor
    try {
      const answerResponse = await fetch('/api/questions/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          alternativeId: alternativeId,
        }),
      });

      if (answerResponse.ok) {
        const result = await answerResponse.json();
        setIsCorrect(result.isCorrect);
        setCorrectAlternative(result.correctAlternativeId);
      }
    } catch (err) {
      console.error('Erro ao verificar resposta:', err);
    }

    setIsAnswered(true);
  }

  function handleShare() {
    const text = `Questão do Dia ${question?.todayDate}\n\n${
      isCorrect ? '✅ Acertei!' : '❌ Errei!'
    }\n\nMatéria: ${question?.subject}\nDificuldade: ${question?.difficulty}`;

    if (navigator.share) {
      navigator.share({
        title: 'Questão do Dia OAB',
        text: text,
      });
    } else {
      // Fallback para copiar
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <Card variant="glass" className="bg-gradient-to-br from-blue-500/10 to-purple-500/10">
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-navy-600">Carregando questão do dia...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="glass" className="bg-red-500/5">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={fetchDailyQuestion} variant="primary" size="sm">
            Tentar Novamente
          </Button>
        </div>
      </Card>
    );
  }

  if (!question) {
    return null;
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY':
        return 'text-green-400';
      case 'MEDIUM':
        return 'text-yellow-400';
      case 'HARD':
        return 'text-orange-400';
      case 'VERY_HARD':
        return 'text-red-400';
      default:
        return 'text-blue-400';
    }
  };

  const getSubjectLabel = (subject: string) => {
    const subjectMap: Record<string, string> = {
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
    return subjectMap[subject] || subject;
  };

  const getDifficultyLabel = (difficulty: string) => {
    const difficultyMap: Record<string, string> = {
      EASY: 'Fácil',
      MEDIUM: 'Médio',
      HARD: 'Difícil',
      VERY_HARD: 'Muito Difícil',
    };
    return difficultyMap[difficulty?.toUpperCase()] || difficulty;
  };

  return (
    <Card variant="glass" className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Questão do Dia</h2>
          <p className="text-sm text-navy-600">{question.todayDate}</p>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(question.difficulty)} bg-white/5`}>
            {getDifficultyLabel(question.difficulty)}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold text-blue-400 bg-white/5">
            {getSubjectLabel(question.subject)}
          </span>
        </div>
      </div>

      {/* Statement */}
      <div className="mb-8">
        <p className="text-white leading-relaxed whitespace-pre-wrap">{question.statement}</p>
      </div>

      {/* Alternatives */}
      <div className="space-y-3 mb-8">
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
              className={`w-full p-4 rounded-xl text-left transition-all duration-300 ${
                isAnswered ? 'cursor-default' : 'cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5'
              } ${
                showCorrect
                  ? 'border-green-500/50 bg-green-500/10'
                  : showIncorrect
                  ? 'border-red-500/50 bg-red-500/10'
                  : isSelected
                  ? 'border-blue-500/50 bg-blue-500/10'
                  : 'border-white/10 hover:bg-white/5'
              } border-2`}
            >
              <div className="flex items-start gap-3">
                <div className={`font-bold min-w-8 text-lg ${
                  showCorrect ? 'text-green-400' : showIncorrect ? 'text-red-400' : 'text-blue-400'
                }`}>
                  {alt.label}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{alt.text}</p>
                </div>
                {isAnswered && (
                  <div className="ml-2">
                    {showCorrect && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />}
                    {showIncorrect && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Result and Explanation */}
      {isAnswered && (
        <div className={`p-4 rounded-xl mb-6 ${
          isCorrect
            ? 'bg-green-500/10 border border-green-500/30'
            : 'bg-red-500/10 border border-red-500/30'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            {isCorrect ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-semibold text-green-400">Resposta Correta!</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="font-semibold text-red-400">Resposta Incorreta</span>
              </>
            )}
          </div>

          {question.explanation && (
            <div className="text-sm text-navy-300 leading-relaxed whitespace-pre-wrap">
              <p className="font-semibold text-white mb-2">Explicação:</p>
              {question.explanation}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {isAnswered && (
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex-1 flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Copy className="w-4 h-4" />
                Copiado!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Compartilhar
              </>
            )}
          </Button>
        )}
        {!isAnswered && (
          <p className="flex-1 text-center text-sm text-navy-600">Selecione uma alternativa para responder</p>
        )}
      </div>
    </Card>
  );
}
