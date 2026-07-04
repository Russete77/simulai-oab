'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { Gauge, Sparkles, ArrowRight } from 'lucide-react';

interface Readiness {
  projectedCorrect: number;
  passingScore: number;
  totalQuestions: number;
  passProbability: number;
  weakSubjects: { subject: string; label: string }[];
}

/**
 * Banner de conversão pós-simulado. Renderiza APENAS para usuário sem
 * assinatura ativa (o aluno do diagnóstico grátis) — assinante nunca vê.
 */
export function DiagnosticUpsell() {
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetch('/api/billing/status')
      .then((r) => r.json())
      .then((billing) => {
        const active = billing?.hasSubscription && billing?.status === 'ACTIVE';
        if (active) return;
        setShow(true);
        return fetch('/api/analytics/readiness')
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => d && setReadiness(d));
      })
      .catch(() => {});
  }, []);

  if (!show) return null;

  const gap = readiness
    ? Math.max(0, Math.round((readiness.passingScore - readiness.projectedCorrect) * 10) / 10)
    : null;
  const weak = readiness?.weakSubjects?.slice(0, 2).map((s) => s.label) ?? [];

  return (
    <Card className="border-accent/40">
      <div className="flex items-center gap-2 mb-3">
        <Gauge className="w-4 h-4 text-accent" />
        <h2 className="text-lg font-semibold text-ink-1">
          {readiness
            ? `Sua chance de passar hoje: ${Math.round(readiness.passProbability * 100)}%`
            : 'Seu diagnóstico está pronto'}
        </h2>
      </div>

      {readiness && (
        <p className="text-sm text-ink-2 mb-2">
          Nota projetada:{' '}
          <span className="font-semibold text-ink-1">
            {Math.round(readiness.projectedCorrect)}/{readiness.totalQuestions}
          </span>{' '}
          (corte: {readiness.passingScore})
          {gap !== null && gap > 0 && (
            <>
              {' '}
              — faltam <span className="font-semibold text-ink-1">{gap} pontos</span>
            </>
          )}
          {weak.length > 0 && (
            <>
              . Seus pontos fracos: <span className="font-semibold text-ink-1">{weak.join(' e ')}</span>.
            </>
          )}
        </p>
      )}

      <p className="text-sm text-ink-2 mb-5">
        O plano completo fecha esse gap: questões e simulados ilimitados, revisão
        inteligente dos seus erros e IA explicando cada questão{' '}
        <Sparkles className="inline w-3.5 h-3.5 text-accent" /> até o dia da prova.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/pricing" className="flex-1">
          <Button fullWidth>
            Fechar meu gap até a aprovação
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
