'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Progress } from '@/components/ui';
import { QuestionCard } from '@/components/question-card';
import { ArrowLeft, ArrowRight, Flag, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SimulationClientProps {
  simulation: any;
}

export default function SimulationClient({ simulation }: SimulationClientProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timer, setTimer] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  const currentQuestion = simulation.questions[currentQuestionIndex]?.question;
  const progress = ((currentQuestionIndex + 1) / simulation.totalQuestions) * 100;
  const answeredCount = Object.keys(answers).length;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSelectAlternative = (alternativeId: string) => {
    if (!currentQuestion) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: alternativeId,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < simulation.questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((i) => i - 1);
    }
  };

  const handleFinish = async () => {
    if (answeredCount < simulation.totalQuestions) {
      const confirm = window.confirm(
        `Você respondeu ${answeredCount} de ${simulation.totalQuestions} questões. Deseja realmente finalizar?`
      );
      if (!confirm) return;
    }

    try {
      setIsFinishing(true);

      // Submit all answers
      for (const [questionId, alternativeId] of Object.entries(answers)) {
        await fetch('/api/questions/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId,
            alternativeId,
            timeSpent: Math.max(1, Math.floor(timer / simulation.totalQuestions)),
            simulationId: simulation.id,
          }),
        });
      }

      // Finish simulation
      const response = await fetch('/api/simulations/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId: simulation.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to finish simulation');
      }

      const result = await response.json();
      router.push(`/simulations/${simulation.id}/result`);
    } catch (error) {
      console.error('Error finishing simulation:', error);
      alert('Erro ao finalizar simulado. Tente novamente.');
    } finally {
      setIsFinishing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!currentQuestion) {
    return <div>Questão não encontrada</div>;
  }

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Header */}
      <div className="border-b border-navy-800 bg-navy-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/simulations')}
                className="p-2 hover:bg-navy-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-navy-400" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Simulado {simulation.type}
                </h1>
                <p className="text-sm text-navy-600">
                  Questão {currentQuestionIndex + 1} de {simulation.totalQuestions}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-navy-600">Tempo</p>
                <p className="font-mono text-cyan-400">{formatTime(timer)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-navy-600">Respondidas</p>
                <p className="font-bold text-white">{answeredCount}/{simulation.totalQuestions}</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={progress} color="blue" showPercentage={false} />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QuestionCard
          question={currentQuestion}
          selectedAlternative={answers[currentQuestion.id]}
          onSelectAlternative={handleSelectAlternative}
        />

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-6">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Anterior</span>
          </Button>

          {currentQuestionIndex < simulation.questions.length - 1 ? (
            <Button
              variant="primary"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={handleNext}
            >
              <span>Próxima Questão</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="primary"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={handleFinish}
              disabled={isFinishing}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isFinishing ? 'Finalizando...' : 'Finalizar Simulado'}</span>
            </Button>
          )}
        </div>

        {/* Question Grid */}
        <Card variant="glass" className="mt-6">
          <h3 className="text-sm font-semibold text-navy-600 mb-3">Navegação Rápida</h3>
          <div className="grid grid-cols-10 gap-2">
            {simulation.questions.map((sq: any, index: number) => (
              <button
                key={sq.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`
                  aspect-square rounded-lg font-semibold text-sm transition-all
                  ${currentQuestionIndex === index
                    ? 'bg-blue-500 text-white'
                    : answers[sq.question.id]
                    ? 'bg-green-500/20 text-green-400 border-2 border-green-500'
                    : 'bg-navy-800 text-navy-400 hover:bg-navy-700'
                  }
                `}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
