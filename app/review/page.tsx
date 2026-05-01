'use client';

import { useEffect, useState, useCallback } from 'react';

// Força renderização dinâmica para garantir que ClerkProvider esteja disponível
export const dynamic = 'force-dynamic';
import { Card, Button } from '@/components/ui';
import { QuestionCard } from '@/components/question-card';
import { QuestionExplanation } from '@/components/question-explanation';
import { QuestionChat } from '@/components/question-chat';
import { ArrowLeft, Filter, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface WrongQuestion {
  id: string;
  subject: string;
  statement: string;
  alternatives: Array<{
    id: string;
    label: string;
    text: string;
    isCorrect: boolean;
  }>;
  examYear?: number;
  examPhase?: number;
  questionNumber?: number;
  userAnswer: {
    alternativeId: string;
    createdAt: string;
  };
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

export default function ReviewPage() {
  const [questions, setQuestions] = useState<WrongQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<WrongQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    const controller = new AbortController();

    const loadWrongQuestions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/review/wrong-questions', { signal: controller.signal });

        if (!response.ok) {
          throw new Error('Failed to fetch wrong questions');
        }

        const data = await response.json();
        // API retorna { questions: [...], summary: {...} }
        const questionsList = data.questions || [];
        setQuestions(questionsList);
        setFilteredQuestions(questionsList);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (typeof error === 'string' && error === 'component unmounted') return;
        console.error('Error loading wrong questions:', error);
        setQuestions([]);
        setFilteredQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    loadWrongQuestions();
    return () => controller.abort('component unmounted');
  }, []);

  useEffect(() => {
    if (selectedSubject === 'all') {
      setFilteredQuestions(questions);
    } else {
      setFilteredQuestions(questions.filter(q => q.subject === selectedSubject));
    }
    setCurrentIndex(0);
  }, [selectedSubject, questions]);

  // Resetar chat modal ao mudar de questão
  useEffect(() => {
    setShowChat(false);
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => prev < filteredQuestions.length - 1 ? prev + 1 : prev);
  }, [filteredQuestions.length]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : prev);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-ink-3">Carregando questões...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-bg">
        <div className="border-b border bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <button className="p-2 hover:bg-surface-2 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5 text-ink-2" />
                </button>
              </Link>
              <h1 className="text-2xl font-bold font-heading bg-gradient-primary bg-clip-text text-transparent">
                Revisão de Erros
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[80vh]">
          <Card variant="glass" className="text-center p-8 max-w-md">
            <BookOpen className="w-16 h-16 text-ink-3 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-ink-1 mb-2">
              Nenhuma questão errada ainda
            </h2>
            <p className="text-ink-2 mb-6">
              Continue praticando para começar a revisar seus erros!
            </p>
            <Link href="/practice">
              <Button variant="primary">Começar a Praticar</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  // Get unique subjects from wrong questions (after loading check)
  const subjects = Array.from(new Set(questions.map(q => q.subject)));

  const currentQuestion = filteredQuestions[currentIndex];

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Card variant="glass" className="text-center p-8">
          <p className="text-ink-1 mb-4">Nenhuma questão encontrada com esse filtro</p>
          <Button variant="primary" onClick={() => setSelectedSubject('all')}>
            Ver Todas
          </Button>
        </Card>
      </div>
    );
  }

  const correctAlternativeId = currentQuestion.alternatives.find(a => a.isCorrect)?.id;

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="border-b border bg-surface sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <button className="p-2 hover:bg-surface-2 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5 text-ink-2" />
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold font-heading bg-gradient-primary bg-clip-text text-transparent">
                  Revisão de Erros
                </h1>
                <p className="text-ink-2 text-sm">
                  {currentIndex + 1} de {filteredQuestions.length} questões
                </p>
              </div>
            </div>

            {/* Subject Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-ink-2" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-surface-2 border rounded-lg px-3 py-2 text-ink-1 text-sm focus:outline-none focus:border-accent"
              >
                <option value="all">Todas as Matérias</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {SUBJECT_LABELS[subject] || subject}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Question Card */}
        <QuestionCard
          question={currentQuestion}
          selectedAlternative={currentQuestion.userAnswer.alternativeId}
          showResult={true}
          correctAlternativeId={correctAlternativeId}
          onSelectAlternative={() => {}}
        />

        {/* AI Explanation */}
        <QuestionExplanation
          key={currentQuestion.id}
          questionId={currentQuestion.id}
          onOpenChat={() => setShowChat(true)}
        />

        {/* Chat Modal */}
        {showChat && (
          <QuestionChat
            key={currentQuestion.id}
            questionId={currentQuestion.id}
            onClose={() => setShowChat(false)}
          />
        )}

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            ← Anterior
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleNext}
            disabled={currentIndex === filteredQuestions.length - 1}
          >
            Próxima →
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="mt-4">
          <div className="flex gap-1">
            {filteredQuestions.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index === currentIndex
                    ? 'bg-blue-500'
                    : index < currentIndex
                    ? 'bg-green-500/30'
                    : 'bg-surface-2'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
