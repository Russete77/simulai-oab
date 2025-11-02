'use client';

import Link from 'next/link';
import Image from 'next/image';
import { UserButton } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui';
import { useEffect, useState } from 'react';

interface HeaderProps {
  showLogout?: boolean;
}

export function Header({ showLogout = true }: HeaderProps) {
  const { isSignedIn, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
                style={{ height: 'auto' }}
                className="h-14 hover:opacity-80 transition-opacity"
              />
            </Link>

            <div className="flex items-center gap-6">
              <Link
                href="/pricing"
                className="text-navy-300 hover:text-white transition-colors font-medium"
              >
                Planos
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
              style={{ height: 'auto' }}
              className="h-14 hover:opacity-80 transition-opacity"
            />
          </Link>

          <div className="flex items-center gap-6">
            {/* Menu de navegação */}
            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-navy-300 hover:text-white transition-colors font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/practice"
                  className="text-navy-300 hover:text-white transition-colors font-medium"
                >
                  Praticar
                </Link>
                <Link
                  href="/pricing"
                  className="text-navy-300 hover:text-white transition-colors font-medium"
                >
                  Planos
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/pricing"
                  className="text-navy-300 hover:text-white transition-colors font-medium"
                >
                  Planos
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
                  afterSignOutUrl="/"
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
        </div>
      </nav>
    </header>
  );
}
