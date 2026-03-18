import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { StatsCard, Card, Progress, Button } from "@/components/ui";
import { BookOpen, Target, Flame, Trophy, TrendingUp, Play, BarChart3, Crown, Calendar, Sparkles, Brain, User } from "lucide-react";
import Link from "next/link";
import { OnboardingWrapper } from "@/components/onboarding/onboarding-wrapper";
import { OABCountdown } from "@/components/countdown/oab-countdown";
import { PushNotificationBanner } from "@/components/notifications/push-notification-banner";

// Força renderização dinâmica para garantir que ClerkProvider esteja disponível
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const accuracy = user.profile?.totalQuestions
    ? Math.round((user.profile.correctAnswers / user.profile.totalQuestions) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-navy-950">
      <Header />
      <OnboardingWrapper />

      {/* Main Content */}
      <main id="main-content" role="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Olá, {user.name || 'Estudante'}! 👋
          </h2>
          <p className="text-navy-600">
            Continue sua preparação para o Exame da OAB
          </p>
        </div>

        {/* Push Notification Banner */}
        <PushNotificationBanner />

        {/* Countdown Section */}
        <div className="mb-8">
          <OABCountdown />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={<BookOpen className="w-6 h-6" />}
            label="Questões Respondidas"
            value={user.profile?.totalQuestions || 0}
            color="blue"
          />
          <StatsCard
            icon={<Target className="w-6 h-6" />}
            label="Taxa de Acerto"
            value={`${accuracy}%`}
            trend={accuracy > 70 ? 5 : undefined}
            color="green"
          />
          <StatsCard
            icon={<Flame className="w-6 h-6" />}
            label="Sequência"
            value={`${user.profile?.streak || 0} dias`}
            color="amber"
          />
          <StatsCard
            icon={<Trophy className="w-6 h-6" />}
            label="Nível"
            value={user.profile?.level || 1}
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <Card variant="glass">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Iniciar Prática</h3>
              <Play className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-navy-600 mb-6">
              Responda questões e melhore seu desempenho
            </p>
            <Link href="/practice">
              <Button variant="primary" className="w-full">
                Começar Agora
              </Button>
            </Link>
          </Card>

          <Card variant="glass" className="border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Revisão Inteligente</h3>
              <Flame className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-navy-600 mb-6">
              Foque nas matérias que você mais precisa
            </p>
            <Link href="/revisao-inteligente">
              <Button variant="primary" className="w-full bg-gradient-to-r from-amber-600 to-orange-600">
                Ver Recomendações
              </Button>
            </Link>
          </Card>

          <Card variant="glass">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Novo Simulado</h3>
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-navy-600 mb-6">
              Faça um simulado completo do exame
            </p>
            <Link href="/simulations">
              <Button variant="outline" className="w-full">
                Criar Simulado
              </Button>
            </Link>
          </Card>

          <Card variant="glass">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Analytics</h3>
              <BarChart3 className="w-6 h-6 text-cyan-400" />
            </div>
            <p className="text-navy-600 mb-6">
              Veja gráficos e estatísticas detalhadas
            </p>
            <Link href="/analytics">
              <Button variant="outline" className="w-full">
                Ver Análise
              </Button>
            </Link>
          </Card>

          <Card variant="glass" className="border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Questão do Dia</h3>
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-navy-600 mb-6">
              Responda a questão do dia e mantenha sua sequência
            </p>
            <Link href="/questao-do-dia">
              <Button variant="primary" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600">
                Responder Agora
              </Button>
            </Link>
          </Card>

          <Card variant="glass" className="border-purple-500/20 bg-purple-500/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Plano de Estudos</h3>
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-navy-600 mb-6">
              Plano personalizado com IA baseado no seu desempenho
            </p>
            <Link href="/plano-estudos">
              <Button variant="primary" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600">
                Ver Plano
              </Button>
            </Link>
          </Card>

          <Card variant="glass">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Meu Perfil</h3>
              <User className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-navy-600 mb-6">
              Veja suas conquistas e compartilhe seu progresso
            </p>
            <Link href="/perfil">
              <Button variant="outline" className="w-full">
                Ver Perfil
              </Button>
            </Link>
          </Card>
        </div>

        {/* Progress Section */}
        <Card variant="glass">
          <h3 className="text-xl font-bold text-white mb-6">Seu Progresso</h3>

          <div className="space-y-6">
            <Progress
              label="Meta Diária"
              value={(user.profile?.totalQuestions || 0) % 20 * 5}
              color="blue"
            />
            <Progress
              label="Aproveitamento Geral"
              value={accuracy}
              color="green"
            />
            <Progress
              label="Nível Atual"
              value={((user.profile?.level || 1) % 10) * 10}
              color="purple"
            />
          </div>
        </Card>
      </main>
    </div>
  );
}
