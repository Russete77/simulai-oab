'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card, Button } from '@/components/ui';
import { ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';
import { Subject } from '@prisma/client';
import { GetNextQuestionRequest } from '@/types/api';

const SUBJECT_LABELS: Record<Subject, string> = {
  ETHICS: 'Ética',
  CONSTITUTIONAL: 'Constitucional',
  CIVIL: 'Civil',
  CIVIL_PROCEDURE: 'Proc. Civil',
  CRIMINAL: 'Penal',
  CRIMINAL_PROCEDURE: 'Proc. Penal',
  LABOUR: 'Trabalhista',
  LABOUR_PROCEDURE: 'Proc. Trabalhista',
  ADMINISTRATIVE: 'Administrativo',
  TAXES: 'Tributário',
  BUSINESS: 'Empresarial',
  CONSUMER: 'Consumidor',
  ENVIRONMENTAL: 'Ambiental',
  CHILDREN: 'Criança e Adolescente',
  INTERNATIONAL: 'Internacional',
  HUMAN_RIGHTS: 'Direitos Humanos',
  GENERAL: 'Geral',
};

const SUBJECT_VALUES = Object.keys(SUBJECT_LABELS) as Subject[];

interface Flashcard {
  id: string;
  statement: string;
  correctAnswerText: string;
  explanation?: string;
  subject: Subject;
}

export function FlashcardsClient() {
  const [subject, setSubject] = useState<Subject | 'ALL'>('ALL');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch flashcards when subject changes
  useEffect(() => {
    const fetchFlashcards = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (subject !== 'ALL') {
          params.append('subject', subject);
        }

        const response = await fetch(`/api/questions/next?${params.toString()}`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Falha ao carregar questões');
        }

        // Fetch 20 questions for flashcards
        const cards: Flashcard[] = [];
        for (let i = 0; i < 20; i++) {
          const data = await response.json();

          if (data.question) {
            const correctAlternative = data.question.alternatives?.find(
              (alt: any) => alt.isCorrect
            );

            cards.push({
              id: data.question.id,
              statement: data.question.statement,
              correctAnswerText: correctAlternative?.text || 'Resposta não disponível',
              explanation: data.question.explanation,
              subject: data.question.subject,
            });
          }
        }

        setFlashcards(cards);
        setCurrentIndex(0);
        setIsFlipped(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar flashcards');
        setFlashcards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashcards();
  }, [subject]);

  const handleNextCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePreviousCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const currentCard = flashcards[currentIndex];
  const progress = flashcards.length > 0 ? currentIndex + 1 : 0;

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-ink-1 mb-2">Flashcards</h1>
          <p className="text-ink-3">
            Estude com flashcards gerados de questões reais da OAB
          </p>
        </div>

        {/* Subject Selector */}
        <Card variant="glass" className="mb-8">
          <h3 className="text-lg font-semibold text-ink-1 mb-4">Selecionar Matéria</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSubject('ALL')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                subject === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-surface-2 text-ink-2 hover:bg-surface-2'
              }`}
            >
              Todas
            </button>
            {SUBJECT_VALUES.map((subj) => (
              <button
                key={subj}
                onClick={() => setSubject(subj)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  subject === subj
                    ? 'bg-blue-600 text-white'
                    : 'bg-surface-2 text-ink-2 hover:bg-surface-2'
                }`}
              >
                {SUBJECT_LABELS[subj]}
              </button>
            ))}
          </div>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card variant="glass" className="text-center py-12">
            <div className="inline-block animate-spin">
              <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
            <p className="text-ink-3 mt-4">Carregando flashcards...</p>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card variant="glass" className="border-red-500/20 bg-red-500/5">
            <p className="text-red-400">{error}</p>
          </Card>
        )}

        {/* Flashcard */}
        {!loading && flashcards.length > 0 && (
          <>
            {/* Flashcard Container */}
            <div className="mb-8 perspective">
              <div
                className={`h-96 cursor-pointer transition-transform duration-500 transform ${
                  isFlipped ? '[transform:rotateY(180deg)]' : ''
                }`}
                onClick={() => setIsFlipped(!isFlipped)}
                style={{
                  transformStyle: 'preserve-3d' as any,
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Front of Card */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 flex flex-col justify-between border-accent"
                  style={{
                    backfaceVisibility: 'hidden' as any,
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold text-accent mb-4">Pergunta</p>
                    <p className="text-ink-1 text-xl leading-relaxed line-clamp-4">
                      {currentCard?.statement}
                    </p>
                  </div>
                  <p className="text-accent text-sm text-center">
                    Clique para ver a resposta
                  </p>
                </div>

                {/* Back of Card */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-8 flex flex-col justify-between border border-emerald-500/30"
                  style={{
                    backfaceVisibility: 'hidden' as any,
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold text-emerald-100 mb-4">Resposta</p>
                    <p className="text-ink-1 text-lg leading-relaxed mb-6">
                      {currentCard?.correctAnswerText}
                    </p>
                    {currentCard?.explanation && (
                      <>
                        <p className="text-sm font-semibold text-emerald-100 mb-2">Explicação</p>
                        <p className="text-emerald-50 text-sm leading-relaxed line-clamp-3">
                          {currentCard.explanation}
                        </p>
                      </>
                    )}
                  </div>
                  <p className="text-emerald-100 text-sm text-center">
                    Clique para voltar à pergunta
                  </p>
                </div>
              </div>
            </div>

            {/* Subject Badge */}
            <div className="text-center mb-6">
              <span className="inline-block bg-surface-2 text-accent px-4 py-2 rounded-lg text-sm font-medium">
                {currentCard && SUBJECT_LABELS[currentCard.subject]}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <p className="text-ink-2 text-sm">Progresso</p>
                <p className="text-ink-1 font-semibold">
                  {progress} de {flashcards.length}
                </p>
              </div>
              <div className="w-full bg-surface-2 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(progress / flashcards.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="md"
                onClick={handlePreviousCard}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Anterior
              </Button>

              <Button
                variant="ghost"
                size="md"
                onClick={handleShuffle}
                className="flex items-center gap-2"
              >
                <Shuffle className="w-5 h-5" />
                Embaralhar
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={handleNextCard}
                className="flex items-center gap-2"
              >
                Próxima
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && flashcards.length === 0 && !error && (
          <Card variant="glass" className="text-center py-12">
            <p className="text-ink-3">Nenhum flashcard disponível para esta matéria.</p>
          </Card>
        )}
      </main>
    </div>
  );
}
