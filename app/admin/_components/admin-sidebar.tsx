'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Mail,
  Shield,
  FileText,
  LogOut,
  ArrowLeft,
  Repeat,
  Bell,
  Palette,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Usuários', icon: Users },
  { href: '/admin/subscriptions', label: 'Assinaturas', icon: Repeat },
  { href: '/admin/payments', label: 'Pagamentos', icon: CreditCard },
  { href: '/admin/notifications', label: 'Notificações', icon: Bell },
  { href: '/admin/campaigns', label: 'Emails', icon: Mail },
  { href: '/admin/challenges', label: 'Desafios', icon: Trophy },
  { href: '/admin/audit', label: 'Audit Log', icon: FileText },
  { href: '/admin/design', label: 'Design', icon: Palette },
];

interface AdminSidebarProps {
  email: string;
}

export function AdminSidebar({ email }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen w-64 shrink-0 bg-surface border-r flex flex-col">
      <div className="px-5 py-5 border-b">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs text-ink-3 hover:text-ink-1 transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar ao app
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-accent-soft flex items-center justify-center">
            <Shield className="w-4 h-4 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-1 truncate">Admin</p>
            <p className="text-[11px] text-ink-3 truncate">{email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-accent-soft text-accent'
                  : 'text-ink-2 hover:text-ink-1 hover:bg-surface-2'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-ink-3 hover:text-ink-1 hover:bg-surface-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair do modo admin
        </Link>
      </div>
    </aside>
  );
}
