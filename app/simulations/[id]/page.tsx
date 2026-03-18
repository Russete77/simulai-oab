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

  // OTIMIZAÇÃO: Buscar apenas informações básicas + IDs das questões
  // Questões individuais serão carregadas sob demanda no client
  const simulation = await prisma.simulation.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      type: true,
      status: true,
      totalQuestions: true,
      score: true,
      timeSpent: true,
      subjects: true,
      targetDifficulty: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
      questions: {
        select: {
          id: true,
          questionId: true,
          order: true,
          question: {
            select: {
              id: true,
              examId: true,
              examYear: true,
              examPhase: true,
              questionNumber: true,
              subject: true,
              statement: true,
              explanation: true,
              nullified: true,
              alternatives: {
                select: {
                  id: true,
                  label: true,
                  text: true,
                  isCorrect: true,
                },
                orderBy: { label: 'asc' },
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
