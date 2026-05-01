/**
 * Endpoint de heartbeat de sessão ativa.
 *
 * O frontend bate aqui a cada ~60s quando o usuário está autenticado E a aba
 * está visível. Cada batida:
 *  - cria uma UserSession nova se a última sessão do user foi há mais de 10min
 *  - senão atualiza a existente: lastHeartbeatAt, durationSec, exitPath, pageViews
 *
 * Também atualiza User.lastActiveAt e User.totalSessionMinutes.
 * Idempotente e cheap — pode rodar em background sem UI.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';

// Sessão expira após 10 min sem heartbeat → começa nova
const SESSION_IDLE_MS = 10 * 60 * 1000;
// Cap de duração por heartbeat pra não inflar caso aba fique aberta toda a noite
const MAX_DELTA_SEC = 120;

const BodySchema = z.object({
  currentPath: z.string().max(500).optional(),
  clerkSessionId: z.string().max(200).optional(),
  firstOfSession: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }

    const body = BodySchema.parse(await req.json().catch(() => ({})));

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ ok: true, skipped: 'no_db_user' });
    }

    const now = new Date();

    // Ver última sessão do user
    const last = await prisma.userSession.findFirst({
      where: { userId: user.id },
      orderBy: { lastHeartbeatAt: 'desc' },
    });

    const expired =
      !last ||
      now.getTime() - new Date(last.lastHeartbeatAt).getTime() > SESSION_IDLE_MS;

    const ua = req.headers.get('user-agent') ?? null;
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      null;
    // Vercel headers (sem custo extra)
    const country = req.headers.get('x-vercel-ip-country') ?? null;
    const city = req.headers.get('x-vercel-ip-city')
      ? decodeURIComponent(req.headers.get('x-vercel-ip-city')!)
      : null;

    let sessionDeltaSec = 0;

    if (expired) {
      // Nova sessão
      await prisma.$transaction([
        prisma.userSession.create({
          data: {
            userId: user.id,
            clerkSessionId: body.clerkSessionId ?? null,
            startedAt: now,
            lastHeartbeatAt: now,
            durationSec: 0,
            pageViews: 1,
            entryPath: body.currentPath ?? null,
            exitPath: body.currentPath ?? null,
            userAgent: ua,
            ipAddress: ip,
            country,
            city,
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            lastActiveAt: now,
            totalLogins: { increment: body.firstOfSession ? 1 : 0 },
          },
        }),
      ]);
      return NextResponse.json({ ok: true, newSession: true });
    }

    // Extensão da sessão existente
    const prevHeartbeat = new Date(last.lastHeartbeatAt).getTime();
    const rawDelta = Math.floor((now.getTime() - prevHeartbeat) / 1000);
    sessionDeltaSec = Math.min(MAX_DELTA_SEC, Math.max(0, rawDelta));

    const pageChanged =
      body.currentPath && body.currentPath !== last.exitPath ? 1 : 0;

    await prisma.$transaction([
      prisma.userSession.update({
        where: { id: last.id },
        data: {
          lastHeartbeatAt: now,
          durationSec: { increment: sessionDeltaSec },
          pageViews: { increment: pageChanged },
          exitPath: body.currentPath ?? last.exitPath,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          lastActiveAt: now,
          totalSessionMinutes: sessionDeltaSec
            ? { increment: Math.round(sessionDeltaSec / 60) }
            : undefined,
        },
      }),
    ]);

    return NextResponse.json({ ok: true, sessionId: last.id, deltaSec: sessionDeltaSec });
  } catch (err) {
    console.error('[heartbeat] erro', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'internal' },
      { status: 500 }
    );
  }
}
