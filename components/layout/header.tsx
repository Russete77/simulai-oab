'use client';

import Link from 'next/link';
import { signOut } from '@/app/(auth)/actions';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  showLogout?: boolean;
}

export function Header({ showLogout = true }: HeaderProps) {
  return (
    <div className="border-b border-navy-800 bg-navy-900/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center">
            <img
              src="/logo.png"
              alt="Simulai OAB"
              className="h-14 w-auto hover:opacity-80 transition-opacity"
            />
          </Link>

          {showLogout && (
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-navy-800/50 border border-navy-700 rounded-xl text-navy-400 hover:text-white hover:border-navy-600 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
