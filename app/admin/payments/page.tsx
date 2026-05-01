import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { prisma } from '@/lib/db/prisma';
import { KpiCard } from '../_components/kpi-card';
import { CreditCard, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function fmtBRL(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}
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

const STATUS_STYLES: Record<string, string> = {
  RECEIVED: 'bg-green-500/10 text-green-400 border-green-500/30',
  CONFIRMED: 'bg-accent-soft text-accent border-accent',
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  OVERDUE: 'bg-red-500/10 text-red-400 border-red-500/30',
  REFUNDED: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export default async function AdminPaymentsPage() {
  const [payments, totals] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        customer: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
      },
    }),
    prisma.payment.groupBy({
      by: ['status'],
      _count: true,
      _sum: { value: true },
    }),
  ]);

  const totalReceivedBRL =
    totals.find((t) => t.status === 'RECEIVED')?._sum.value ?? 0;
  const totalConfirmedBRL =
    totals.find((t) => t.status === 'CONFIRMED')?._sum.value ?? 0;
  const totalOverdue = totals.find((t) => t.status === 'OVERDUE')?._count ?? 0;
  const totalFailed = totals.find((t) => t.status === 'FAILED')?._count ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-ink-1 tracking-tight">Pagamentos</h1>
        <p className="text-ink-3 text-sm mt-1">
          Últimos 100 pagamentos · dados do Asaas sincronizados via webhook + cron
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Recebido (total)"
          value={fmtBRL(totalReceivedBRL + totalConfirmedBRL)}
          icon={DollarSign}
          accent="green"
          hint="RECEIVED + CONFIRMED"
        />
        <KpiCard
          label="Total pagamentos"
          value={payments.length}
          icon={CreditCard}
          accent="blue"
        />
        <KpiCard
          label="Atrasados"
          value={totalOverdue}
          icon={AlertCircle}
          accent="amber"
        />
        <KpiCard
          label="Falhas"
          value={totalFailed}
          icon={RefreshCw}
          accent="red"
        />
      </section>

      <Card className="bg-surface border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border text-ink-3 text-xs uppercase">
                <th className="text-left px-4 py-3 font-medium">Asaas ID</th>
                <th className="text-left px-4 py-3 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 font-medium">Método</th>
                <th className="text-right px-4 py-3 font-medium">Valor</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-divider hover:bg-surface-2"
                >
                  <td className="px-4 py-3 font-mono text-xs text-ink-3">
                    {p.externalPaymentId.slice(0, 16)}…
                  </td>
                  <td className="px-4 py-3">
                    {p.customer?.user ? (
                      <Link
                        href={`/admin/users/${p.customer.user.id}`}
                        className="hover:text-accent"
                      >
                        <div className="text-ink-1">
                          {p.customer.user.name ?? p.customer.user.email}
                        </div>
                        <div className="text-xs text-ink-3">
                          {p.customer.user.email}
                        </div>
                      </Link>
                    ) : (
                      <span className="text-ink-3">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-3">{p.paymentMethod}</td>
                  <td className="px-4 py-3 text-right text-ink-1 font-semibold tabular-nums">
                    {fmtBRL(p.value)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase',
                        STATUS_STYLES[p.status] ?? 'bg-surface-2 text-ink-3 border'
                      )}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-ink-3">
                    {fmtDate(p.paymentDate ?? p.createdAt)}
                  </td>
                </tr>
              ))}

              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-ink-3">
                    Nenhum pagamento registrado ainda.
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
