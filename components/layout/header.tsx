'use client';

import Link from 'next/link';
import Image from 'next/image';
import { UserButton } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Menu, X } from 'lucide-react';

interface HeaderProps {
  showLogout?: boolean;
}

export function Header({ showLogout = true }: HeaderProps) {
  const { isSignedIn, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    // Detectar se está rodando como PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsPWA(isStandalone);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const canGoBack = pathname !== '/' && pathname !== '/dashboard';

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  // Renderizar conteúdo consistente até mounted
  if (!mounted || !isLoaded) {
    return (
      <header
        role="banner"
        className="border-b border-navy-800 bg-navy-900/50 backdrop-blur-xl sticky top-0 z-50"
      >
        <nav
          role="navigation"
          aria-label="Navegação principal"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"
        >
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="flex items-center"
              aria-label="Ir para página inicial"
            >
              <Image
                src="/logo.png"
                alt="Simulai OAB - Página inicial"
                width={112}
                height={56}
                style={{ width: 'auto', height: 'auto' }}
                className="h-14 hover:opacity-80 transition-opacity"
              />
            </Link>

            <div className="flex items-center gap-6">
              <Link
                href="/pricing"
                className="text-navy-300 hover:text-white transition-colors font-medium"
              >
                Assinar
              </Link>
              <div className="w-20 h-10" /> {/* Placeholder para evitar shift */}
            </div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header
      role="banner"
      className="border-b border-navy-800 bg-navy-900/50 backdrop-blur-xl sticky top-0 z-50"
    >
      <nav
        role="navigation"
        aria-label="Navegação principal"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Botão de voltar para PWA */}
            {isPWA && canGoBack && (
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-navy-800 rounded-lg transition-colors"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-5 h-5 text-navy-400" />
              </button>
            )}
            <Link
              href={isSignedIn ? "/dashboard" : "/"}
              className="flex items-center"
              aria-label="Ir para página inicial"
            >
              <Image
                src="/logo.png"
                alt="Simulai OAB - Página inicial"
                width={112}
                height={56}
                style={{ width: 'auto', height: 'auto' }}
                className="h-14 hover:opacity-80 transition-opacity"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {/* Menu de navegação */}
            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className={`transition-colors font-medium pb-1 border-b-2 ${
                    isActive('/dashboard')
                      ? 'text-white border-blue-500'
                      : 'text-navy-300 hover:text-white border-transparent'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/practice"
                  className={`transition-colors font-medium pb-1 border-b-2 ${
                    isActive('/practice')
                      ? 'text-white border-blue-500'
                      : 'text-navy-300 hover:text-white border-transparent'
                  }`}
                >
                  Praticar
                </Link>
                <Link
                  href="/revisao-inteligente"
                  className={`transition-colors font-medium pb-1 border-b-2 ${
                    isActive('/revisao-inteligente')
                      ? 'text-white border-blue-500'
                      : 'text-navy-300 hover:text-white border-transparent'
                  }`}
                >
                  Revisão
                </Link>
                <Link
                  href="/plano-estudos"
                  className={`transition-colors font-medium pb-1 border-b-2 ${
                    isActive('/plano-estudos')
                      ? 'text-white border-blue-500'
                      : 'text-navy-300 hover:text-white border-transparent'
                  }`}
                >
                  Plano
                </Link>
                <Link
                  href="/leaderboard"
                  className={`transition-colors font-medium pb-1 border-b-2 ${
                    isActive('/leaderboard')
                      ? 'text-white border-blue-500'
                      : 'text-navy-300 hover:text-white border-transparent'
                  }`}
                >
                  Ranking
                </Link>
                <Link
                  href="/pricing"
                  className={`transition-colors font-medium pb-1 border-b-2 ${
                    isActive('/pricing')
                      ? 'text-white border-blue-500'
                      : 'text-navy-300 hover:text-white border-transparent'
                  }`}
                >
                  Assinar
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/pricing"
                  className={`transition-colors font-medium pb-1 border-b-2 ${
                    isActive('/pricing')
                      ? 'text-white border-blue-500'
                      : 'text-navy-300 hover:text-white border-transparent'
                  }`}
                >
                  Assinar
                </Link>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Começar Grátis
                  </Button>
                </Link>
              </>
            )}

            {/* User Button para usuários logados */}
            {showLogout && isSignedIn && (
              <div role="navigation" aria-label="Menu do usuário">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10 ring-2 ring-navy-700 hover:ring-blue-500 transition-all",
                      userButtonPopoverCard: "bg-navy-900/95 backdrop-blur-xl border border-navy-800 shadow-2xl",
                      userButtonPopoverActionButton: "!text-white hover:bg-navy-800/50 transition-colors",
                      userButtonPopoverActionButtonText: "!text-white font-medium",
                      userButtonPopoverActionButtonIcon: "text-navy-400",
                      userButtonPopoverFooter: "hidden",
                      userButtonPopoverMain: "bg-navy-900/95",
                      userPreviewMainIdentifier: "!text-white font-semibold",
                      userPreviewSecondaryIdentifier: "!text-white",
                      userButtonPopoverActions: "border-t border-navy-800",
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Mobile Menu Button & User Button */}
          <div className="flex md:hidden items-center gap-4">
            {showLogout && isSignedIn && (
              <div role="navigation" aria-label="Menu do usuário">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10 ring-2 ring-navy-700 hover:ring-blue-500 transition-all",
                      userButtonPopoverCard: "bg-navy-900/95 backdrop-blur-xl border border-navy-800 shadow-2xl",
                      userButtonPopoverActionButton: "!text-white hover:bg-navy-800/50 transition-colors",
                      userButtonPopoverActionButtonText: "!text-white font-medium",
                      userButtonPopoverActionButtonIcon: "text-navy-400",
                      userButtonPopoverFooter: "hidden",
                      userButtonPopoverMain: "bg-navy-900/95",
                      userPreviewMainIdentifier: "!text-white font-semibold",
                      userPreviewSecondaryIdentifier: "!text-white",
                      userButtonPopoverActions: "border-t border-navy-800",
                    }
                  }}
                />
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-navy-800 rounded-lg transition-colors"
              aria-label="Abrir menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-navy-800 pt-4">
            <div className="flex flex-col gap-3">
              {isSignedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className={`px-3 py-2 rounded-lg transition-colors font-medium ${
                      isActive('/dashboard')
                        ? 'bg-blue-600/20 text-white'
                        : 'text-navy-300 hover:bg-navy-800 hover:text-white'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/practice"
                    className={`px-3 py-2 rounded-lg transition-colors font-medium ${
                      isActive('/practice')
                        ? 'bg-blue-600/20 text-white'
                        : 'text-navy-300 hover:bg-navy-800 hover:text-white'
                    }`}
                  >
                    Praticar
                  </Link>
                  <Link
                    href="/revisao-inteligente"
                    className={`px-3 py-2 rounded-lg transition-colors font-medium ${
                      isActive('/revisao-inteligente')
                        ? 'bg-blue-600/20 text-white'
                        : 'text-navy-300 hover:bg-navy-800 hover:text-white'
                    }`}
                  >
                    Revisão Inteligente
                  </Link>
                  <Link
                    href="/plano-estudos"
                    className={`px-3 py-2 rounded-lg transition-colors font-medium ${
                      isActive('/plano-estudos')
                        ? 'bg-blue-600/20 text-white'
                        : 'text-navy-300 hover:bg-navy-800 hover:text-white'
                    }`}
                  >
                    Plano de Estudos
                  </Link>
                  <Link
                    href="/leaderboard"
                    className={`px-3 py-2 rounded-lg transition-colors font-medium ${
                      isActive('/leaderboard')
                        ? 'bg-blue-600/20 text-white'
                        : 'text-navy-300 hover:bg-navy-800 hover:text-white'
                    }`}
                  >
                    Ranking
                  </Link>
                  <Link
                    href="/pricing"
                    className={`px-3 py-2 rounded-lg transition-colors font-medium ${
                      isActive('/pricing')
                        ? 'bg-blue-600/20 text-white'
                        : 'text-navy-300 hover:bg-navy-800 hover:text-white'
                    }`}
                  >
                    Assinar
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/pricing"
                    className={`px-3 py-2 rounded-lg transition-colors font-medium ${
                      isActive('/pricing')
                        ? 'bg-blue-600/20 text-white'
                        : 'text-navy-300 hover:bg-navy-800 hover:text-white'
                    }`}
                  >
                    Assinar
                  </Link>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      Entrar
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="primary" size="sm" className="w-full justify-start">
                      Começar Grátis
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
