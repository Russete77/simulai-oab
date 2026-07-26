import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

const ALLOWED_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "landingPath", "capturedAt"];

/**
 * POST /api/analytics/attribution
 * Persiste a atribuição UTM de primeiro toque (cookie client-side) no User,
 * uma única vez — se já tiver algo salvo, ignora (first-touch de verdade,
 * não sobrescreve com uma visita/campanha posterior).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Já tem atribuição salva — não sobrescreve (first-touch).
    if (user.acquisitionUtm) {
      return NextResponse.json({ ok: true, skipped: "already_set" });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const sanitized: Record<string, string> = {};
    for (const key of ALLOWED_KEYS) {
      const value = (body as Record<string, unknown>)[key];
      if (typeof value === "string" && value.length <= 200) {
        sanitized[key] = value;
      }
    }

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json({ ok: true, skipped: "empty" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { acquisitionUtm: sanitized },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("attribution route error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
