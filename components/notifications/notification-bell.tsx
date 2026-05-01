'use client';

/**
 * NotificationBell — sino com badge de unread + painel slide-in.
 *
 * Faz polling a cada 30s pra atualizar contagem.
 * Vibração disparada se o user clicou em "permitir notificações" no browser.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Check, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: string;
  type: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  title: string;
  body: string;
  iconUrl?: string | null;
  imageUrl?: string | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
  vibrate: boolean;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  items: NotificationItem[];
  nextCursor: string | null;
  unreadCount: number;
}

const POLL_INTERVAL_MS = 30_000;

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const knownIds = useRef<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=20', {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data: NotificationsResponse = await res.json();

      // Detect novos URGENT pra vibrar
      const newUrgent = data.items.filter(
        (n) =>
          !knownIds.current.has(n.id) &&
          !n.readAt &&
          (n.priority === 'URGENT' || n.vibrate)
      );
      if (newUrgent.length > 0 && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([200, 100, 200]);
        } catch {
          /* ignore */
        }
      }

      data.items.forEach((n) => knownIds.current.add(n.id));
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      /* swallow */
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = window.setInterval(fetchData, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [fetchData]);

  const handleClick = async (n: NotificationItem) => {
    setLoading(true);
    try {
      await fetch(`/api/notifications/${n.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'click' }),
      });
      if (n.actionUrl) {
        setOpen(false);
        router.push(n.actionUrl);
      } else {
        // Apenas marca como lida
        setItems((prev) =>
          prev.map((it) => (it.id === n.id ? { ...it, readAt: new Date().toISOString() } : it))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } finally {
      setLoading(false);
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
    fetchData();
  };

  const handleReadAll = async () => {
    setLoading(true);
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setItems((prev) =>
        prev.map((it) => ({ ...it, readAt: it.readAt ?? new Date().toISOString() }))
      );
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-md text-ink-2 hover:text-ink-1 hover:bg-surface-2 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-[10px] font-semibold text-white flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 mt-1 w-[360px] max-w-[calc(100vw-2rem)] z-50 bg-surface border rounded-lg shadow-popover overflow-hidden animate-fade-up" style={{ animationDuration: '160ms' }}>
            {/* Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold text-ink-1 text-sm">Notificações</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleReadAll}
                  disabled={loading}
                  className="text-xs text-accent hover:text-accent-hover disabled:opacity-50"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[420px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <Bell className="w-8 h-8 text-ink-3 mx-auto mb-2" />
                  <p className="text-sm text-ink-2">Nenhuma notificação</p>
                </div>
              ) : (
                <ul>
                  {items.map((n) => (
                    <li
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={cn(
                        'group px-4 py-3 border-b border-divider last:border-0 cursor-pointer hover:bg-surface-2 transition-colors',
                        !n.readAt && 'bg-accent-soft/40'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                            n.readAt ? 'bg-transparent' : priorityDot(n.priority)
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                'text-sm font-medium',
                                n.readAt ? 'text-ink-2' : 'text-ink-1'
                              )}
                            >
                              {n.title}
                            </p>
                            <button
                              type="button"
                              onClick={(e) => handleDismiss(n.id, e)}
                              className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-ink-1 transition-opacity"
                              aria-label="Dispensar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-ink-2 mt-0.5 line-clamp-2">
                            {n.body}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-ink-3">
                              {formatRelative(n.createdAt)}
                            </span>
                            {n.actionLabel && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-accent">
                                {n.actionLabel}
                                <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t bg-bg/50">
              <Link
                href="/notificacoes"
                onClick={() => setOpen(false)}
                className="text-xs text-accent hover:text-accent-hover flex items-center justify-center gap-1"
              >
                Ver todas
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </>
      )}
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
