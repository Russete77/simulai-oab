'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { Search, X } from 'lucide-react';

const PLANS = ['ALL', 'BASIC', 'PRO', 'PREMIUM'] as const;
const SUB_STATUSES = [
  { value: 'ALL', label: 'Todos status' },
  { value: 'NO_SUB', label: 'Sem subscription' },
  { value: 'ACTIVE', label: 'Pagantes' },
  { value: 'INCOMPLETE', label: 'Bloqueados' },
  { value: 'PAST_DUE', label: 'PAST DUE' },
  { value: 'CANCELED', label: 'Cancelados' },
] as const;
const ACTIVITIES = [
  { value: 'ALL', label: 'Todos' },
  { value: 'ACTIVE_7D', label: 'Ativos 7d' },
  { value: 'ACTIVE_30D', label: 'Ativos 30d' },
  { value: 'INACTIVE_30D', label: 'Inativos 30d+' },
  { value: 'NEVER', label: 'Nunca entraram' },
] as const;

export function UsersFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(sp.get('search') ?? '');

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(sp.toString());
      if (value === null || value === '') params.delete(key);
      else params.set(key, value);
      params.delete('page'); // reset página ao mudar filtro
      startTransition(() => {
        router.push(`/admin/users?${params.toString()}`);
      });
    },
    [sp, router]
  );

  const currentPlan = sp.get('plan') ?? 'ALL';
  const currentSubStatus = sp.get('subStatus') ?? 'ALL';
  const currentActivity = sp.get('activity') ?? 'ALL';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Busca */}
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
          placeholder="Buscar email, nome ou ID..."
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

      {/* Plan */}
      <select
        value={currentPlan}
        onChange={(e) => setParam('plan', e.target.value === 'ALL' ? null : e.target.value)}
        className="h-10 px-3 rounded-lg bg-surface border text-sm text-ink-1 focus:outline-none focus:border-accent"
      >
        {PLANS.map((p) => (
          <option key={p} value={p}>
            {p === 'ALL' ? 'Todos os planos' : p}
          </option>
        ))}
      </select>

      {/* Subscription Status */}
      <select
        value={currentSubStatus}
        onChange={(e) => setParam('subStatus', e.target.value === 'ALL' ? null : e.target.value)}
        className="h-10 px-3 rounded-lg bg-surface border text-sm text-ink-1 focus:outline-none focus:border-accent"
      >
        {SUB_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Activity */}
      <select
        value={currentActivity}
        onChange={(e) => setParam('activity', e.target.value === 'ALL' ? null : e.target.value)}
        className="h-10 px-3 rounded-lg bg-surface border text-sm text-ink-1 focus:outline-none focus:border-accent"
      >
        {ACTIVITIES.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </select>

      {isPending && (
        <span className="text-xs text-ink-3 animate-pulse">Carregando...</span>
      )}
    </div>
  );
}
