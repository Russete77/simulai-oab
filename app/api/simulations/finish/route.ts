import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requirePaidUser, handlePaymentRequired } from "@/lib/auth";
import { FinishSimulationSchema } from "@/lib/validations/simulation";
import type { SimulationReportResponse } from "@/types/api";

export async function POST(request: NextRequest) {
  try {
    const user = await requirePaidUser();
    const body = await request.json();

    // Validar dados
    const parsed = FinishSimulationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // P1 FIX: Reduzir nesting de 4 para 2 níveis — não precisa de alternatives
    // P1 FIX: Buscar answers separadamente e usar Map para O(1) lookup
    const [simulation, answers] = await Promise.all([
      prisma.simulation.findUnique({
        where: { id: data.simulationId },
        include: {
          questions: {
            include: {
              question: {
                select: { id: true, subject: true }, // SEM alternatives — não são usadas aqui
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      }),
      prisma.userAnswer.findMany({
        where: { simulationId: data.simulationId },
        select: { questionId: true, isCorrect: true, timeSpent: true },
      }),
    ]);

    if (!simulation) {
      return NextResponse.json(
        { error: "Simulado não encontrado" },
        { status: 404 }
      );
    }

    if (simulation.userId !== user.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      );
    }

    if (simulation.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Simulado já finalizado" },
        { status: 400 }
      );
    }

    // Calcular score e tempo total
    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    const score = (correctAnswers / simulation.totalQuestions) * 100;
    const timeSpent = answers.reduce((sum, a) => sum + a.timeSpent, 0);

    // Atualizar simulado
    await prisma.simulation.update({
      where: { id: data.simulationId },
      data: {
        status: "COMPLETED",
        score,
        timeSpent,
        completedAt: new Date(),
      },
    });

    // P1 FIX: Usar Map para lookup O(1) ao invés de .find() O(n) em loop
    const answerMap = new Map(
      answers.map((a) => [a.questionId, a])
    );

    // Calcular estatísticas por matéria
    const bySubject = new Map<
      string,
      { total: number; correct: number }
    >();

    for (const simQuestion of simulation.questions) {
      const subject = simQuestion.question.subject;
      const answer = answerMap.get(simQuestion.questionId);

      if (!bySubject.has(subject)) {
        bySubject.set(subject, { total: 0, correct: 0 });
      }

      const stats = bySubject.get(subject)!;
      stats.total += 1;

      if (answer?.isCorrect) {
        stats.correct += 1;
      }
    }

    const bySubjectArray = Array.from(bySubject.entries()).map(
      ([subject, stats]) => ({
        subject: subject as any,
        accuracy: (stats.correct / stats.total) * 100,
        total: stats.total,
        correct: stats.correct,
      })
    );

    // Identificar áreas fracas (< 60% de acerto)
    const weakAreas = bySubjectArray
      .filter((s) => s.accuracy < 60)
      .map((s) => s.subject);

    // Gerar recomendações
    const recommendations: string[] = [];

    if (score < 50) {
      recommendations.push("Reforce os conceitos básicos de todas as matérias");
    } else if (score < 75) {
      recommendations.push("Você está no caminho certo! Continue praticando");
    } else {
      recommendations.push("Excelente desempenho! Mantenha o ritmo");
    }

    if (weakAreas.length > 0) {
      recommendations.push(
        `Foque nos estudos de: ${weakAreas.slice(0, 3).join(", ")}`
      );
    }

    const response: SimulationReportResponse = {
      simulationId: simulation.id,
      score: Math.round(score * 10) / 10,
      totalQuestions: simulation.totalQuestions,
      correctAnswers,
      timeSpent,
      bySubject: bySubjectArray,
      weakAreas,
      recommendations,
    };

    return NextResponse.json(response);
  } catch (error) {
    const paymentResp = handlePaymentRequired(error);
    if (paymentResp) return paymentResp;

    console.error("Error finishing simulation:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erro ao finalizar simulado" },
      { status: 500 }
    );
  }
}
