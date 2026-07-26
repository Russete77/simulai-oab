/**
 * Admin authentication — gate server-side via email do Clerk.
 *
 * Configure em Vercel env vars:
 *   ADMIN_EMAILS=erickrussomat@gmail.com,outro@email.com
 *
 * Uso:
 *   const admin = await requireAdmin();   // redirect se não for admin
 *   const admin = await getAdminOrNull(); // não redireciona
 */

import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';

export interface AdminContext {
  clerkId: string;
  email: string;
}

export function getAdminEmails(): string[] {
  // Sem fallback hardcoded: se ADMIN_EMAILS não estiver configurada num
  // ambiente (ex: preview), o correto é falhar fechado (ninguém é admin),
  // não conceder acesso automático a um email fixo no código.
  const raw = process.env.ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

/**
 * Pega user autenticado e valida se é admin. Redireciona pra home se não for.
 * Use em Server Components dentro de /admin/*.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const { userId } = await auth();
  if (!userId) redirect('/login?redirect_url=/admin');

  const user = await currentUser();
  const email = user?.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;

  if (!isAdminEmail(email)) {
    redirect('/');
  }

  return { clerkId: userId, email: email! };
}

/**
 * Versão que NÃO redireciona — útil pra esconder botões condicionalmente.
 */
export async function getAdminOrNull(): Promise<AdminContext | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const email = user?.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;

  if (!isAdminEmail(email)) return null;
  return { clerkId: userId, email: email! };
}
