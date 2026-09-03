'use client';

import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui';
import { Logo } from '@/components/layout/logo';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { BottomNav } from '@/components/layout/bottom-nav';
import { NAV_PRIMARY, NAV_SECONDARY } from '@/components/layout/nav-items';
import { clsx } from 'clsx';

interface HeaderProps {
  showLogout?: boolean;
}

export function Header({ showLogout = true }: HeaderProps) {
  const { isSignedIn, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [maisAberto, setMaisAberto] = useState(false);
  const maisRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    setIsPWA(window.matchMedia('(display-mode: standalone)').matches);
  }, []);

  useEffect(() => {
    setMaisAberto(false);
  }, [pathname]);

  // Fecha o "Mais" ao clicar fora ou apertar Escape
  useEffect(() => {
    if (!maisAberto) return;
    const onClick = (e: MouseEvent) => {
      if (maisRef.current && !maisRef.current.contains(e.target as Node)) {
        setMaisAberto(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMaisAberto(false);
    };
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [maisAberto]);

  const canGoBack = pathname !== '/' && pathname !== '/dashboard';
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');
  const algumSecundarioAtivo = NAV_SECONDARY.some((i) => isActive(i.href));

  // Skeleton inicial pra evitar layout shift
  if (!mounted || !isLoaded) {
    return (
      <header className="sticky top-0 z-50 border-b bg-surface-overlay backdrop-blur-md">
        <div className="container-page h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="Início">
            <Logo height={28} priority />
          </Link>
          <div className="w-9 h-9" aria-hidden />
        </div>
      </header>
    );
  }

  return (
    <>
      <header
        role="banner"
        className="sticky top-0 z-50 border-b bg-surface-overlay backdrop-blur-md"
      >
        {/* Div, não <nav>: o landmark "Navegação principal" fica no bloco de
            links do desktop (abaixo) e, no mobile, na barra inferior. Como os
            dois são display:none em breakpoints opostos, existe sempre
            exatamente um landmark com esse nome. */}
        <div className="container-page h-14 flex items-center justify-between gap-4">
          {/* Esquerda: voltar (PWA) + logo */}
          <div className="flex items-center gap-2 min-w-0">
            {isPWA && canGoBack && (
              <button
                onClick={() => router.back()}
                className="p-1.5 rounded-md text-ink-2 hover:text-ink-1 hover:bg-surface-2 transition-colors"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <Link
              href={isSignedIn ? '/dashboard' : '/'}
              className="flex items-center"
              aria-label="Simulai OAB — início"
            >
              <Logo height={28} priority />
            </Link>
          </div>

          {/* Centro: primária, só desktop */}
          {isSignedIn && (
            <nav
              aria-label="Navegação principal"
              className="hidden md:flex items-center gap-0.5"
            >
              {NAV_PRIMARY.map(({ href, label, icon: Icon }) => {
                const ativo = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={ativo ? 'page' : undefined}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                      ativo
                        ? 'text-ink-1 bg-surface-2 font-medium'
                        : 'text-ink-2 hover:text-ink-1 hover:bg-surface-2'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}

              {/* Mais */}
              <div className="relative" ref={maisRef}>
                <button
                  onClick={() => setMaisAberto((v) => !v)}
                  aria-expanded={maisAberto}
                  aria-haspopup="menu"
                  className={clsx(
                    'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors',
                    maisAberto || algumSecundarioAtivo
                      ? 'text-ink-1 bg-surface-2'
                      : 'text-ink-2 hover:text-ink-1 hover:bg-surface-2'
                  )}
                >
                  Mais
                  <ChevronDown
                    className={clsx(
                      'w-3.5 h-3.5 transition-transform',
                      maisAberto && 'rotate-180'
                    )}
                  />
                </button>

                {maisAberto && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-1.5 w-56 rounded-lg border bg-surface shadow-popover p-1 animate-fade-in"
                  >
                    {NAV_SECONDARY.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        role="menuitem"
                        aria-current={isActive(href) ? 'page' : undefined}
                        className={clsx(
                          'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
                          isActive(href)
                            ? 'text-ink-1 bg-surface-2 font-medium'
                            : 'text-ink-2 hover:text-ink-1 hover:bg-surface-2'
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          )}

          {/* Direita */}
          <div className="flex items-center gap-1">
            {isSignedIn ? (
              <>
                <ThemeToggle />
                {showLogout && (
                  <div className="ml-1">
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox:
                            'w-8 h-8 ring-1 ring-strong hover:ring-accent transition-all',
                          userButtonPopoverCard: 'bg-surface border shadow-popover',
                          userButtonPopoverActionButton:
                            '!text-ink-1 hover:!bg-surface-2 transition-colors',
                          userButtonPopoverActionButtonText:
                            '!text-ink-1 font-medium',
                          userButtonPopoverActionButtonIcon: '!text-ink-3',
                          userButtonPopoverFooter: 'hidden',
                          userButtonPopoverMain: 'bg-surface',
                          userPreviewMainIdentifier: '!text-ink-1 font-medium',
                          userPreviewSecondaryIdentifier: '!text-ink-2',
                          userButtonPopoverActions: 'border-t',
                        },
                      }}
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/pricing"
                  className="hidden sm:inline-flex px-2.5 py-1.5 rounded-md text-sm text-ink-2 hover:text-ink-1 hover:bg-surface-2 transition-colors"
                >
                  Planos
                </Link>
                <ThemeToggle />
                <Link href="/login" className="hidden sm:inline-flex">
                  <Button variant="ghost" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link href="/register" className="ml-1">
                  <Button size="sm">Criar conta</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile: barra inferior no lugar do drawer */}
      {isSignedIn && <BottomNav />}
    </>
  );
}
