import Link from 'next/link';
import type { SubscriptionStatus } from '@prisma/client';
import { Card } from '@/components/ui/card';
import {
  listAdminSubscriptions,
  getSubscriptionsBreakdown,
} from '@/lib/admin/subscriptions';
import { KpiCard } from '../_components/kpi-card';
import { SubscriptionsFilters } from './_components/subscriptions-filters';
import { SubscriptionRowActions } from './_components/subscription-row-actions';
import { UsersPagination } from '../users/_components/users-pagination';
import {
  CreditCard,
  Gift,
  AlertOctagon,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/30',
  TRIALING: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  PAST_DUE: 'bg-red-500/10 text-red-400 border-red-500/30',
  UNPAID: 'bg-red-500/10 text-red-400 border-red-500/30',
  INCOMPLETE: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  INCOMPLETE_EXPIRED: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  CANCELED: 'bg-surface-2 text-ink-3 border',
  PAUSED: 'bg-surface-2 text-ink-3 border',
};

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Ativa',
  TRIALING: 'Trial',
  PAST_DUE: 'Atrasada',
  UNPAID: 'Não paga',
  INCOMPLETE: 'Bloqueada',
  INCOMPLETE_EXPIRED: 'Expirada',
  CANCELED: 'Cancelada',
  PAUSED: 'Pausada',
};

function fmtBRL(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

function fmtDate(d: Date | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatRelative(d: Date | null): string {
  if (!d) return '—';
  const sec = Math.floor((new Date(d).getTime() - Date.now()) / 1000);
  if (sec < 0) {
    const past = Math.abs(sec);
    if (past < 86400) return 'expirou hoje';
    return `expirou há ${Math.floor(past / 86400)}d`;
  }
  if (sec < 86400) return 'menos de 1 dia';
  return `em ${Math.floor(sec / 86400)} dias`;
}

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: SubscriptionStatus | 'ALL';
    plan?: 'ALL' | 'BASIC_MONTHLY' | 'PRO_MONTHLY';
    page?: string;
  }>;
}

export default async function AdminSubscriptionsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1'));

  const [result, breakdown] = await Promise.all([
    listAdminSubscriptions({
      search: sp.search,
      status: sp.status,
      plan: sp.plan,
      page,
      pageSize: 25,
    }),
    getSubscriptionsBreakdown(),
  ]);

  const trialingCount = breakdown.find((b) => b.status === 'TRIALING')?.count ?? 0;
  const activeCount = breakdown.find((b) => b.status === 'ACTIVE')?.count ?? 0;
  const incompleteCount =
    (breakdown.find((b) => b.status === 'INCOMPLETE')?.count ?? 0) +
    (breakdown.find((b) => b.status === 'INCOMPLETE_EXPIRED')?.count ?? 0);
  const pastDueCount =
    (breakdown.find((b) => b.status === 'PAST_DUE')?.count ?? 0) +
    (breakdown.find((b) => b.status === 'UNPAID')?.count ?? 0);
  const canceledCount = breakdown.find((b) => b.status === 'CANCELED')?.count ?? 0;

  const mrr = breakdown.find((b) => b.status === 'ACTIVE')?.totalValueBRL ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-ink-1 tracking-tight">Assinaturas</h1>
        <p className="text-ink-3 text-sm mt-1">
          {result.total.toLocaleString('pt-BR')} subscriptions · MRR potencial: {fmtBRL(mrr)}
        </p>
      </header>

      {/* KPIs de status */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard
          label="Em trial"
          value={trialingCount}
          icon={Gift}
          accent="green"
        />
        <KpiCard
          label="Ativas"
          value={activeCount}
          icon={CheckCircle2}
          accent="blue"
          hint={fmtBRL(mrr) + ' MRR'}
        />
        <KpiCard
          label="Bloqueadas"
          value={incompleteCount}
          icon={AlertOctagon}
          accent="amber"
          hint="trial expirou"
        />
        <KpiCard
          label="PAST DUE"
          value={pastDueCount}
          icon={CreditCard}
          accent="red"
          hint="cobrança atrasada"
        />
        <KpiCard
          label="Canceladas"
          value={canceledCount}
          icon={XCircle}
          accent="purple"
        />
      </section>

      <SubscriptionsFilters />

      <Card className="bg-surface border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border text-ink-3 text-xs uppercase">
                <th className="text-left px-4 py-3 font-medium">Usuário</th>
                <th className="text-left px-4 py-3 font-medium">Plano</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Valor</th>
                <th className="text-right px-4 py-3 font-medium">Trial termina</th>
                <th className="text-right px-4 py-3 font-medium">Próx. cobrança</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-divider hover:bg-surface-2 transition-colors"
                >
                  <td className="px-4 py-3">
                    {s.user ? (
                      <Link
                        href={`/admin/users/${s.user.id}`}
                        className="block hover:text-accent"
                      >
                        <div className="font-medium text-ink-1 truncate max-w-[200px]">
                          {s.user.name ?? s.user.email.split('@')[0]}
                        </div>
                        <div className="text-xs text-ink-3 truncate max-w-[200px]">
                          {s.user.email}
                        </div>
                      </Link>
                    ) : (
                      <span className="text-ink-3">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-1 text-xs">
                    {s.plan.replace('_MONTHLY', '')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex text-[11px] font-medium px-2 py-0.5 rounded-md border',
                        STATUS_STYLES[s.status]
                      )}
                    >
                      {STATUS_LABEL[s.status]}
                    </span>
                    {s.cancelamentoAgendado && (
                      <span className="ml-1.5 text-[10px] text-amber-400">
                        cancela ao fim
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-ink-1 tabular-nums">
                    {fmtBRL(s.value)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-ink-2">
                    {s.status === 'TRIALING' && s.trialEnd ? (
                      <>
                        <div className="text-emerald-400">
                          {formatRelative(s.trialEnd)}
                        </div>
                        <div className="text-ink-3">{fmtDate(s.trialEnd)}</div>
                      </>
                    ) : s.trialEnd ? (
                      <span className="text-ink-disabled">{fmtDate(s.trialEnd)}</span>
                    ) : (
                      <span className="text-ink-disabled">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-ink-2">
                    {fmtDate(s.currentPeriodEnd)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <SubscriptionRowActions
                      subscriptionId={s.id}
                      status={s.status}
                    />
                  </td>
                </tr>
              ))}
              {result.rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-ink-3">
                    Nenhuma assinatura encontrada com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border">
          <UsersPagination
            total={result.total}
            page={result.page}
            pageSize={result.pageSize}
          />
        </div>
      </Card>
    </div>
  );
}
