"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, Button, LoadingSpinner } from "@/components/ui";
import { TrendingDown, BookOpen, Target, ArrowRight, Lightbulb, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Subject } from "@prisma/client";

interface Recommendation {
  subject: Subject;
  percentage: number;
  total: number;
  correct: number;
  reason: string;
}

interface Question {
  id: string;
  statement: string;
  subject: Subject;
  examYear: number;
  examPhase: number;
}

interface RecommendationResponse {
  recommendations: Recommendation[];
  questions: Question[];
  message: string;
}

const SUBJECT_LABELS: Record<Subject, string> = {
  ETHICS: "Ética",
  CONSTITUTIONAL: "Constitucional",
  CIVIL: "Civil",
  CIVIL_PROCEDURE: "Processo Civil",
  CRIMINAL: "Penal",
  CRIMINAL_PROCEDURE: "Processo Penal",
  LABOUR: "Trabalho",
  LABOUR_PROCEDURE: "Processo do Trabalho",
  ADMINISTRATIVE: "Administrativo",
  TAXES: "Tributário",
  BUSINESS: "Empresarial",
  CONSUMER: "Consumidor",
  ENVIRONMENTAL: "Ambiental",
  CHILDREN: "ECA",
  INTERNATIONAL: "Internacional",
  HUMAN_RIGHTS: "Direitos Humanos",
  GENERAL: "Geral",
};

export default function SmartReviewPage() {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/questions/recommended");

      if (!response.ok) {
        throw new Error("Erro ao buscar recomendações");
      }

      const data = await response.json();
      setData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-950">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-navy-950">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card variant="glass" className="p-8 text-center">
            <p className="text-red-500 mb-4">Erro: {error}</p>
            <Button onClick={fetchRecommendations} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  const hasRecommendations = data?.recommendations && data.recommendations.length > 0;

  return (
    <div className="min-h-screen bg-navy-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Revisão Inteligente</h1>
              <p className="text-navy-600">
                Estude onde você mais precisa melhorar
              </p>
            </div>
          </div>

          {data?.message && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-blue-300 flex items-center gap-2">
                <Target className="w-5 h-5" />
                {data.message}
              </p>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {hasRecommendations && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-amber-500" />
              Matérias que precisam de atenção
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.recommendations.map((rec) => (
                <Card
                  key={rec.subject}
                  variant="glass"
                  className="p-5 border-red-500/20 bg-red-500/5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-white">
                      {SUBJECT_LABELS[rec.subject]}
                    </h3>
                    <div className="text-2xl font-bold text-red-500">
                      {rec.percentage}%
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 mb-3">{rec.reason}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>
                      {rec.correct}/{rec.total} acertos
                    </span>
                    <span>{rec.total} questões</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`${
                        rec.percentage < 50
                          ? "bg-red-500"
                          : rec.percentage < 70
                          ? "bg-amber-500"
                          : "bg-green-500"
                      } h-2 rounded-full transition-all`}
                      style={{ width: `${rec.percentage}%` }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Questions */}
        {data?.questions && data.questions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-green-500" />
                Questões Recomendadas ({data.questions.length})
              </h2>
              <Link href={`/practice?recommended=true`}>
                <Button variant="primary" size="sm" className="flex items-center gap-2">
                  Começar Prática
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {data.questions.slice(0, 10).map((question, index) => (
                <Card key={question.id} variant="glass" className="p-4 hover:border-blue-500/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-semibold text-gray-500">
                          #{index + 1}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300">
                          {SUBJECT_LABELS[question.subject]}
                        </span>
                        <span className="text-xs text-gray-500">
                          {question.examYear} - Fase {question.examPhase}
                        </span>
                      </div>

                      <p className="text-white text-sm leading-relaxed line-clamp-2">
                        {question.statement}
                      </p>
                    </div>

                    <Link href={`/practice?questionId=${question.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-4 flex items-center gap-1"
                      >
                        Responder
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>

            {data.questions.length > 10 && (
              <div className="mt-6 text-center">
                <p className="text-gray-400 mb-3">
                  +{data.questions.length - 10} questões recomendadas disponíveis
                </p>
                <Link href="/practice?recommended=true">
                  <Button variant="primary" className="flex items-center gap-2">
                    Praticar Todas as Recomendadas
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
