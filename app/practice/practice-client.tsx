'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { Header } from '@/components/layout/header';
import { QuestionCard } from '@/components/question-card';
import { QuestionExplanation } from '@/components/question-explanation';
import { QuestionChat } from '@/components/question-chat';
import { ArrowLeft, ArrowRight, BarChart3, CheckCircle, XCircle, BookOpen, Filter } from 'lucide-react';
import Link from 'next/link';
import { AnswerQuestionResponse } from '@/types/api';
import { Subject } from '@prisma/client';
import { AnswerQuestionSchema } from '@/lib/validations/question';

// Labels em português para as matérias
const SUBJECT_LABELS: Record<Subject, string> = {
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
  CHILDREN: 'Estatuto da Criança e Adolescente',
  INTERNATIONAL: 'Direito Internacional',
  HUMAN_RIGHTS: 'Direitos Humanos',
  GENERAL: 'Conhecimentos Gerais',
};

export default function PracticeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [question, setQuestion] = useState<any>(null);
  const [selectedAlternative, setSelectedAlternative] = useState<string | undefined>();
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<AnswerQuestionResponse | null>(null);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NOVO: Estado do filtro de matéria
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Lista de questões recomendadas (quando modo recommended=true)
  const [recommendedQuestions, setRecommendedQuestions] = useState<any[]>([]);
  const [currentRecommendedIndex, setCurrentRecommendedIndex] = useState(0);
  const [isRecommendedMode, setIsRecommendedMode] = useState(false);

  // AbortController para cancelar fetches ao desmontar
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup: cancelar fetches pendentes ao desmontar
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort('component unmounted');
    };
  }, []);

  useEffect(() => {
    const recommended = searchParams.get('recommended');
    if (recommended === 'true') {
      loadRecommendedQuestions();
    } else {
      loadNextQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // NOVO: Recarregar questão quando mudar o filtro
  useEffect(() => {
    if (question && !showResult && !isRecommendedMode) {
      loadNextQuestion(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject]);

  useEffect(() => {
    if (!showResult && question) {
      const interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showResult, question]);

  const loadRecommendedQuestions = async () => {
    try {
      setLoading(true);
      console.log('📚 Carregando questões recomendadas...');

      const response = await fetch('/api/questions/recommended');
      if (!response.ok) {
        throw new Error('Failed to fetch recommended questions');
      }

      const data = await response.json();
      console.log(`✅ ${data.questions.length} questões recomendadas carregadas`);

      setRecommendedQuestions(data.questions || []);
      setCurrentRecommendedIndex(0);
      setIsRecommendedMode(true);

      // Carregar primeira questão recomendada
      if (data.questions && data.questions.length > 0) {
        await loadQuestionById(data.questions[0].id);
      } else {
        // Se não há recomendadas, carregar aleatória
        await loadNextQuestion(true);
      }

      // Limpar parâmetro recommended da URL
      router.replace('/practice', { scroll: false });
    } catch (error) {
      console.error('Error loading recommended questions:', error);
      // Fallback para modo normal
      await loadNextQuestion(true);
    }
  };

  const loadQuestionById = async (questionId: string) => {
    try {
      const url = `/api/questions/next?questionId=${questionId}`;
      console.log('🔍 Buscando questão:', url);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch question');
      }

      const data = await response.json();
      setQuestion(data);
      setSelectedAlternative(undefined);
      setShowResult(false);
      setResult(null);
      setTimer(0);
    } catch (error) {
      console.error('Error loading question by ID:', error);
      throw error;
    }
  };

  const loadNextQuestion = async (skipUrlClean = false) => {
    // Criar controller FORA do try para ter referência local no finally
    abortControllerRef.current?.abort('component unmounted');
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);

      // Se está em modo recomendado, carregar próxima da lista
      if (isRecommendedMode && recommendedQuestions.length > 0) {
        const nextIndex = currentRecommendedIndex + 1;

        if (nextIndex < recommendedQuestions.length) {
          // Ainda há questões recomendadas
          console.log(`📖 Carregando questão recomendada ${nextIndex + 1}/${recommendedQuestions.length}`);
          setCurrentRecommendedIndex(nextIndex);
          await loadQuestionById(recommendedQuestions[nextIndex].id);
          setLoading(false);
          return;
        } else {
          // Acabaram as recomendadas, sair do modo
          console.log('✅ Todas as questões recomendadas concluídas! Voltando ao modo normal.');
          setIsRecommendedMode(false);
          setRecommendedQuestions([]);
          setCurrentRecommendedIndex(0);
        }
      }

      // Modo normal: questão aleatória (COM FILTRO DE MATÉRIA)
      const questionId = searchParams.get('questionId');

      // NOVO: Construir URL com filtro de matéria
      let url = questionId && !skipUrlClean
        ? `/api/questions/next?questionId=${questionId}`
        : '/api/questions/next?excludeAnswered=false';

      // Adicionar filtro de matéria se selecionado
      if (selectedSubject !== 'all') {
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}subject=${selectedSubject}`;
        console.log('🎯 Filtrando por matéria:', selectedSubject);
      }

      console.log('🔍 Buscando questão:', url);
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new Error('Failed to fetch question');
      }

      const data = await response.json();
      setQuestion(data);
      setSelectedAlternative(undefined);
      setShowResult(false);
      setResult(null);
      setTimer(0);

      // Limpar questionId da URL após carregar questão específica
      if (questionId && !skipUrlClean) {
        router.replace('/practice', { scroll: false });
      }
    } catch (error) {
      // Ignorar abort de cleanup do React
      if (typeof error === 'string' && error === 'component unmounted') return;
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Error loading question:', error);
    } finally {
      // Checar o controller LOCAL desta chamada (não o ref que pode ter sido sobrescrito)
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleSubmitAnswer = useCallback(async () => {
    if (!selectedAlternative || !question) return;

    // Validação client-side com Zod
    const payload = {
      questionId: question.id,
      alternativeId: selectedAlternative,
      timeSpent: timer,
    };
    const validation = AnswerQuestionSchema.safeParse(payload);
    if (!validation.success) {
      console.error('Validação falhou:', validation.error.flatten());
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/questions/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      const data = await response.json();
      setResult(data);
      setShowResult(true);
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedAlternative, question, timer]);

  // NOVO: Handler para mudar filtro
  const handleSubjectChange = useCallback((subject: Subject | 'all') => {
    setSelectedSubject(subject);
    setShowFilters(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-ink-2">Carregando questão...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Card variant="glass" className="text-center p-8">
          <p className="text-ink-1 mb-4">Nenhuma questão disponível</p>
          <Link href="/dashboard">
            <Button variant="primary">Voltar ao Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* NOVO: Filtro de Matérias */}
        {!isRecommendedMode && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-accent" />
                <span className="text-ink-1 font-semibold">Filtrar por Matéria:</span>
              </div>
              {selectedSubject !== 'all' && (
                <button
                  onClick={() => handleSubjectChange('all')}
                  className="text-sm text-accent hover:text-accent underline"
                >
                  Limpar filtro
                </button>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`w-full md:w-auto px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
                  selectedSubject !== 'all'
                    ? 'bg-accent-soft border-accent/50 text-accent'
                    : 'bg-surface-2 border text-ink-1 hover:border-strong'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span className="font-medium">
                    {selectedSubject === 'all' ? 'Todas as Matérias' : SUBJECT_LABELS[selectedSubject]}
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown de Matérias */}
              {showFilters && (
                <div className="absolute z-10 mt-2 w-full md:w-96 bg-surface border rounded-xl shadow-2xl max-h-96 overflow-y-auto">
                  <button
                    onClick={() => handleSubjectChange('all')}
                    className={`w-full px-4 py-3 text-left hover:bg-surface-2 transition-colors border-b border-divider ${
                      selectedSubject === 'all' ? 'bg-accent-soft text-accent' : 'text-ink-1'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Todas as Matérias</span>
                      {selectedSubject === 'all' && <CheckCircle className="w-4 h-4" />}
                    </div>
                  </button>

                  {Object.entries(SUBJECT_LABELS)
                    .filter(([key]) => key !== 'GENERAL')
                    .map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => handleSubjectChange(key as Subject)}
                        className={`w-full px-4 py-3 text-left hover:bg-surface-2 transition-colors border-b border-divider last:border-b-0 ${
                          selectedSubject === key ? 'bg-accent-soft text-accent' : 'text-ink-1'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{label}</span>
                          {selectedSubject === key && <CheckCircle className="w-4 h-4" />}
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Badge atual */}
            {selectedSubject !== 'all' && (
              <div className="mt-3 inline-flex items-center gap-2 bg-accent-soft border-accent text-accent px-3 py-1.5 rounded-lg text-sm">
                <span>Filtrando:</span>
                <span className="font-semibold">{SUBJECT_LABELS[selectedSubject]}</span>
              </div>
            )}
          </div>
        )}

        {/* Recommended Mode Indicator */}
        {isRecommendedMode && recommendedQuestions.length > 0 && (
          <Card className="mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-md bg-accent-soft text-accent flex items-center justify-center shrink-0">
                  🎯
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-ink-1">Modo Revisão Inteligente</h3>
                  <p className="text-xs text-ink-3">
                    Questão {currentRecommendedIndex + 1} de {recommendedQuestions.length}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xl font-semibold text-ink-1 text-mono-tabular">
                  {Math.round(((currentRecommendedIndex + 1) / recommendedQuestions.length) * 100)}%
                </div>
                <div className="text-[10px] text-ink-3 uppercase tracking-wider">Progresso</div>
              </div>
            </div>
            <div className="mt-3 w-full bg-surface-2 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-accent h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${((currentRecommendedIndex + 1) / recommendedQuestions.length) * 100}%` }}
              />
            </div>
          </Card>
        )}

        {/* Question Card */}
        <QuestionCard
          question={question}
          selectedAlternative={selectedAlternative}
          showResult={showResult}
          correctAlternativeId={result?.correctAlternativeId}
          onSelectAlternative={setSelectedAlternative}
          timer={timer}
        />

        {/* Result Section */}
        {showResult && result && (
          <Card className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              {result.isCorrect ? (
                <>
                  <CheckCircle className="w-5 h-5 text-success" />
                  <h3 className="text-base font-semibold text-success">Resposta correta</h3>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-danger" />
                  <h3 className="text-base font-semibold text-danger">Resposta incorreta</h3>
                </>
              )}
            </div>
            {result.explanation && (
              <p className="text-sm text-ink-2 leading-relaxed mb-4">{result.explanation}</p>
            )}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t">
              <div>
                <p className="text-xs text-ink-3 uppercase tracking-wider">Taxa de acerto</p>
                <p className="text-lg font-semibold text-ink-1 text-mono-tabular mt-0.5">{result.statistics.successRate}%</p>
              </div>
              <div>
                <p className="text-xs text-ink-3 uppercase tracking-wider">Tempo médio</p>
                <p className="text-lg font-semibold text-ink-1 text-mono-tabular mt-0.5">
                  {Math.floor(result.statistics.averageTime / 60)}:{String(result.statistics.averageTime % 60).padStart(2, '0')}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-3 uppercase tracking-wider">Seu tempo</p>
                <p className="text-lg font-semibold text-ink-1 text-mono-tabular mt-0.5">
                  {Math.floor(result.statistics.yourTime / 60)}:{String(result.statistics.yourTime % 60).padStart(2, '0')}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* AI Explanation */}
        {showResult && question && (
          <QuestionExplanation
            questionId={question.id}
            onOpenChat={() => setShowChat(true)}
          />
        )}

        {/* Chat Modal */}
        {showChat && question && (
          <QuestionChat
            questionId={question.id}
            onClose={() => setShowChat(false)}
          />
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6">
          {!showResult ? (
            <>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-8"
                onClick={() => loadNextQuestion(true)}
              >
                <span>Pular Questão</span>
              </Button>
              <Button
                variant="primary"
                className="flex-1 flex items-center justify-center gap-2"
                onClick={handleSubmitAnswer}
                disabled={!selectedAlternative || isSubmitting}
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isSubmitting ? 'Confirmando...' : 'Confirmar Resposta'}</span>
              </Button>
            </>
          ) : (
            <>
              {isRecommendedMode && currentRecommendedIndex < recommendedQuestions.length - 1 ? (
                <Button
                  variant="primary"
                  fullWidth
                  className="flex items-center justify-center gap-2"
                  onClick={() => loadNextQuestion(true)}
                >
                  <span>Próxima Recomendada ({currentRecommendedIndex + 2}/{recommendedQuestions.length})</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : isRecommendedMode && currentRecommendedIndex === recommendedQuestions.length - 1 ? (
                <div className="w-full">
                  <Card className="mb-4 text-center">
                    <div className="text-3xl mb-2">🎉</div>
                    <h3 className="text-base font-semibold text-ink-1 mb-1">
                      Você completou todas as questões recomendadas
                    </h3>
                    <p className="text-sm text-ink-2">
                      Continue praticando com questões aleatórias ou volte ao Smart Review.
                    </p>
                  </Card>
                  <div className="flex gap-3">
                    <Link href="/smart-review" className="flex-1">
                      <Button variant="secondary" fullWidth>
                        Voltar ao Smart Review
                      </Button>
                    </Link>
                    <Button
                      variant="primary"
                      fullWidth
                      className="flex items-center justify-center gap-2"
                      onClick={() => loadNextQuestion(true)}
                    >
                      <span>Continuar praticando</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => loadNextQuestion(true)}
                >
                  <span>Próxima Questão</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
