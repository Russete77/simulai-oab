import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { listNotifications, countUnread } from '@/lib/notifications/service';
import { Header } from '@/components/layout/header';
import { NotificationsList } from './notifications-list';

export const metadata: Metadata = {
  title: 'Notificações · Simulai OAB',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/login?redirect_url=/notificacoes');

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) redirect('/login');

  const [items, unread] = await Promise.all([
    listNotifications(user.id, { limit: 50 }),
    countUnread(user.id),
  ]);

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <header className="flex items-end justify-between mb-6 flex-wrap gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-ink-1">Notificações</h1>
            <p className="text-ink-2 text-sm mt-1">
              {unread > 0 ? `${unread} não lida${unread > 1 ? 's' : ''}` : 'Tudo em dia'}
            </p>
          </div>
          <a
            href="/configuracoes/notificacoes"
            className="text-sm text-accent hover:text-accent"
          >
            Preferências →
          </a>
        </header>

        <NotificationsList
          initialItems={items.map((n) => ({
            id: n.id,
            type: n.type,
            priority: n.priority,
            title: n.title,
            body: n.body,
            iconUrl: n.iconUrl,
            actionUrl: n.actionUrl,
            actionLabel: n.actionLabel,
            readAt: n.readAt?.toISOString() ?? null,
            createdAt: n.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
