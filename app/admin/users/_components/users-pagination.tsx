'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  total: number;
  page: number;
  pageSize: number;
}

export function UsersPagination({ total, page, pageSize }: Props) {
  const sp = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const buildHref = (p: number) => {
    const params = new URLSearchParams(sp.toString());
    params.set('page', String(p));
    return `/admin/users?${params.toString()}`;
  };

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="flex items-center justify-between text-sm">
      <p className="text-ink-3">
        Mostrando <span className="text-ink-1 font-medium">{from}</span>–
        <span className="text-ink-1 font-medium">{to}</span> de{' '}
        <span className="text-ink-1 font-medium">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={buildHref(Math.max(1, page - 1))}
          className={cn(
            'h-8 w-8 flex items-center justify-center rounded-md border',
            page === 1
              ? 'pointer-events-none opacity-40 text-ink-3'
              : 'text-ink-1 hover:bg-surface-2'
          )}
          aria-disabled={page === 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <span className="px-3 py-1 text-ink-3">
          Página <span className="text-ink-1 font-medium">{page}</span> de{' '}
          <span className="text-ink-1 font-medium">{totalPages}</span>
        </span>
        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          className={cn(
            'h-8 w-8 flex items-center justify-center rounded-md border',
            page === totalPages
              ? 'pointer-events-none opacity-40 text-ink-3'
              : 'text-ink-1 hover:bg-surface-2'
          )}
          aria-disabled={page === totalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
