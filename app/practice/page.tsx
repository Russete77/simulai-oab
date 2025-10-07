import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import PracticeClient from "./practice-client";

export default async function PracticePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <PracticeClient />;
}
