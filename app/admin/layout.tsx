import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/auth';
import { AdminSidebar } from './_components/admin-sidebar';

export const metadata: Metadata = {
  title: 'Admin · Simulai OAB',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-bg">
      <div className="flex">
        <AdminSidebar email={admin.email} />
        <main className="flex-1 min-w-0 px-6 py-8 md:px-10 md:py-10 max-w-[1800px]">
          {children}
        </main>
      </div>
    </div>
  );
}
