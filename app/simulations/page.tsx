import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SimulationsClient from "./simulations-client";

export default async function SimulationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <SimulationsClient />;
}
