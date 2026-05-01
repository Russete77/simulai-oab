import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Activity,
  Clock,
  CreditCard,
  Flame,
  Mail,
  MessageSquare,
  Target,
  Trophy,
  ArrowLeft,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { KpiCard } from '@/app/admin/_components/kpi-card';
import { getAdminUserDetail } from '@/lib/admin/users';
import { SubscriptionRowActions } from '@/app/admin/subscriptions/_components/subscription-row-actions';
import type { SubscriptionStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

const SUB_STATUS_STYLES: Record<SubscriptionStatus, string> = {
  ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/30',
  TRIALING: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  PAST_DUE: 'bg-red-500/10 text-red-400 border-red-500/30',
  UNPAID: 'bg-red-500/10 text-red-400 border-red-500/30',
  INCOMPLETE: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  INCOMPLETE_EXPIRED: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  CANCELED: 'bg-surface-2 text-ink-3 border',
  PAUSED: 'bg-surface-2 text-ink-3 border',
};

export const dynamic = 'force-dynamic';

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtMin(m: number): string {
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h}h` : `${h}h${r}m`;
}

function fmtBRL(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getAdminUserDetail(id);
  if (!detail) notFound();

  const { user, sessions, subjectPerformance, emailCampaigns } = detail;
  const subscriptions = user.customer?.subscriptions ?? [];
  const currentSub =
    subscriptions.find((s) => s.status === 'ACTIVE') ??
    subscriptions[0] ??
    null;
  const activeSub = currentSub?.status === 'ACTIVE' ? currentSub : null;
  const payments = user.customer?.payments ?? [];
  const totalPaidBRL = payments
    .filter((p) => ['RECEIVED', 'CONFIRMED'].includes(p.status))
    .reduce((s, p) => s + p.value, 0);

  const accuracy =
    (user._count.answers ?? 0) > 0 && user.profile
      ? (user.profile.correctAnswers / user.profile.totalQuestions) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink-1 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para lista
      </Link>

      {/* Header */}
      <Card className="bg-surface border">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-ink-1 truncate">
                {user.name ?? user.email.split('@')[0]}
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <Mail className="w-4 h-4 text-ink-3" />
                <a
                  href={`mailto:${user.email}`}
                  className="text-sm text-ink-3 hover:text-ink-1"
                >
                  {user.email}
                </a>
              </div>
              <p className="text-xs text-ink-3 mt-1 font-mono">ID: {user.id}</p>
              {user.clerkId && (
                <p className="text-xs text-ink-3 font-mono">Clerk: {user.clerkId}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-xs font-semibold',
                  user.planType === 'BASIC'
                    ? 'bg-accent-soft text-accent border-accent'
                    : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-purple-300 border-purple-500/30'
                )}
              >
                {user.planType}
              </span>
              {activeSub && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Assinatura ativa
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-divider">
            <div>
              <p className="text-xs text-ink-3 uppercase">Cadastro</p>
              <p className="text-ink-1 font-medium mt-0.5">{fmtDate(user.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-3 uppercase">Últ. atividade</p>
              <p className="text-ink-1 font-medium mt-0.5">
                {fmtDate(user.lastActiveAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-3 uppercase">Total pago</p>
              <p className="text-ink-1 font-medium mt-0.5">{fmtBRL(totalPaidBRL)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-3 uppercase">Sessões 30d</p>
              <p className="text-ink-1 font-medium mt-0.5">{sessions.length}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Subscription card */}
      {currentSub && (
        <Card className="bg-surface border">
          <div className="p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-ink-1">Assinatura atual</h3>
                  <span
                    className={cn(
                      'inline-flex text-[11px] font-medium px-2 py-0.5 rounded-md border',
                      SUB_STATUS_STYLES[currentSub.status]
                    )}
                  >
                    {currentSub.status}
                  </span>
                  {currentSub.cancelAtPeriodEnd && (
                    <span className="text-[11px] text-amber-400">cancela ao fim</span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <p className="text-ink-3 uppercase">Plano</p>
                    <p className="text-ink-1 font-medium mt-0.5">
                      {currentSub.plan.replace('_MONTHLY', '')}
                    </p>
                  </div>
                  <div>
                    <p className="text-ink-3 uppercase">Valor</p>
                    <p className="text-ink-1 font-medium mt-0.5">
                      {fmtBRL(currentSub.value)}/mês
                    </p>
                  </div>
                  <div>
                    <p className="text-ink-3 uppercase">
                      {currentSub.status === 'TRIALING' ? 'Trial até' : 'Próx. cobrança'}
                    </p>
                    <p className="text-ink-1 font-medium mt-0.5">
                      {fmtDate(
                        currentSub.status === 'TRIALING'
                          ? currentSub.trialEnd
                          : currentSub.currentPeriodEnd
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-ink-3 uppercase">Asaas ID</p>
                    <p className="text-ink-2 font-mono text-[11px] mt-0.5 truncate max-w-[140px]">
                      {currentSub.asaasSubscriptionId ?? '—'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SubscriptionRowActions
                  subscriptionId={currentSub.id}
                  status={currentSub.status}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* KPIs engagement */}
      <section>
        <h2 className="text-sm font-semibold text-ink-3 uppercase tracking-wider mb-3">
          Engajamento
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Total logins"
            value={user.totalLogins}
            icon={Activity}
            accent="blue"
          />
          <KpiCard
            label="Tempo total"
            value={fmtMin(user.totalSessionMinutes)}
            icon={Clock}
            accent="purple"
            hint="soma de sessões ativas"
          />
          <KpiCard
            label="Questões respondidas"
            value={user._count.answers}
            icon={Target}
            accent="green"
            hint={
              user._count.answers > 0
                ? `${accuracy.toFixed(1)}% de acerto`
                : undefined
            }
          />
          <KpiCard
            label="Simulados feitos"
            value={user._count.simulations}
            icon={Zap}
            accent="amber"
          />
        </div>
      </section>

      {/* Gamification */}
      {user.profile && (
        <section>
          <h2 className="text-sm font-semibold text-ink-3 uppercase tracking-wider mb-3">
            Gamificação
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="XP total"
              value={user.profile.totalPoints.toLocaleString('pt-BR')}
              icon={Trophy}
              accent="amber"
              hint={`Nível ${user.profile.level}`}
            />
            <KpiCard
              label="Streak atual"
              value={`${user.profile.streak} dias`}
              icon={Flame}
              accent="red"
            />
            <KpiCard
              label="Chats IA"
              value={user._count.chatSessions}
              icon={MessageSquare}
              accent="purple"
            />
            <KpiCard
              label="Achievements"
              value={user.achievements.length}
              icon={Trophy}
              accent="green"
            />
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance por matéria */}
        <Card className="bg-surface border">
          <div className="p-5">
            <h3 className="font-semibold text-ink-1 mb-4">
              Performance por matéria (30d)
            </h3>
            {subjectPerformance.length === 0 ? (
              <p className="text-sm text-ink-3">Sem dados nos últimos 30 dias.</p>
            ) : (
              <ul className="space-y-2.5">
                {subjectPerformance.slice(0, 10).map((s) => (
                  <li key={s.subject}>
                    <div className="flex items-baseline justify-between text-xs mb-1">
                      <span className="text-ink-1 font-medium">{s.subject}</span>
                      <span className="text-ink-3">
                        {s.correct}/{s.total} ·{' '}
                        <span className={s.rate >= 0.6 ? 'text-green-400' : 'text-amber-400'}>
                          {(s.rate * 100).toFixed(0)}%
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          s.rate >= 0.6
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : 'bg-gradient-to-r from-amber-500 to-orange-500'
                        )}
                        style={{ width: `${Math.min(100, s.rate * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Pagamentos */}
        <Card className="bg-surface border">
          <div className="p-5">
            <h3 className="font-semibold text-ink-1 mb-4">Histórico de pagamentos</h3>
            {payments.length === 0 ? (
              <p className="text-sm text-ink-3">Nenhum pagamento registrado.</p>
            ) : (
              <ul className="space-y-2">
                {payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between py-2 border-b border-divider last:border-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CreditCard
                        className={cn(
                          'w-4 h-4 shrink-0',
                          p.status === 'RECEIVED' || p.status === 'CONFIRMED'
                            ? 'text-green-400'
                            : p.status === 'OVERDUE'
                              ? 'text-amber-400'
                              : 'text-ink-3'
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-ink-1 truncate max-w-[180px]">
                          {p.description || p.externalPaymentId}
                        </p>
                        <p className="text-xs text-ink-3">
                          {fmtDate(p.paymentDate ?? p.createdAt)} · {p.paymentMethod}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-ink-1 tabular-nums">
                        {fmtBRL(p.value)}
                      </p>
                      <p
                        className={cn(
                          'text-[10px] font-medium uppercase',
                          p.status === 'RECEIVED' || p.status === 'CONFIRMED'
                            ? 'text-green-400'
                            : p.status === 'OVERDUE'
                              ? 'text-amber-400'
                              : 'text-ink-3'
                        )}
                      >
                        {p.status}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {/* Sessões */}
      <Card className="bg-surface border">
        <div className="p-5">
          <h3 className="font-semibold text-ink-1 mb-4">Sessões (últimos 30d)</h3>
          {sessions.length === 0 ? (
            <p className="text-sm text-ink-3">Sem sessões registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-ink-3 text-xs uppercase">
                    <th className="text-left py-2 font-medium">Início</th>
                    <th className="text-right py-2 font-medium">Duração</th>
                    <th className="text-right py-2 font-medium">Páginas</th>
                    <th className="text-left py-2 pl-4 font-medium">Entrada</th>
                    <th className="text-left py-2 pl-4 font-medium">Device</th>
                    <th className="text-left py-2 pl-4 font-medium">Local</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className="border-t border-divider">
                      <td className="py-2 text-ink-1">{fmtDate(s.startedAt)}</td>
                      <td className="py-2 text-right text-ink-1 tabular-nums">
                        {fmtMin(Math.round(s.durationSec / 60))}
                      </td>
                      <td className="py-2 text-right text-ink-1 tabular-nums">
                        {s.pageViews}
                      </td>
                      <td className="py-2 pl-4 text-ink-3 font-mono text-xs truncate max-w-[180px]">
                        {s.entryPath ?? '—'}
                      </td>
                      <td className="py-2 pl-4 text-ink-3 text-xs truncate max-w-[180px]">
                        {s.userAgent?.slice(0, 40) ?? '—'}
                      </td>
                      <td className="py-2 pl-4 text-ink-3 text-xs">
                        {s.city ?? s.country ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Campanhas de email */}
      {emailCampaigns.length > 0 && (
        <Card className="bg-surface border">
          <div className="p-5">
            <h3 className="font-semibold text-ink-1 mb-4">Emails enviados</h3>
            <ul className="space-y-2">
              {emailCampaigns.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between py-2 border-b border-divider last:border-0 text-sm"
                >
                  <div>
                    <span className="text-ink-1">{c.subject}</span>
                    <span className="text-ink-3 ml-2 text-xs">[{c.type}]</span>
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        'text-[10px] font-medium uppercase px-2 py-0.5 rounded',
                        c.status === 'OPENED' || c.status === 'CLICKED'
                          ? 'bg-green-500/10 text-green-400'
                          : c.status === 'SENT'
                            ? 'bg-accent-soft text-accent'
                            : c.status === 'FAILED' || c.status === 'BOUNCED'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-surface-2 text-ink-3'
                      )}
                    >
                      {c.status}
                    </span>
                    <span className="ml-3 text-ink-3 text-xs">
                      {fmtDate(c.sentAt ?? c.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}
