'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Item {
  id: string;
  type: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  title: string;
  body: string;
  iconUrl?: string | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationsList({ initialItems }: { initialItems: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);

  const handleClick = async (n: Item) => {
    await fetch(`/api/notifications/${n.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'click' }),
    });
    if (n.actionUrl) {
      router.push(n.actionUrl);
    } else {
      setItems((prev) =>
        prev.map((it) => (it.id === n.id ? { ...it, readAt: new Date().toISOString() } : it))
      );
    }
  };

  const handleDismiss = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/notifications/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'dismiss' }),
    });
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleReadAll = async () => {
    setLoading(true);
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setItems((prev) =>
        prev.map((it) => ({ ...it, readAt: it.readAt ?? new Date().toISOString() }))
      );
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-surface border rounded-xl p-12 text-center">
        <Bell className="w-12 h-12 text-ink-3 mx-auto mb-4" />
        <p className="text-ink-2">Nenhuma notificação ainda</p>
        <p className="text-sm text-ink-3 mt-1">
          Vamos avisar você sobre conquistas, lembretes e novidades.
        </p>
      </div>
    );
  }

  const hasUnread = items.some((i) => !i.readAt);

  return (
    <div>
      {hasUnread && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={handleReadAll}
            disabled={loading}
            className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            Marcar todas como lidas
          </button>
        </div>
      )}

      <ul className="bg-surface border rounded-xl overflow-hidden">
        {items.map((n) => (
          <li
            key={n.id}
            onClick={() => handleClick(n)}
            className={cn(
              'group px-4 py-4 border-b border-divider last:border-0 cursor-pointer hover:bg-surface-2 transition-colors',
              !n.readAt && 'bg-blue-500/[0.05]'
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                  !n.readAt ? priorityDot(n.priority) : 'bg-transparent'
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={cn(
                      'font-medium text-sm',
                      n.readAt ? 'text-ink-2' : 'text-ink-1'
                    )}
                  >
                    {n.title}
                  </h3>
                  <button
                    type="button"
                    onClick={(e) => handleDismiss(n.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-ink-1 transition-opacity"
                    aria-label="Dispensar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-ink-2 mt-1">{n.body}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-ink-3">
                  <span>{formatRelative(n.createdAt)}</span>
                  {n.actionLabel && (
                    <span className="inline-flex items-center gap-0.5 text-accent">
                      {n.actionLabel}
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function priorityDot(p: string): string {
  switch (p) {
    case 'URGENT':
      return 'bg-red-500 animate-pulse';
    case 'HIGH':
      return 'bg-amber-500';
    case 'NORMAL':
      return 'bg-blue-500';
    default:
      return 'bg-navy-600';
  }
}

function formatRelative(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return 'agora há pouco';
  if (sec < 3600) return `${Math.floor(sec / 60)}m atrás`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h atrás`;
  return `${Math.floor(sec / 86400)}d atrás`;
}
