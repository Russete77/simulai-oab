import { Card } from '@/components/ui/card';
import { prisma } from '@/lib/db/prisma';
import { Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function fmtDate(d: Date): string {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default async function AdminAuditPage() {
  const logs = await prisma.adminAudit.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-ink-1 tracking-tight flex items-center gap-3">
          <Shield className="w-7 h-7 text-accent" />
          Audit log
        </h1>
        <p className="text-ink-3 text-sm mt-1">
          Últimas 200 ações administrativas · retenção completa no banco
        </p>
      </header>

      <Card className="bg-surface border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border text-ink-3 text-xs uppercase">
                <th className="text-left px-4 py-3 font-medium">Quando</th>
                <th className="text-left px-4 py-3 font-medium">Admin</th>
                <th className="text-left px-4 py-3 font-medium">Ação</th>
                <th className="text-left px-4 py-3 font-medium">Alvo</th>
                <th className="text-left px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-divider hover:bg-surface-2">
                  <td className="px-4 py-3 text-ink-3 text-xs tabular-nums">
                    {fmtDate(l.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-ink-1 text-xs">{l.adminEmail}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block font-mono text-xs bg-surface-2 px-2 py-0.5 rounded text-accent">
                      {l.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-3 text-xs">
                    {l.targetType && l.targetId
                      ? `${l.targetType}:${l.targetId.slice(0, 12)}…`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-ink-3 text-xs font-mono">
                    {l.ipAddress ?? '—'}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-ink-3">
                    Nenhuma ação administrativa registrada ainda.
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
