'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send, Trash2, XCircle } from 'lucide-react';

interface Props {
  campaign: { id: string; status: string };
}

export function CampaignActions({ campaign }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dispatch = async () => {
    if (!confirm('Disparar agora? Vai notificar todos da audiência configurada.')) return;
    setLoading('send');
    setError(null);
    try {
      const res = await fetch(`/api/admin/notifications/${campaign.id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send' }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'Falhou');
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const cancel = async () => {
    if (!confirm('Cancelar? Notificações já enviadas permanecem.')) return;
    setLoading('cancel');
    try {
      await fetch(`/api/admin/notifications/${campaign.id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const remove = async () => {
    if (!confirm('Apagar campanha? Só funciona se status DRAFT.')) return;
    setLoading('delete');
    try {
      const res = await fetch(`/api/admin/notifications/${campaign.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Falhou');
        return;
      }
      router.push('/admin/notifications');
    } finally {
      setLoading(null);
    }
  };

  const canSend = ['DRAFT', 'SCHEDULED'].includes(campaign.status);
  const canCancel = ['DRAFT', 'SCHEDULED', 'SENDING'].includes(campaign.status);
  const canDelete = campaign.status === 'DRAFT';

  return (
    <div className="flex items-center gap-2">
      {canSend && (
        <button
          type="button"
          onClick={dispatch}
          disabled={loading !== null}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-50"
        >
          {loading === 'send' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Disparar agora
        </button>
      )}
      {canCancel && campaign.status !== 'DRAFT' && (
        <button
          type="button"
          onClick={cancel}
          disabled={loading !== null}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-2 text-ink-1 text-sm border disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
          Cancelar
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={remove}
          disabled={loading !== null}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm border border-red-500/30 disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          Apagar
        </button>
      )}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
