'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { Search, X } from 'lucide-react';

const STATUSES = [
  { value: 'ALL', label: 'Todos status' },
  { value: 'ACTIVE', label: 'Ativas' },
  { value: 'INCOMPLETE', label: 'Bloqueadas' },
  { value: 'PAST_DUE', label: 'Atrasadas' },
  { value: 'CANCELED', label: 'Canceladas' },
] as const;

const PLANS = [
  { value: 'ALL', label: 'Todos planos' },
  { value: 'BASIC_MONTHLY', label: 'Essencial' },
  { value: 'PRO_MONTHLY', label: 'Pro' },
] as const;

export function SubscriptionsFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(sp.get('search') ?? '');

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(sp.toString());
      if (value === null || value === '') params.delete(key);
      else params.set(key, value);
      params.delete('page');
      startTransition(() => {
        router.push(`/admin/subscriptions?${params.toString()}`);
      });
    },
    [sp, router]
  );

  const currentStatus = sp.get('status') ?? 'ALL';
  const currentPlan = sp.get('plan') ?? 'ALL';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        className="flex-1 min-w-[240px] relative"
        onSubmit={(e) => {
          e.preventDefault();
          setParam('search', searchInput);
        }}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar email ou nome do usuário..."
          className="w-full h-10 pl-9 pr-9 rounded-lg bg-surface border text-sm text-ink-1 placeholder:text-ink-3 focus:outline-none focus:border-accent"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setParam('search', null);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-1"
            aria-label="Limpar busca"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      <select
        value={currentStatus}
        onChange={(e) =>
          setParam('status', e.target.value === 'ALL' ? null : e.target.value)
        }
        className="h-10 px-3 rounded-lg bg-surface border text-sm text-ink-1 focus:outline-none focus:border-accent"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        value={currentPlan}
        onChange={(e) => setParam('plan', e.target.value === 'ALL' ? null : e.target.value)}
        className="h-10 px-3 rounded-lg bg-surface border text-sm text-ink-1 focus:outline-none focus:border-accent"
      >
        {PLANS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {isPending && (
        <span className="text-xs text-ink-3 animate-pulse">Carregando...</span>
      )}
    </div>
  );
}
