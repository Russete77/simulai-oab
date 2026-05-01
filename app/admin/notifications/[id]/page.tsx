import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, MousePointerClick, Send, AlertCircle, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { KpiCard } from '@/app/admin/_components/kpi-card';
import { prisma } from '@/lib/db/prisma';
import { CampaignActions } from './campaign-actions';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

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
  return new Date(d).toLocaleString('pt-BR');
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await prisma.notificationCampaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const recent = await prisma.notification.findMany({
    where: { campaignId: id },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  const ctr =
    campaign.totalSent > 0
      ? Math.round((campaign.totalClicked / campaign.totalSent) * 100)
      : 0;
  const readRate =
    campaign.totalSent > 0 ? Math.round((campaign.totalRead / campaign.totalSent) * 100) : 0;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/notifications"
        className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink-1 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para campanhas
      </Link>

      <Card className="bg-surface border">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    'inline-flex text-[10px] font-medium px-2 py-0.5 rounded-md border uppercase',
                    STATUS_STYLES[campaign.status]
                  )}
                >
                  {campaign.status}
                </span>
                <span className="text-[11px] text-ink-3 uppercase">{campaign.type}</span>
                <span className="text-[11px] text-ink-3">{campaign.priority}</span>
                {campaign.recurring && (
                  <span className="text-[10px] text-purple-400 uppercase">recurring</span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-ink-1">{campaign.name}</h1>
              {campaign.description && (
                <p className="text-sm text-ink-2 mt-1">{campaign.description}</p>
              )}
            </div>
            <CampaignActions campaign={{ id: campaign.id, status: campaign.status }} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-divider">
            <div>
              <p className="text-xs text-ink-3 uppercase">Canais</p>
              <p className="text-ink-1 text-sm font-medium mt-0.5">
                {campaign.channels.join(' + ')}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-3 uppercase">Audiência</p>
              <p className="text-ink-1 text-sm font-medium mt-0.5">
                {campaign.totalTargeted}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-3 uppercase">Criada</p>
              <p className="text-ink-1 text-sm font-medium mt-0.5">
                {fmtDate(campaign.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-3 uppercase">Disparada</p>
              <p className="text-ink-1 text-sm font-medium mt-0.5">{fmtDate(campaign.sentAt)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Targeted" value={campaign.totalTargeted} icon={Users} accent="blue" />
        <KpiCard label="Sent" value={campaign.totalSent} icon={Send} accent="green" />
        <KpiCard
          label="Read"
          value={campaign.totalRead}
          icon={Eye}
          accent="purple"
          hint={`${readRate}%`}
        />
        <KpiCard
          label="Clicks"
          value={campaign.totalClicked}
          icon={MousePointerClick}
          accent="amber"
          hint={`${ctr}% CTR`}
        />
      </section>

      {/* Templates */}
      <Card className="bg-surface border p-5">
        <h2 className="text-sm font-semibold text-ink-1 mb-3">Template</h2>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-ink-3 uppercase">Título</p>
            <p className="text-ink-1 mt-1">{campaign.titleTemplate}</p>
          </div>
          <div>
            <p className="text-xs text-ink-3 uppercase">Corpo</p>
            <p className="text-ink-1 mt-1 whitespace-pre-wrap">{campaign.bodyTemplate}</p>
          </div>
          {campaign.actionUrl && (
            <div>
              <p className="text-xs text-ink-3 uppercase">CTA</p>
              <p className="text-accent mt-1 text-xs font-mono">
                [{campaign.actionLabel ?? 'sem label'}] → {campaign.actionUrl}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Audience filter */}
      <Card className="bg-surface border p-5">
        <h2 className="text-sm font-semibold text-ink-1 mb-3">Filtro de audiência</h2>
        <pre className="text-xs text-ink-2 bg-bg rounded-lg p-3 overflow-x-auto">
          {JSON.stringify(campaign.audienceFilter, null, 2)}
        </pre>
      </Card>

      {/* Recent notifications */}
      <Card className="bg-surface border overflow-hidden">
        <div className="p-5 border-b border-divider">
          <h2 className="text-sm font-semibold text-ink-1">Últimas notificações enviadas</h2>
        </div>
        {recent.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <AlertCircle className="w-8 h-8 text-ink-3 mx-auto mb-2" />
            <p className="text-sm text-ink-2">Nenhuma notificação enviada ainda</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-divider text-ink-3 text-xs uppercase">
                <th className="text-left px-4 py-2 font-medium">Usuário</th>
                <th className="text-center px-4 py-2 font-medium">Push</th>
                <th className="text-center px-4 py-2 font-medium">Email</th>
                <th className="text-center px-4 py-2 font-medium">Lida</th>
                <th className="text-right px-4 py-2 font-medium">Quando</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((n) => (
                <tr key={n.id} className="border-b border-divider last:border-0">
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/users/${n.user.id}`}
                      className="hover:text-accent"
                    >
                      <div className="text-ink-1 text-xs">
                        {n.user.name ?? n.user.email.split('@')[0]}
                      </div>
                      <div className="text-[10px] text-ink-3">{n.user.email}</div>
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-center text-xs">
                    {n.pushSent ? '✅' : '—'}
                  </td>
                  <td className="px-4 py-2 text-center text-xs">
                    {n.emailSent ? '✅' : '—'}
                  </td>
                  <td className="px-4 py-2 text-center text-xs">
                    {n.readAt ? '✅' : '⏳'}
                  </td>
                  <td className="px-4 py-2 text-right text-[11px] text-ink-3">
                    {fmtDate(n.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
