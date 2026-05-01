'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MoreHorizontal } from 'lucide-react';
import type { SubscriptionStatus } from '@prisma/client';

interface Props {
  subscriptionId: string;
  status: SubscriptionStatus;
}

export function SubscriptionRowActions({ subscriptionId, status }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const performAction = (
    action: 'grant_grace' | 'cancel' | 'reactivate',
    payload?: Record<string, unknown>
  ) => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/subscriptions/${subscriptionId}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ...payload }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setError(data.message || 'Erro ao executar ação');
          return;
        }
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro de rede');
      }
    });
  };

  const canGrantGrace = status !== 'ACTIVE' && status !== 'CANCELED';
  const canCancel = status !== 'CANCELED';
  const canReactivate = status === 'CANCELED';

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-md text-ink-3 hover:text-ink-1 hover:bg-surface-2 transition-colors"
        aria-label="Ações"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MoreHorizontal className="w-4 h-4" />
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 mt-1 w-56 z-20 bg-surface border rounded-lg shadow-xl py-1">
            {canGrantGrace && (
              <>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs text-ink-1 hover:bg-surface-2"
                  onClick={() => performAction('grant_grace', { days: 7 })}
                  disabled={isPending}
                >
                  Liberar acesso +7 dias (cortesia)
                </button>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs text-ink-1 hover:bg-surface-2"
                  onClick={() => performAction('grant_grace', { days: 30 })}
                  disabled={isPending}
                >
                  Liberar acesso +30 dias (cortesia)
                </button>
                <div className="border-t border-divider my-1" />
              </>
            )}

            {canCancel && (
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                onClick={() => {
                  const reason = window.prompt('Motivo do cancelamento:');
                  if (!reason) return;
                  performAction('cancel', { reason });
                }}
                disabled={isPending}
              >
                Cancelar assinatura
              </button>
            )}

            {canReactivate && (
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-xs text-green-400 hover:bg-green-500/10"
                onClick={() => performAction('reactivate')}
                disabled={isPending}
              >
                Reativar assinatura
              </button>
            )}

            {error && (
              <p className="px-3 py-2 text-[11px] text-red-400 border-t border-divider">
                {error}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
