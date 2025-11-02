'use client';

import { useExplanation } from "@/hooks/use-explanation";
import { Card, Button } from "@/components/ui";
import { Sparkles, MessageCircle } from "lucide-react";
import { ExplanationCards } from "@/components/explanation-cards";

interface QuestionExplanationProps {
  questionId: string;
  onOpenChat: () => void;
}

export function QuestionExplanation({
  questionId,
  onOpenChat,
}: QuestionExplanationProps) {
  const { data, loading, error, fetchExplanation } = useExplanation(questionId);

  // Antes de carregar
  if (!data && !loading && !error) {
    return (
      <Card variant="glass" className="mt-6">
        <div className="text-center py-8 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
            <Sparkles className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Quer entender melhor?
          </h3>
          <p className="text-navy-400 mb-6 max-w-md mx-auto">
            Nossa IA vai gerar uma explicação detalhada sobre essa questão,
            incluindo legislação relevante e dicas de memorização
          </p>
          <Button variant="primary" onClick={fetchExplanation} className="min-w-[200px]">
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar Explicação com IA
          </Button>
        </div>
      </Card>
    );
  }

  // Carregando
  if (loading) {
    return (
      <Card variant="glass" className="mt-6 p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500/20 border-t-blue-500"></div>
            <Sparkles className="w-5 h-5 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <p className="text-white font-medium">Gerando explicação...</p>
            <p className="text-navy-400 text-sm">Nossa IA está analisando a questão</p>
          </div>
        </div>
      </Card>
    );
  }

  // Erro
  if (error) {
    return (
      <Card variant="glass" className="mt-6 p-6 border-red-500/20 bg-red-500/5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-red-400 text-xl">✗</span>
          </div>
          <div className="flex-1">
            <h3 className="text-red-400 font-semibold mb-1">Erro ao gerar explicação</h3>
            <p className="text-red-300/80 text-sm">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchExplanation}
              className="mt-3"
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Explicação carregada
  if (!data) return null;

  return (
    <Card variant="glass" className="mt-6">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Explicação Detalhada
              </h3>
              <p className="text-navy-400 text-sm">
                Gerada por IA especializada em Direito
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenChat}
            className="flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Tirar Dúvidas</span>
          </Button>
        </div>

        {/* Badge de resultado */}
        {data.metadata.isCorrect !== undefined && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg border ${
              data.metadata.isCorrect
                ? "bg-green-500/10 border-green-500/20"
                : "bg-red-500/10 border-red-500/20"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                data.metadata.isCorrect ? "text-green-400" : "text-red-400"
              }`}
            >
              {data.metadata.isCorrect ? "✓" : "✗"} Você respondeu:{" "}
              <strong>{data.metadata.userAnswer}</strong> • Correta:{" "}
              <strong>{data.metadata.correctAnswer}</strong>
            </p>
          </div>
        )}

        {/* Cards estruturados de explicação */}
        <ExplanationCards
          explanation={data.explanation}
          isCorrect={data.metadata.isCorrect}
        />
      </div>
    </Card>
  );
}
