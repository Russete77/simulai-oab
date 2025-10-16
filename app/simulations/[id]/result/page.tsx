import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, Button, Progress } from "@/components/ui";
import { ArrowLeft, Trophy, Target, Clock, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { WrongQuestionsReview } from "@/components/simulation/wrong-questions-review";

export default async function SimulationResultPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;

  // Otimização: buscar apenas os dados necessários
  const simulation = await prisma.simulation.findUnique({
    where: { id },
    include: {
      answers: {
        where: { isCorrect: false }, // Apenas respostas erradas para review
        include: {
          question: {
            select: {
              id: true,
              statement: true,
              subject: true,
              alternatives: {
                select: {
                  id: true,
                  label: true,
                  text: true,
                  isCorrect: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Buscar estatísticas agregadas de forma otimizada
  const [correctCount, answersBySubject] = await Promise.all([
    prisma.userAnswer.count({
      where: { simulationId: id, isCorrect: true },
    }),
    prisma.userAnswer.groupBy({
      by: ['questionId', 'isCorrect'],
      where: { simulationId: id },
      _count: true,
    }),
  ]);

  if (!simulation || simulation.userId !== user.id || simulation.status !== 'COMPLETED') {
    redirect('/simulations');
  }

  // Calculate statistics (usando dados já calculados do banco)
  const totalQuestions = simulation.totalQuestions;
  const correctAnswers = correctCount;
  const wrongAnswers = simulation.answers.map((a: any) => ({
    id: a.id,
    questionId: a.questionId,
    selectedAlternativeId: a.alternativeId,
    isCorrect: false,
    question: {
      id: a.question.id,
      statement: a.question.statement,
      subject: a.question.subject,
      alternatives: a.question.alternatives.map((alt: any) => ({
        id: alt.id,
        letter: alt.label,
        text: alt.text,
        isCorrect: alt.isCorrect,
      })),
    },
  }));
  const score = simulation.score || 0;
  const timeSpent = simulation.timeSpent || 0;

  // By subject - buscar questões com subjects
  const questionsWithSubjects = await prisma.simulationQuestion.findMany({
    where: { simulationId: id },
    include: {
      question: {
        select: {
          id: true,
          subject: true,
        },
      },
    },
  });

  // Mapear answers por questionId
  const answersMap = new Map<string, boolean>();
  await prisma.userAnswer.findMany({
    where: { simulationId: id },
    select: {
      questionId: true,
      isCorrect: true,
    },
  }).then(answers => {
    answers.forEach(a => answersMap.set(a.questionId, a.isCorrect));
  });

  // By subject
  const bySubjectMap = new Map<string, { total: number; correct: number }>();

  questionsWithSubjects.forEach((sq) => {
    const subject = sq.question.subject;
    if (!bySubjectMap.has(subject)) {
      bySubjectMap.set(subject, { total: 0, correct: 0 });
    }
    const stats = bySubjectMap.get(subject)!;
    stats.total += 1;
    if (answersMap.get(sq.questionId)) {
      stats.correct += 1;
    }
  });

  const bySubject = Array.from(bySubjectMap.entries()).map(([subject, stats]) => ({
    subject,
    accuracy: Math.round((stats.correct / stats.total) * 100),
    total: stats.total,
    correct: stats.correct,
  })).sort((a, b) => b.accuracy - a.accuracy);

  const weakAreas = bySubject.filter(s => s.accuracy < 60);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}min`;
  };

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
  };

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Header */}
      <div className="border-b border-navy-800 bg-navy-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/simulations">
              <button className="p-2 hover:bg-navy-800 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-navy-400" />
              </button>
            </Link>
            <h1 className="text-2xl font-bold font-heading bg-gradient-primary bg-clip-text text-transparent">
              Resultado do Simulado
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Score Card */}
        <Card variant="premium" className="mb-8 text-center">
          <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-5xl font-bold text-white mb-2">{score.toFixed(1)}%</h2>
          <p className="text-navy-600 mb-4">
            {correctAnswers} de {totalQuestions} questões corretas
          </p>
          <div className={`inline-block px-4 py-2 rounded-lg ${
            score >= 75 ? 'bg-green-500/20 text-green-400' :
            score >= 50 ? 'bg-blue-500/20 text-blue-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {score >= 75 ? 'Excelente!' : score >= 50 ? 'Bom desempenho' : 'Continue praticando'}
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card variant="glass">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-navy-600 text-sm">Taxa de Acerto</p>
                <p className="text-2xl font-bold text-white">{score.toFixed(1)}%</p>
              </div>
            </div>
          </Card>

          <Card variant="glass">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-navy-600 text-sm">Tempo Total</p>
                <p className="text-2xl font-bold text-white">{formatTime(timeSpent)}</p>
              </div>
            </div>
          </Card>

          <Card variant="glass">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-500/20 rounded-xl">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-navy-600 text-sm">Tempo Médio</p>
                <p className="text-2xl font-bold text-white">
                  {Math.round(timeSpent / totalQuestions)}s
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Performance by Subject */}
        <Card variant="glass" className="mb-8">
          <h3 className="text-xl font-bold text-white mb-6">Desempenho por Matéria</h3>
          <div className="space-y-4">
            {bySubject.map((subject) => (
              <div key={subject.subject}>
                <div className="flex justify-between mb-2">
                  <span className="text-white">{SUBJECT_LABELS[subject.subject] || subject.subject}</span>
                  <span className="text-navy-600">{subject.correct}/{subject.total}</span>
                </div>
                <Progress
                  value={subject.accuracy}
                  color={subject.accuracy >= 60 ? 'green' : 'purple'}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Weak Areas */}
        {weakAreas.length > 0 && (
          <Card variant="glass" className="mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-amber-400 mt-1" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Áreas para Melhorar</h3>
                <p className="text-navy-600 mb-4">
                  Concentre seus estudos nas seguintes matérias:
                </p>
                <div className="flex flex-wrap gap-2">
                  {weakAreas.map((area) => (
                    <span
                      key={area.subject}
                      className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm"
                    >
                      {SUBJECT_LABELS[area.subject]} ({area.accuracy}%)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Wrong Questions Review with AI Chat */}
        {wrongAnswers.length > 0 && (
          <div className="mb-8">
            <WrongQuestionsReview wrongAnswers={wrongAnswers} />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Link href={`/simulations/${id}/report`} className="flex-1">
            <Button variant="primary" className="w-full">
              Ver Relatório Detalhado
            </Button>
          </Link>
          <Link href="/simulations" className="flex-1">
            <Button variant="outline" className="w-full">
              Novo Simulado
            </Button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full">
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
