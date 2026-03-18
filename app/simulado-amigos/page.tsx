import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { SimuladoAmigosClient } from "./simulado-amigos-client";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Simulado com Amigos - Simulai",
  description: "Crie desafios e compare resultados com seus amigos",
};

export default async function SimuladoAmigosPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <SimuladoAmigosClient />;
}
