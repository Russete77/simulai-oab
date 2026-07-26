import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { prisma } from '@/lib/db/prisma';
import { KpiCard } from '../_components/kpi-card';
import { Users, Trophy, Percent, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Participant {
  userId: string;
  name: string;
  score?: number;
  completed: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  FULL_EXAM: 'Simulado Completo',
  ADAPTIVE: 'Simulado Adaptativo',
  QUICK_PRACTICE: 'Prática Rápida',
  ERROR_REVIEW: 'Revisão de Erros',
  BY_SUBJECT: 'Por Matéria',
};

function fmtDate(d: Date): string {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AdminChallengesPage() {
  const challenges = await prisma.friendChallenge.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const rows = challenges.map((c) => {
    const participants = c.participants as unknown as Participant[];
    const completed = participants.filter((p) => p.completed);
    const topScore = completed.length
      ? Math.max(...completed.map((p) => p.score ?? 0))
      : null;
    return { ...c, participants, completedCount: completed.length, topScore };
  });

  const totalChallenges = rows.length;
  const totalParticipants = rows.reduce((s, r) => s + r.participants.length, 0);
  const totalCompleted = rows.reduce((s, r) => s + r.completedCount, 0);
  const avgParticipants = totalChallenges
    ? Math.round((totalParticipants / totalChallenges) * 10) / 10
    : 0;
  const completionRate = totalParticipants
    ? Math.round((totalCompleted / totalParticipants) * 100)
    : 0;
  // "Viral": desafios com mais de 1 participante (alguém além de quem criou entrou)
  const viralChallenges = rows.filter((r) => r.participants.length > 1).length;
  const viralRate = totalChallenges
    ? Math.round((viralChallenges / totalChallenges) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-ink-1 tracking-tight">Desafios entre amigos</h1>
        <p className="text-ink-3 text-sm mt-1">
          Loop viral do produto — criação, participação e conclusão dos desafios
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Desafios criados"
          value={totalChallenges}
          icon={Zap}
          accent="blue"
        />
        <KpiCard
          label="Participantes totais"
          value={totalParticipants}
          icon={Users}
          accent="purple"
          hint={`${avgParticipants} por desafio em média`}
        />
        <KpiCard
          label="Taxa de conclusão"
          value={`${completionRate}%`}
          icon={Percent}
          accent="green"
          hint={`${totalCompleted} de ${totalParticipants} completaram`}
        />
        <KpiCard
          label="Desafios com convidado"
          value={`${viralRate}%`}
          icon={Trophy}
          accent="amber"
          hint={`${viralChallenges} tiveram +1 participante além de quem criou`}
        />
      </section>

      <Card className="bg-surface border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border text-ink-3 text-xs uppercase">
                <th className="text-left px-4 py-3 font-medium">Criado em</th>
                <th className="text-left px-4 py-3 font-medium">Código</th>
                <th className="text-left px-4 py-3 font-medium">Criador</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 font-medium">Participantes</th>
                <th className="text-left px-4 py-3 font-medium">Completaram</th>
                <th className="text-left px-4 py-3 font-medium">Maior score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-divider hover:bg-surface-2">
                  <td className="px-4 py-3 text-ink-3 text-xs">{fmtDate(c.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/simulado-amigos/${c.code}`}
                      target="_blank"
                      className="font-mono text-accent hover:underline"
                    >
                      {c.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-1">{c.creatorName}</td>
                  <td className="px-4 py-3">
                    <span className="text-ink-1 text-xs bg-surface-2 px-2 py-0.5 rounded">
                      {TYPE_LABEL[c.type] ?? c.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-1">{c.participants.length}</td>
                  <td className="px-4 py-3 text-ink-1">{c.completedCount}</td>
                  <td className="px-4 py-3 text-ink-1">
                    {c.topScore !== null ? `${c.topScore}%` : '—'}
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-ink-3">
                    Nenhum desafio criado ainda.
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
