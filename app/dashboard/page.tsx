import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, Progress, Button, Badge } from '@/components/ui';
import {
  BookOpen,
  Target,
  Flame,
  Trophy,
  Play,
  BarChart3,
  Sparkles,
  Brain,
  User,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { OnboardingWrapper } from '@/components/onboarding/onboarding-wrapper';
import { OABCountdown } from '@/components/countdown/oab-countdown';
import { PushNotificationBanner } from '@/components/notifications/push-notification-banner';

export const dynamic = 'force-dynamic';

interface StatProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
}

function StatTile({ icon: Icon, label, value, hint }: StatProps) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-md bg-accent-soft text-accent flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-semibold text-ink-1 tracking-tight text-mono-tabular">
        {value}
      </div>
      <div className="text-xs text-ink-3 mt-1">{label}</div>
      {hint ? <div className="text-xs text-ink-2 mt-2">{hint}</div> : null}
    </Card>
  );
}

interface ActionProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  primary?: boolean;
  badge?: string;
}

function ActionCard({ href, icon: Icon, title, body, primary, badge }: ActionProps) {
  return (
    <Link href={href} className="block group">
      <Card interactive className="h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-md bg-accent-soft text-accent flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
          {badge ? <Badge variant="accent" size="sm">{badge}</Badge> : null}
        </div>
        <h3 className="text-base font-semibold text-ink-1 mb-1">{title}</h3>
        <p className="text-sm text-ink-2 leading-relaxed mb-4">{body}</p>
        <div className="flex items-center gap-1 text-sm text-accent font-medium group-hover:gap-1.5 transition-all">
          {primary ? 'Começar agora' : 'Acessar'}
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </Card>
    </Link>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const accuracy = user.profile?.totalQuestions
    ? Math.round((user.profile.correctAnswers / user.profile.totalQuestions) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <OnboardingWrapper />

      <main id="main-content" role="main" className="container-page py-10">
        {/* Welcome */}
        <header className="mb-10">
          <p className="text-eyebrow mb-2">Dashboard</p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-1">
            Olá, {user.name || 'Estudante'}.
          </h1>
          <p className="text-ink-2 mt-1.5">
            Continue sua preparação para o Exame da OAB.
          </p>
        </header>

        <PushNotificationBanner />

        {/* Countdown */}
        <div className="mb-10">
          <OABCountdown />
        </div>

        {/* Stats */}
        <section className="mb-12">
          <h2 className="text-eyebrow mb-3">Seu desempenho</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile
              icon={BookOpen}
              label="Questões respondidas"
              value={user.profile?.totalQuestions || 0}
            />
            <StatTile
              icon={Target}
              label="Taxa de acerto"
              value={`${accuracy}%`}
              hint={accuracy >= 70 ? 'Acima da média de aprovação' : undefined}
            />
            <StatTile
              icon={Flame}
              label="Sequência"
              value={`${user.profile?.streak || 0} dias`}
            />
            <StatTile
              icon={Trophy}
              label="Nível"
              value={user.profile?.level || 1}
            />
          </div>
        </section>

        {/* Actions */}
        <section className="mb-12">
          <h2 className="text-eyebrow mb-3">Ações rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <ActionCard
              href="/practice"
              icon={Play}
              title="Praticar questões"
              body="Responda questões e melhore seu desempenho por matéria."
              primary
            />
            <ActionCard
              href="/revisao-inteligente"
              icon={Flame}
              title="Revisão inteligente"
              body="Foque nas matérias que você mais precisa, com SRS."
            />
            <ActionCard
              href="/simulations"
              icon={TrendingUp}
              title="Novo simulado"
              body="Faça um simulado completo nos moldes do exame."
            />
            <ActionCard
              href="/questao-do-dia"
              icon={Sparkles}
              title="Questão do dia"
              body="Responda e mantenha sua sequência ativa."
            />
            <ActionCard
              href="/plano-estudos"
              icon={Brain}
              title="Plano de estudos"
              body="Plano personalizado com IA baseado no seu desempenho."
              badge="IA"
            />
            <ActionCard
              href="/analytics"
              icon={BarChart3}
              title="Analytics"
              body="Gráficos e estatísticas detalhadas do seu progresso."
            />
            <ActionCard
              href="/perfil"
              icon={User}
              title="Meu perfil"
              body="Veja conquistas, badges e compartilhe seu progresso."
            />
          </div>
        </section>

        {/* Progress */}
        <section>
          <h2 className="text-eyebrow mb-3">Progresso</h2>
          <Card>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-ink-2">Meta diária</span>
                  <span className="text-ink-1 text-mono-tabular">
                    {((user.profile?.totalQuestions || 0) % 20) * 5}%
                  </span>
                </div>
                <Progress value={((user.profile?.totalQuestions || 0) % 20) * 5} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-ink-2">Aproveitamento geral</span>
                  <span className="text-ink-1 text-mono-tabular">{accuracy}%</span>
                </div>
                <Progress value={accuracy} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-ink-2">Progresso do nível</span>
                  <span className="text-ink-1 text-mono-tabular">
                    {((user.profile?.level || 1) % 10) * 10}%
                  </span>
                </div>
                <Progress value={((user.profile?.level || 1) % 10) * 10} />
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
