import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { getOrCreatePreferences } from '@/lib/notifications/service';
import { Header } from '@/components/layout/header';
import { PreferencesForm } from './preferences-form';

export const metadata: Metadata = {
  title: 'Preferências de notificações · Simulai OAB',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function NotificationsSettingsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/login?redirect_url=/configuracoes/notificacoes');

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) redirect('/login');

  const prefs = await getOrCreatePreferences(user.id);

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-ink-1">Notificações</h1>
          <p className="text-ink-2 text-sm mt-1">
            Escolha como e quando você quer ser avisado.
          </p>
        </header>

        <PreferencesForm
          initialPrefs={{
            pushEnabled: prefs.pushEnabled,
            emailEnabled: prefs.emailEnabled,
            promoEnabled: prefs.promoEnabled,
            reminderEnabled: prefs.reminderEnabled,
            achievementEnabled: prefs.achievementEnabled,
            recoveryEnabled: prefs.recoveryEnabled,
            quietHoursStart: prefs.quietHoursStart,
            quietHoursEnd: prefs.quietHoursEnd,
          }}
        />
      </div>
    </div>
  );
}
