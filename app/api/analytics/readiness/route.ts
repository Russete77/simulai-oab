import { NextResponse } from "next/server";
import { requirePaidUserOrDiagnostic, handlePaymentRequired } from "@/lib/auth";
import { computeReadiness } from "@/lib/readiness/score";
import { createError } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * GET /api/analytics/readiness
 * Estimativa de aprovação na 1ª fase (Readiness Score).
 * Acessível também ao usuário do simulado diagnóstico — é o gancho de conversão.
 */
export async function GET() {
  try {
    const { user } = await requirePaidUserOrDiagnostic();

    const readiness = await computeReadiness(user.id);

    return NextResponse.json(readiness);
  } catch (error) {
    const paymentResp = handlePaymentRequired(error);
    if (paymentResp) return paymentResp;

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(createError("UNAUTHORIZED").toJSON(), { status: 401 });
    }

    logger.error("Error computing readiness", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(createError("DATABASE_ERROR").toJSON(), { status: 500 });
  }
}
