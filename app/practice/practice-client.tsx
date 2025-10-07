'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui';
import { Header } from '@/components/layout/header';
import { QuestionCard } from '@/components/question-card';
import { QuestionExplanation } from '@/components/question-explanation';
import { QuestionChat } from '@/components/question-chat';
import { ArrowLeft, ArrowRight, BarChart3, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { AnswerQuestionResponse } from '@/types/api';

export default function PracticeClient() {
  const [question, setQuestion] = useState<any>(null);
  const [selectedAlternative, setSelectedAlternative] = useState<string | undefined>();
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<AnswerQuestionResponse | null>(null);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    loadNextQuestion();
  }, []);

  useEffect(() => {
    if (!showResult && question) {
      const interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showResult, question]);

  const loadNextQuestion = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/questions/next?excludeAnswered=false');

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
      console.error('Error loading question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAlternative || !question) return;

    try {
      const response = await fetch('/api/questions/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          alternativeId: selectedAlternative,
          timeSpent: timer,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      const data = await response.json();
      setResult(data);
      setShowResult(true);
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-navy-600">Carregando questão...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <Card variant="glass" className="text-center p-8">
          <p className="text-white mb-4">Nenhuma questão disponível</p>
          <Link href="/dashboard">
            <Button variant="primary">Voltar ao Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <Card variant="glass" className="mt-6">
            <div className="flex items-start gap-4">
              {result.isCorrect ? (
                <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-400 text-xl">✗</span>
                </div>
              )}
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-2 ${result.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {result.isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta'}
                </h3>
                {result.explanation && (
                  <p className="text-white/80 mb-4">{result.explanation}</p>
                )}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-navy-800/50 rounded-lg p-3">
                    <p className="text-navy-600 text-sm">Taxa de Acerto</p>
                    <p className="text-white font-bold text-lg">{result.statistics.successRate}%</p>
                  </div>
                  <div className="bg-navy-800/50 rounded-lg p-3">
                    <p className="text-navy-600 text-sm">Tempo Médio</p>
                    <p className="text-white font-bold text-lg">{Math.floor(result.statistics.averageTime / 60)}:{String(result.statistics.averageTime % 60).padStart(2, '0')}</p>
                  </div>
                  <div className="bg-navy-800/50 rounded-lg p-3">
                    <p className="text-navy-600 text-sm">Seu Tempo</p>
                    <p className="text-white font-bold text-lg">{Math.floor(result.statistics.yourTime / 60)}:{String(result.statistics.yourTime % 60).padStart(2, '0')}</p>
                  </div>
                </div>
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
                onClick={loadNextQuestion}
              >
                <span>Pular Questão</span>
              </Button>
              <Button
                variant="primary"
                className="flex-1 flex items-center justify-center gap-2"
                onClick={handleSubmitAnswer}
                disabled={!selectedAlternative}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirmar Resposta</span>
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              className="w-full flex items-center justify-center gap-2"
              onClick={loadNextQuestion}
            >
              <span>Próxima Questão</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
