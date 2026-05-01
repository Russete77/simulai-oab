import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { prisma } from '@/lib/db/prisma';
import { KpiCard } from '../_components/kpi-card';
import { Mail, Send, Eye, MousePointerClick } from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

const TYPE_LABEL: Record<string, string> = {
  INACTIVE_D3: 'Inativo 3d',
  INACTIVE_D7: 'Inativo 7d',
  INACTIVE_D14: 'Inativo 14d',
  WELCOME: 'Boas-vindas',
  PAYMENT_CONFIRMED: 'Pagamento OK',
  PAYMENT_FAILED: 'Pagamento falhou',
  SUBSCRIPTION_CANCELED: 'Assinatura cancelada',
  CUSTOM: 'Custom',
};

const STATUS_STYLES: Record<string, string> = {
  SENT: 'bg-accent-soft text-accent border-accent',
  OPENED: 'bg-green-500/10 text-green-400 border-green-500/30',
  CLICKED: 'bg-green-500/20 text-green-300 border-green-500/40',
  QUEUED: 'bg-surface-2 text-ink-3 border',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/30',
  BOUNCED: 'bg-red-500/10 text-red-400 border-red-500/30',
  UNSUBSCRIBED: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
};

export default async function AdminCampaignsPage() {
  const [campaigns, stats] = await Promise.all([
    prisma.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { user: { select: { id: true, email: true, name: true } } },
    }),
    prisma.emailCampaign.groupBy({
      by: ['status'],
      _count: true,
    }),
  ]);

  const total = stats.reduce((s, r) => s + r._count, 0);
  const sent =
    (stats.find((r) => r.status === 'SENT')?._count ?? 0) +
    (stats.find((r) => r.status === 'OPENED')?._count ?? 0) +
    (stats.find((r) => r.status === 'CLICKED')?._count ?? 0);
  const opened = stats.find((r) => r.status === 'OPENED')?._count ?? 0;
  const clicked = stats.find((r) => r.status === 'CLICKED')?._count ?? 0;

  const openRate = sent === 0 ? 0 : Math.round((opened / sent) * 100);
  const clickRate = sent === 0 ? 0 : Math.round((clicked / sent) * 100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-ink-1 tracking-tight">Campanhas de email</h1>
        <p className="text-ink-3 text-sm mt-1">
          Envios automatizados de reengajamento e transacionais
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Total enviados"
          value={sent}
          icon={Send}
          accent="blue"
          hint={`${total} no total (inclui falhas/queue)`}
        />
        <KpiCard
          label="Taxa de abertura"
          value={`${openRate}%`}
          icon={Eye}
          accent="green"
          hint={`${opened} aberturas`}
        />
        <KpiCard
          label="Taxa de clique"
          value={`${clickRate}%`}
          icon={MousePointerClick}
          accent="purple"
          hint={`${clicked} cliques`}
        />
        <KpiCard
          label="Campanhas ativas"
          value="3"
          icon={Mail}
          accent="amber"
          hint="D+3, D+7, D+14"
        />
      </section>

      <Card className="bg-surface border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border text-ink-3 text-xs uppercase">
                <th className="text-left px-4 py-3 font-medium">Data</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 font-medium">Destinatário</th>
                <th className="text-left px-4 py-3 font-medium">Assunto</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-divider hover:bg-surface-2">
                  <td className="px-4 py-3 text-ink-3 text-xs">
                    {fmtDate(c.sentAt ?? c.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-ink-1 text-xs bg-surface-2 px-2 py-0.5 rounded">
                      {TYPE_LABEL[c.type] ?? c.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.user ? (
                      <Link
                        href={`/admin/users/${c.user.id}`}
                        className="hover:text-accent"
                      >
                        <div className="text-ink-1">
                          {c.user.name ?? c.user.email}
                        </div>
                        <div className="text-xs text-ink-3">{c.user.email}</div>
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-3 truncate max-w-[280px]">
                    {c.subject}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase',
                        STATUS_STYLES[c.status] ?? 'bg-surface-2 text-ink-3 border'
                      )}
                    >
                      {c.status}
                    </span>
                    {c.error && (
                      <span className="ml-2 text-xs text-red-400" title={c.error}>
                        ⚠
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-ink-3">
                    Nenhuma campanha enviada ainda. O cron diário envia automaticamente
                    para usuários inativos 3, 7 e 14 dias.
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
