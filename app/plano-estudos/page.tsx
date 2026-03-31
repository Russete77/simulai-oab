import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import PlanoEstudosClient from "./plano-estudos-client";

// Força renderização dinâmica para garantir que ClerkProvider esteja disponível
export const dynamic = 'force-dynamic';

export default async function PlanoEstudosPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <PlanoEstudosClient />;
}
