import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SimulationClient from "./simulation-client";
import { prisma } from "@/lib/db/prisma";

export default async function SimulationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;

  const simulation = await prisma.simulation.findUnique({
    where: { id },
    include: {
      questions: {
        include: {
          question: {
            include: {
              alternatives: {
                select: {
                  id: true,
                  label: true,
                  text: true,
                  questionId: true,
                },
              },
            },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!simulation || simulation.userId !== user.id) {
    redirect('/simulations');
  }

  return <SimulationClient simulation={simulation} />;
}
