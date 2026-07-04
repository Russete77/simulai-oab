'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { Loader2 } from 'lucide-react';

export function DiagnosticoStart() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyUsed, setAlreadyUsed] = useState(false);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/simulations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'QUICK_PRACTICE' }),
      });

      if (res.status === 402) {
        setAlreadyUsed(true);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Erro ao criar diagnóstico');
      }

      const simulation = await res.json();
      router.push(`/simulations/${simulation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (alreadyUsed) {
    return (
      <div className="text-center">
        <p className="text-sm text-ink-2 mb-4">
          Você já fez seu diagnóstico grátis. Veja seu resultado no dashboard — ou
          desbloqueie simulados ilimitados:
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard">
            <Button variant="secondary">Ver meu dashboard</Button>
          </Link>
          <Link href="/pricing">
            <Button>Conhecer os planos</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <Button size="lg" onClick={start} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Preparando suas questões…
          </>
        ) : (
          'Começar diagnóstico grátis'
        )}
      </Button>
      {error && <p className="text-sm text-danger mt-3">{error}</p>}
      <p className="text-xs text-ink-3 mt-3">
        Sem cartão de crédito. 20 questões oficiais da FGV, ~25 minutos.
      </p>
    </div>
  );
}
