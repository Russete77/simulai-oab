import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { FlashcardsClient } from "./flashcards-client";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Flashcards OAB - Simulai",
  description: "Estude com flashcards interativos gerados de questões reais da OAB",
};

export default async function FlashcardsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <FlashcardsClient />;
}
