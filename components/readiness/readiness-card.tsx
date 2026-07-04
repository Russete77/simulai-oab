'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Button, Badge } from '@/components/ui';
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
  const [state, setState] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');

  useEffect(() => {
    fetch('/api/analytics/readiness')
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: Readiness) => {
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

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-ink-3" />
          <h2 className="text-lg font-semibold text-ink-1">Chance de passar</h2>
        </div>
        <Badge variant="accent">
          <TrendingUp className="w-3 h-3" />
          {Math.round(data.passProbability * 100)}%
        </Badge>
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
      {gap > 0 ? (
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

      <Link href="/simulations">
        <Button fullWidth variant={data.status === 'green' ? 'secondary' : 'primary'}>
          {data.status === 'green' ? 'Manter ritmo — fazer simulado' : 'Atacar pontos fracos'}
        </Button>
      </Link>

      <p className="text-[10px] text-ink-3 mt-3">
        Baseado em {data.answersConsidered} respostas dos últimos {data.windowDays} dias ·{' '}
        {CONFIDENCE_LABEL[data.confidence]}
      </p>
    </Card>
  );
}
