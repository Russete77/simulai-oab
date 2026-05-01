'use client';

import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { Logo } from '@/components/layout/logo';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { clsx } from 'clsx';

interface HeaderProps {
  showLogout?: boolean;
}

const NAV_ITEMS_LOGGED = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/practice', label: 'Praticar' },
  { href: '/revisao-inteligente', label: 'Revisão' },
  { href: '/plano-estudos', label: 'Plano' },
  { href: '/leaderboard', label: 'Ranking' },
];

export function Header({ showLogout = true }: HeaderProps) {
  const { isSignedIn, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsPWA(isStandalone);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const canGoBack = pathname !== '/' && pathname !== '/dashboard';
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  // Skeleton inicial pra evitar layout shift
  if (!mounted || !isLoaded) {
    return (
      <header className="sticky top-0 z-50 border-b bg-surface-overlay backdrop-blur-md">
        <div className="container-page h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="Início">
            <Logo width={96} height={32} className="h-8" priority />
          </Link>
          <div className="w-9 h-9" aria-hidden />
        </div>
      </header>
    );
  }

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 border-b bg-surface-overlay backdrop-blur-md"
    >
      <nav
        role="navigation"
        aria-label="Navegação principal"
        className="container-page h-14 flex items-center justify-between gap-4"
      >
        {/* Left: logo + back btn */}
        <div className="flex items-center gap-3 min-w-0">
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
            className="flex items-center gap-2"
            aria-label="Simulai OAB — início"
          >
            <Logo width={96} height={32} className="h-8" priority />
          </Link>
        </div>

        {/* Middle: desktop nav (logged in only) */}
        {isSignedIn && (
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS_LOGGED.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'px-2.5 py-1.5 rounded-md text-sm transition-colors',
                  isActive(href)
                    ? 'text-ink-1 bg-surface-2'
                    : 'text-ink-2 hover:text-ink-1 hover:bg-surface-2'
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          {/* CTA pra logado: ver assinatura */}
          {isSignedIn ? (
            <>
              <Link
                href="/pricing"
                className="hidden md:inline-flex px-2.5 py-1.5 rounded-md text-sm text-ink-2 hover:text-ink-1 hover:bg-surface-2 transition-colors"
              >
                Planos
              </Link>
              <ThemeToggle />
              {showLogout && <NotificationBell />}
              {showLogout && (
                <div role="navigation" aria-label="Menu do usuário" className="ml-1">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox:
                          'w-8 h-8 ring-1 ring-strong hover:ring-accent transition-all',
                        userButtonPopoverCard:
                          'bg-surface border shadow-popover',
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

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="md:hidden p-2 rounded-md text-ink-2 hover:text-ink-1 hover:bg-surface-2 transition-colors"
                aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
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
      </nav>

      {/* Mobile drawer */}
      {mobileMenuOpen && isSignedIn && (
        <div className="md:hidden border-t bg-surface animate-fade-in">
          <div className="container-page py-3 space-y-1">
            {NAV_ITEMS_LOGGED.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'block px-3 py-2.5 rounded-md text-sm transition-colors',
                  isActive(href)
                    ? 'text-ink-1 bg-surface-2'
                    : 'text-ink-2 hover:text-ink-1 hover:bg-surface-2'
                )}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/pricing"
              className={clsx(
                'block px-3 py-2.5 rounded-md text-sm transition-colors',
                isActive('/pricing')
                  ? 'text-ink-1 bg-surface-2'
                  : 'text-ink-2 hover:text-ink-1 hover:bg-surface-2'
              )}
            >
              Planos
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
