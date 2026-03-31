import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import RevisaoClientPage from "./revisao-client";

// Força renderização dinâmica para garantir que ClerkProvider esteja disponível
export const dynamic = 'force-dynamic';

export default async function RevisaoInteligentePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <RevisaoClientPage />;
}
