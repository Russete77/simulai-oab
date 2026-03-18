import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function MeuPerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  redirect(`/perfil/${user.id}`);
}
