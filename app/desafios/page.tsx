import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { DesafiosClient } from "./desafios-client";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Desafios Semanais - Simulai",
  description: "Desafios semanais para melhorar sua preparação para a OAB",
};

export default async function DesafiosPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <DesafiosClient />;
}
