import {
  Users,
  UserCheck,
  Activity,
  DollarSign,
  CreditCard,
  TrendingUp,
  UserPlus,
  TrendingDown,
  AlertOctagon,
  UserX,
  MailWarning,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  getOverviewMetrics,
  getSignupsSeries,
  getRevenueSeries,
} from '@/lib/admin/metrics';
import { KpiCard } from './_components/kpi-card';
import { SignupsChart } from './_components/signups-chart';
import { RevenueChart } from './_components/revenue-chart';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function fmtBRL(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

export default async function AdminOverviewPage() {
  const [metrics, signups, revenue] = await Promise.all([
    getOverviewMetrics(),
    getSignupsSeries(30),
    getRevenueSeries(30),
  ]);

  const paidPct =
    metrics.totalUsers === 0
      ? 0
      : Math.round((metrics.usersPaid / metrics.totalUsers) * 100);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <header>
        <h1 className="text-3xl md:text-4xl font-bold text-ink-1 tracking-tight">
          Overview
        </h1>
        <p className="text-ink-3 mt-1">
          Visão executiva do Simulai OAB — dados em tempo real
        </p>
      </header>

      {/* KPI grid — receita + crescimento */}
      <section>
        <h2 className="text-sm font-semibold text-ink-3 uppercase tracking-wider mb-3">
          Receita e crescimento
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="MRR"
            value={fmtBRL(metrics.mrrBRL)}
            icon={DollarSign}
            accent="green"
            hint={`${metrics.subscriptionsActive} assinaturas ativas`}
          />
          <KpiCard
            label="Pagamentos 30d"
            value={metrics.paymentsConfirmed30d}
            icon={CreditCard}
            accent="blue"
            hint={`${metrics.paymentsConfirmedAll} total histórico`}
          />
          <KpiCard
            label="Signups 30d"
            value={metrics.signups30d}
            icon={UserPlus}
            accent="purple"
            hint={`${metrics.signups7d} últimos 7d · ${metrics.signupsToday} hoje`}
          />
          <KpiCard
            label="Churn 30d"
            value={metrics.churnLast30d}
            icon={TrendingDown}
            accent="red"
            hint="assinaturas canceladas"
          />
        </div>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-surface border">
          <div className="p-5">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <h3 className="font-semibold text-ink-1">Signups</h3>
                <p className="text-xs text-ink-3">Últimos 30 dias</p>
              </div>
              <span className="text-lg font-bold text-accent">
                {metrics.signups30d}
              </span>
            </div>
            <SignupsChart data={signups} />
          </div>
        </Card>

        <Card className="bg-surface border">
          <div className="p-5">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <h3 className="font-semibold text-ink-1">Receita diária</h3>
                <p className="text-xs text-ink-3">Últimos 30 dias</p>
              </div>
              <span className="text-lg font-bold text-purple-400">
                {fmtBRL(revenue.reduce((s, r) => s + r.valueBRL, 0))}
              </span>
            </div>
            <RevenueChart data={revenue} />
          </div>
        </Card>
      </section>

      {/* KPI grid — funil de conversão */}
      <section>
        <h2 className="text-sm font-semibold text-ink-3 uppercase tracking-wider mb-3">
          Funil de conversão
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Pagantes"
            value={metrics.usersPaid}
            icon={UserCheck}
            accent="green"
            hint={`${paidPct}% conversão da base`}
          />
          <KpiCard
            label="Sem pagar"
            value={metrics.usersUnpaid}
            icon={UserX}
            accent="amber"
            hint="alvo de recovery campaigns"
          />
          <KpiCard
            label="Bloqueados"
            value={metrics.usersIncomplete}
            icon={AlertOctagon}
            accent="red"
            hint="INCOMPLETE / PAST_DUE"
          />
          <KpiCard
            label="Churn 30d"
            value={metrics.churnLast30d}
            icon={MailWarning}
            accent="purple"
            hint="cancelaram"
          />
        </div>
      </section>

      {/* KPI grid — base de usuários */}
      <section>
        <h2 className="text-sm font-semibold text-ink-3 uppercase tracking-wider mb-3">
          Base de usuários
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Total cadastrados"
            value={metrics.totalUsers}
            icon={Users}
            accent="blue"
          />
          <KpiCard
            label="Subscriptions ativas"
            value={metrics.subscriptionsActive}
            icon={CreditCard}
            accent="green"
          />
          <KpiCard
            label="PAST DUE"
            value={metrics.subscriptionsPastDue}
            icon={AlertOctagon}
            accent="red"
            hint="cobrança atrasada — risco churn"
          />
          <KpiCard
            label="Online agora"
            value={metrics.usersActiveNow}
            icon={Activity}
            accent="purple"
            hint={`${metrics.usersActive7d} ativos em 7d`}
          />
        </div>
      </section>

      {/* Engagement */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          label="Ativos hoje (24h)"
          value={metrics.usersActiveNow}
          icon={Activity}
          accent="green"
        />
        <KpiCard
          label="Ativos 7d"
          value={metrics.usersActive7d}
          icon={TrendingUp}
          accent="blue"
          hint={
            metrics.totalUsers
              ? `${Math.round((metrics.usersActive7d / metrics.totalUsers) * 100)}% da base`
              : undefined
          }
        />
        <KpiCard
          label="Ativos 30d"
          value={metrics.usersActive30d}
          icon={TrendingUp}
          accent="purple"
          hint={
            metrics.totalUsers
              ? `${Math.round((metrics.usersActive30d / metrics.totalUsers) * 100)}% da base`
              : undefined
          }
        />
      </section>
    </div>
  );
}
