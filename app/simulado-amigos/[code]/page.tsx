import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
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

export default async function ChallengeDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const { code } = await params;

  return <ChallengeDetailClient code={code} />;
}
