import Link from 'next/link';
import type { PlanType, SubscriptionStatus } from '@prisma/client';
import { Card } from '@/components/ui/card';
import { listAdminUsers } from '@/lib/admin/users';
import { UsersFilters } from './_components/users-filters';
import { UsersPagination } from './_components/users-pagination';
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

const SUB_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Pagante',
  TRIALING: 'Trial',  // legado — não criamos mais TRIALING
  PAST_DUE: 'Atrasado',
  UNPAID: 'Não pago',
  INCOMPLETE: 'Bloqueado',
  INCOMPLETE_EXPIRED: 'Expirado',
  CANCELED: 'Cancelado',
  PAUSED: 'Pausado',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PLAN_STYLES: Record<PlanType, string> = {
  FREE: 'bg-surface-2 text-ink-3 border',
  BASIC: 'bg-accent-soft text-accent border-accent',
  PRO: 'bg-accent-soft text-accent border-accent',
  PREMIUM: 'bg-accent-soft text-accent border-accent',
};

function formatRelative(d: Date | null): string {
  if (!d) return 'Nunca';
  const sec = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (sec < 60) return 'Agora há pouco';
  if (sec < 3600) return `${Math.floor(sec / 60)}min atrás`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h atrás`;
  const days = Math.floor(sec / 86400);
  if (days < 30) return `${days}d atrás`;
  if (days < 365) return `${Math.floor(days / 30)}mes atrás`;
  return new Date(d).toLocaleDateString('pt-BR');
}

function formatMinutes(m: number): string {
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h}h` : `${h}h${rest}m`;
}

interface PageProps {
  searchParams: Promise<{
    search?: string;
    plan?: PlanType | 'ALL';
    subStatus?: SubscriptionStatus | 'ALL';
    activity?: string;
    page?: string;
    sort?: string;
    order?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1'));

  const result = await listAdminUsers({
    search: sp.search,
    plan: sp.plan,
    subStatus: sp.subStatus,
    activity: sp.activity as 'ACTIVE_7D' | 'ACTIVE_30D' | 'INACTIVE_30D' | 'NEVER' | undefined,
    page,
    pageSize: 25,
    sort: (sp.sort as 'createdAt' | 'lastActiveAt' | 'totalSessionMinutes' | 'totalLogins' | undefined) ?? 'createdAt',
    order: (sp.order as 'asc' | 'desc' | undefined) ?? 'desc',
  });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-ink-1 tracking-tight">Usuários</h1>
          <p className="text-ink-3 text-sm mt-1">
            {result.total.toLocaleString('pt-BR')} usuários cadastrados
          </p>
        </div>
      </header>

      <UsersFilters />

      <Card className="bg-surface border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border text-ink-3">
                <th className="text-left px-4 py-3 font-medium">Usuário</th>
                <th className="text-left px-4 py-3 font-medium">Plano</th>
                <th className="text-left px-4 py-3 font-medium">Subscription</th>
                <th className="text-right px-4 py-3 font-medium">Cadastro</th>
                <th className="text-right px-4 py-3 font-medium">Últ. atividade</th>
                <th className="text-right px-4 py-3 font-medium">Logins</th>
                <th className="text-right px-4 py-3 font-medium">Tempo</th>
                <th className="text-right px-4 py-3 font-medium">Questões</th>
                <th className="text-right px-4 py-3 font-medium">Simulados</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-divider hover:bg-surface-2 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="block hover:text-accent transition-colors"
                    >
                      <div className="font-medium text-ink-1 truncate max-w-[240px]">
                        {u.name ?? u.email.split('@')[0]}
                      </div>
                      <div className="text-xs text-ink-3 truncate max-w-[240px]">
                        {u.email}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex text-[11px] font-medium px-2 py-0.5 rounded-md border',
                        PLAN_STYLES[u.planType]
                      )}
                    >
                      {u.planType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.subscriptionStatus ? (
                      <span
                        className={cn(
                          'inline-flex text-[11px] font-medium px-2 py-0.5 rounded-md border',
                          SUB_STATUS_STYLES[u.subscriptionStatus]
                        )}
                        title={
                          u.subscriptionStatus === 'TRIALING' && u.trialEndsAt
                            ? `Trial termina ${new Date(u.trialEndsAt).toLocaleDateString('pt-BR')}`
                            : u.subscriptionStatus
                        }
                      >
                        {SUB_STATUS_LABEL[u.subscriptionStatus]}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-disabled">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-ink-3">
                    {formatRelative(u.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        u.lastActiveAt && Date.now() - new Date(u.lastActiveAt).getTime() < 5 * 60 * 1000
                          ? 'text-green-400'
                          : 'text-ink-3'
                      }
                    >
                      {formatRelative(u.lastActiveAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-ink-1 tabular-nums">
                    {u.totalLogins}
                  </td>
                  <td className="px-4 py-3 text-right text-ink-1 tabular-nums">
                    {formatMinutes(u.totalSessionMinutes)}
                  </td>
                  <td className="px-4 py-3 text-right text-ink-1 tabular-nums">
                    {u.totalAnswers}
                  </td>
                  <td className="px-4 py-3 text-right text-ink-1 tabular-nums">
                    {u.totalSimulations}
                  </td>
                </tr>
              ))}

              {result.rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-ink-3">
                    Nenhum usuário encontrado com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border">
          <UsersPagination total={result.total} page={result.page} pageSize={result.pageSize} />
        </div>
      </Card>
    </div>
  );
}
