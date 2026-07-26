import { Metadata } from "next";
import { ChallengeDetailClient } from "./challenge-detail-client";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Desafio - Simulado com Amigos",
  description: "Visualize e participe de um desafio de simulado",
};

interface PageProps {
  params: Promise<{ code: string }>;
}

// Sem gate de login aqui — a página precisa ser vista por quem NÃO tem
// conta ainda (é o link que o amigo recebeu). O componente cliente decide
// o que mostrar (preview público vs. "criar conta pra participar").
export default async function ChallengeDetailPage({ params }: PageProps) {
  const { code } = await params;

  return <ChallengeDetailClient code={code} />;
}
