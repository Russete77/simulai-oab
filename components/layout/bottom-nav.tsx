'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MoreHorizontal, X } from 'lucide-react';
import { clsx } from 'clsx';
import { NAV_PRIMARY, NAV_SECONDARY } from './nav-items';

/**
 * Barra de navegação inferior — só mobile.
 *
 * Substitui o drawer de hambúrguer, que exigia dois toques (abrir, escolher)
 * e escondia o destino atual. Aqui os quatro destinos do dia a dia ficam
 * sempre visíveis, na faixa alcançável pelo polegar, com o item ativo
 * marcado. É o padrão que os apps de estudo usam.
 */
export function BottomNav() {
  const pathname = usePathname();
  const [maisAberto, setMaisAberto] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const algumSecundarioAtivo = NAV_SECONDARY.some((i) => isActive(i.href));

  // Fecha a folha ao navegar
  useEffect(() => {
    setMaisAberto(false);
  }, [pathname]);

  // Fecha com Escape
  useEffect(() => {
    if (!maisAberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMaisAberto(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [maisAberto]);

  // Reserva espaço no fim da página pra barra não cobrir conteúdo
  useEffect(() => {
    document.body.classList.add('has-bottom-nav');
    return () => document.body.classList.remove('has-bottom-nav');
  }, []);

  return (
    <>
      {maisAberto && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 animate-fade-in"
          onClick={() => setMaisAberto(false)}
          aria-hidden
        />
      )}

      {maisAberto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mais opções"
          className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-surface border-t rounded-t-xl pb-[env(safe-area-inset-bottom)] animate-fade-in"
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="text-sm font-semibold text-ink-1">Mais</h2>
            <button
              onClick={() => setMaisAberto(false)}
              className="p-2 -mr-2 rounded-md text-ink-2 hover:text-ink-1 hover:bg-surface-2 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="px-2 pb-3" aria-label="Navegação secundária">
            {NAV_SECONDARY.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                className={clsx(
                  'flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors',
                  isActive(href)
                    ? 'text-ink-1 bg-surface-2 font-medium'
                    : 'text-ink-2 hover:text-ink-1 hover:bg-surface-2'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      <nav
        aria-label="Navegação principal"
        className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-surface-overlay backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5">
          {NAV_PRIMARY.map(({ href, label, icon: Icon }) => {
            const ativo = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={ativo ? 'page' : undefined}
                className={clsx(
                  'flex flex-col items-center justify-center gap-1 py-2 text-[11px] transition-colors',
                  ativo ? 'text-accent' : 'text-ink-3 hover:text-ink-1'
                )}
              >
                <Icon className={clsx('w-5 h-5', ativo && 'stroke-[2.5]')} />
                <span className={clsx(ativo && 'font-medium')}>{label}</span>
              </Link>
            );
          })}

          <button
            onClick={() => setMaisAberto(true)}
            aria-expanded={maisAberto}
            aria-haspopup="dialog"
            className={clsx(
              'flex flex-col items-center justify-center gap-1 py-2 text-[11px] transition-colors',
              algumSecundarioAtivo ? 'text-accent' : 'text-ink-3 hover:text-ink-1'
            )}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className={clsx(algumSecundarioAtivo && 'font-medium')}>Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
}
