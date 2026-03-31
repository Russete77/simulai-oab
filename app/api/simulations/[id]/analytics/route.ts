import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSimulationAnalytics } from "@/lib/analytics/analytics-service";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Verify simulation belongs to user
    const simulation = await prisma.simulation.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!simulation || simulation.userId !== user.id) {
      return NextResponse.json(
        { error: "Simulação não encontrada" },
        { status: 404 }
      );
    }

    const analytics = await getSimulationAnalytics(id);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching simulation analytics:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados de análise da simulação" },
      { status: 500 }
    );
  }
}
