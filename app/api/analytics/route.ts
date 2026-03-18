import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getUserAnalytics } from "@/lib/analytics/analytics-service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const analytics = await getUserAnalytics(user.id);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados de análise" },
      { status: 500 }
    );
  }
}
