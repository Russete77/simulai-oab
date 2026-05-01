import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { prisma } from '@/lib/db/prisma';
import { Bell, Plus, Send, Eye, MousePointerClick, AlertCircle } from 'lucide-react';
import { KpiCard } from '../_components/kpi-card';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-surface-2 text-ink-2 border',
  SCHEDULED: 'bg-accent-soft text-accent border-accent',
  SENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse',
  SENT: 'bg-green-500/10 text-green-400 border-green-500/30',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/30',
  CANCELED: 'bg-surface-2 text-ink-3 border',
};

function fmtDate(d: Date | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AdminNotificationsPage() {
  const [campaigns, totals] = await Promise.all([
    prisma.notificationCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.notification.groupBy({
      by: ['type'],
      _count: true,
    }),
  ]);

  const totalNotifications = totals.reduce((s, t) => s + t._count, 0);
  const totalCampaigns = campaigns.length;
  const totalSent = campaigns.reduce((s, c) => s + c.totalSent, 0);
  const totalRead = campaigns.reduce((s, c) => s + c.totalRead, 0);
  const totalClicked = campaigns.reduce((s, c) => s + c.totalClicked, 0);
  const ctr = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;
  const readRate = totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-ink-1 tracking-tight flex items-center gap-3">
            <Bell className="w-7 h-7 text-accent" />
            Notificações
          </h1>
          <p className="text-ink-3 text-sm mt-1">
            {totalCampaigns} campanha{totalCampaigns !== 1 ? 's' : ''} · {totalNotifications.toLocaleString('pt-BR')} notificações enviadas
          </p>
        </div>
        <Link
          href="/admin/notifications/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova campanha
        </Link>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Enviadas" value={totalSent} icon={Send} accent="blue" />
        <KpiCard
          label="Lidas"
          value={totalRead}
          icon={Eye}
          accent="green"
          hint={`${readRate}% read rate`}
        />
        <KpiCard
          label="Clicks"
          value={totalClicked}
          icon={MousePointerClick}
          accent="purple"
          hint={`${ctr}% CTR`}
        />
        <KpiCard
          label="Falhas"
          value={campaigns.reduce((s, c) => s + c.totalFailed, 0)}
          icon={AlertCircle}
          accent="red"
        />
      </section>

      <Card className="bg-surface border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border text-ink-3 text-xs uppercase">
                <th className="text-left px-4 py-3 font-medium">Nome</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Audiência</th>
                <th className="text-right px-4 py-3 font-medium">Enviadas</th>
                <th className="text-right px-4 py-3 font-medium">Read</th>
                <th className="text-right px-4 py-3 font-medium">CTR</th>
                <th className="text-right px-4 py-3 font-medium">Criada</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const r = c.totalSent > 0 ? Math.round((c.totalRead / c.totalSent) * 100) : 0;
                const ctrLocal = c.totalSent > 0 ? Math.round((c.totalClicked / c.totalSent) * 100) : 0;
                return (
                  <tr
                    key={c.id}
                    className="border-b border-divider hover:bg-surface-2"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/admin/notifications/${c.id}`} className="hover:text-accent">
                        <div className="font-medium text-ink-1 truncate max-w-[280px]">
                          {c.name}
                        </div>
                        {c.description && (
                          <div className="text-xs text-ink-3 truncate max-w-[280px]">
                            {c.description}
                          </div>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-2">{c.type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex text-[10px] font-medium px-2 py-0.5 rounded-md border uppercase',
                          STATUS_STYLES[c.status] ?? 'bg-surface-2 text-ink-3 border'
                        )}
                      >
                        {c.status}
                      </span>
                      {c.recurring && (
                        <span className="ml-1.5 text-[9px] text-purple-400 uppercase">recurring</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-1 tabular-nums">
                      {c.totalTargeted}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-1 tabular-nums">
                      {c.totalSent}
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      <span className="text-ink-1">{c.totalRead}</span>{' '}
                      <span className="text-ink-3">({r}%)</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      <span className={ctrLocal >= 5 ? 'text-green-400' : 'text-ink-2'}>
                        {ctrLocal}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-ink-3 text-xs">
                      {fmtDate(c.createdAt)}
                    </td>
                  </tr>
                );
              })}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-ink-3">
                    Nenhuma campanha criada ainda.{' '}
                    <Link href="/admin/notifications/new" className="text-accent hover:underline">
                      Criar a primeira →
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
