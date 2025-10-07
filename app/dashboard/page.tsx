import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { StatsCard, Card, Progress, Button } from "@/components/ui";
import { BookOpen, Target, Flame, Trophy, TrendingUp, Play, BarChart3 } from "lucide-react";
import Link from "next/link";

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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Olá, {user.name || 'Estudante'}! 👋
          </h2>
          <p className="text-navy-600">
            Continue sua preparação para o Exame da OAB
          </p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
              <h3 className="text-xl font-bold text-white">Análise de Desempenho</h3>
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
      </div>
    </div>
  );
}
