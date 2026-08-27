'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Button, Badge } from '@/components/ui';
import { clsx } from 'clsx';
import { Gauge, TrendingUp, AlertTriangle } from 'lucide-react';

interface WeakSubject {
  subject: string;
  label: string;
  answered: number;
  accuracy: number;
}

interface Readiness {
  projectedCorrect: number;
  projectedPercent: number;
  passingScore: number;
  totalQuestions: number;
  passProbability: number;
  status: 'green' | 'yellow' | 'red';
  confidence: 'baixa' | 'media' | 'alta';
  answersConsidered: number;
  windowDays: number;
  weakSubjects: WeakSubject[];
  potential: {
    projectedCorrect: number;
    projectedPercent: number;
    passProbability: number;
    gainPoints: number;
    subjects: { subject: string; label: string }[];
  };
}

const STATUS_STYLES: Record<Readiness['status'], { bar: string; text: string; label: string }> = {
  green: { bar: 'bg-success', text: 'text-success', label: 'No caminho da aprovação' },
  yellow: { bar: 'bg-warning', text: 'text-warning', label: 'Na zona de risco — dá pra virar' },
  red: { bar: 'bg-danger', text: 'text-danger', label: 'Abaixo da nota de corte' },
};

const CONFIDENCE_LABEL: Record<Readiness['confidence'], string> = {
  baixa: 'estimativa inicial — responda mais questões para calibrar',
  media: 'estimativa moderada',
  alta: 'estimativa calibrada',
};

export function ReadinessCard() {
  const [data, setData] = useState<Readiness | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'empty' | 'locked' | 'error'>(
    'loading'
  );

  useEffect(() => {
    fetch('/api/analytics/readiness')
      .then((r) => {
        if (r.status === 402) {
          setState('locked');
          return null;
        }
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: Readiness | null) => {
        if (!d) return;
        if (d.answersConsidered === 0) {
          setState('empty');
        } else {
          setData(d);
          setState('ready');
        }
      })
      .catch(() => setState('error'));
  }, []);

  if (state === 'loading') {
    return (
      <Card>
        <div className="flex items-center justify-center h-40">
          <p className="text-sm text-ink-3">Calculando sua chance de passar…</p>
        </div>
      </Card>
    );
  }

  if (state === 'error') {
    return null;
  }

  // Sem assinatura ativa (ex-assinante ou pendente): o card vira o argumento
  // de reativação em vez de sumir do dashboard.
  if (state === 'locked') {
    return (
      <Card className="border-accent/40">
        <div className="flex items-center gap-2 mb-3">
          <Gauge className="w-4 h-4 text-accent" />
          <h2 className="text-lg font-semibold text-ink-1">Chance de passar</h2>
        </div>
        <p className="text-sm text-ink-2 mb-2">
          Sua nota projetada na 1ª fase está calculada e esperando por você — junto
          com suas matérias fracas e o plano para fechar o gap até a aprovação.
        </p>
        <p className="text-sm text-ink-2 mb-5">
          Reative seu plano para desbloquear seu Readiness Score, simulados
          ilimitados e a IA explicando cada erro.
        </p>
        <Link href="/pricing">
          <Button fullWidth>Desbloquear minha chance de passar</Button>
        </Link>
      </Card>
    );
  }

  if (state === 'empty' || !data) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Gauge className="w-4 h-4 text-ink-3" />
          <h2 className="text-lg font-semibold text-ink-1">Chance de passar</h2>
        </div>
        <p className="text-sm text-ink-2 mb-5">
          Responda questões para descobrir sua nota projetada na 1ª fase e onde focar.
        </p>
        <Link href="/simulations">
          <Button fullWidth>Fazer simulado diagnóstico</Button>
        </Link>
      </Card>
    );
  }

  const style = STATUS_STYLES[data.status];
  const pct = Math.min(100, Math.round((data.projectedCorrect / data.totalQuestions) * 100));
  const cutPct = Math.round((data.passingScore / data.totalQuestions) * 100);
  const gap = Math.round((data.passingScore - data.projectedCorrect) * 10) / 10;

  // Projeção: onde a nota chega se as matérias fracas subirem para 60%.
  // Só mostra quando o ganho é perceptível — abaixo de 2 pontos percentuais
  // vira ruído e enfraquece o número principal.
  const potencialPct = Math.min(
    100,
    Math.round((data.potential.projectedCorrect / data.totalQuestions) * 100)
  );
  const mostrarPotencial = data.potential.gainPoints >= 2 && potencialPct > pct;
  const materiaFoco = data.potential.subjects[0]?.label;
  const materiaFocoId =
    data.potential.subjects[0]?.subject ?? data.weakSubjects[0]?.subject;

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-ink-3" />
          <h2 className="text-lg font-semibold text-ink-1">Chance de passar</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="accent">{Math.round(data.passProbability * 100)}%</Badge>
          {mostrarPotencial && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
              <TrendingUp className="w-3 h-3" />
              {Math.round(data.potential.passProbability * 100)}% possível
            </span>
          )}
        </div>
      </div>

      {/* Nota projetada */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-semibold text-ink-1 tabular-nums tracking-tight">
          {Math.round(data.projectedCorrect)}
        </span>
        <span className="text-sm text-ink-3">/ {data.totalQuestions} questões (projeção)</span>
      </div>
      <p className={`text-sm font-medium mb-4 ${style.text}`}>{style.label}</p>

      {/* Barra com nota de corte */}
      <div className="relative h-2 rounded-full bg-surface-2 mb-1 overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${style.bar}`}
          style={{ width: `${pct}%` }}
        />
        {mostrarPotencial && (
          <div
            className="absolute inset-y-0 rounded-r-full"
            style={{
              left: `${pct}%`,
              width: `${potencialPct - pct}%`,
              backgroundImage:
                'repeating-linear-gradient(45deg, var(--success) 0 3px, transparent 3px 7px)',
              opacity: 0.55,
            }}
            title={`Alcançável: ${Math.round(data.potential.projectedCorrect)} questões`}
          />
        )}
        <div
          className="absolute inset-y-0 w-px bg-ink-1/60"
          style={{ left: `${cutPct}%` }}
          title={`Nota de corte: ${data.passingScore}`}
        />
      </div>
      <div className="flex justify-between text-[10px] text-ink-3 mb-5">
        <span>0</span>
        <span>corte: {data.passingScore}</span>
        <span>{data.totalQuestions}</span>
      </div>

      {/* Onde focar */}
      {data.weakSubjects.length > 0 && (
        <div className="mb-5">
          <p className="text-eyebrow mb-2">Onde focar agora</p>
          <div className="flex flex-wrap gap-1.5">
            {data.weakSubjects.map((s) => (
              <span
                key={s.subject}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-2 border text-xs text-ink-2"
              >
                <AlertTriangle className="w-3 h-3 text-warning" />
                {s.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA contextual */}
      {gap > 0 && mostrarPotencial && materiaFoco ? (
        <p className="text-sm text-ink-2 mb-4">
          Levando <span className="font-semibold text-ink-1">{materiaFoco}</span> a 60% de
          acerto, sua chance sobe para{' '}
          <span className="font-semibold text-success">
            {Math.round(data.potential.passProbability * 100)}%
          </span>
          . Faltam {gap} pontos para o corte.
        </p>
      ) : gap > 0 ? (
        <p className="text-sm text-ink-2 mb-4">
          Faltam <span className="font-semibold text-ink-1">{gap} pontos</span> para a
          aprovação. Foque nas matérias acima.
        </p>
      ) : (
        <p className="text-sm text-ink-2 mb-4">
          Você está <span className="font-semibold text-ink-1">{Math.abs(gap)} pontos</span>{' '}
          acima do corte. Mantenha o ritmo!
        </p>
      )}

      {/* "Atacar pontos fracos" ia para /simulations — a tela de ESCOLHER tipo
          de simulado, que não ataca ponto fraco nenhum. Agora leva direto às
          questões da matéria que o próprio card acabou de nomear.
          As classes vão no Link: <a> com <button> dentro é aninhamento
          inválido e quebra o foco por teclado. */}
      <Link
        href={
          materiaFocoId
            ? `/practice?subject=${materiaFocoId}`
            : '/simulations'
        }
        className={clsx(
          'inline-flex w-full items-center justify-center gap-2 h-10 px-4 rounded-md text-sm font-medium transition-all',
          data.status === 'green'
            ? 'bg-surface text-ink-1 border hover:bg-surface-2'
            : 'bg-accent text-accent-fg shadow-sm hover:bg-accent-hover'
        )}
      >
        {data.status === 'green'
          ? 'Manter ritmo — fazer simulado'
          : materiaFoco
            ? `Praticar ${materiaFoco}`
            : 'Atacar pontos fracos'}
      </Link>

      <p className="text-[10px] text-ink-3 mt-3">
        Baseado em {data.answersConsidered} respostas dos últimos {data.windowDays} dias ·{' '}
        {CONFIDENCE_LABEL[data.confidence]}
      </p>
    </Card>
  );
}
