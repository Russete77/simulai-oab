import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import {
  getOrCreatePreferences,
  updatePreferences,
} from '@/lib/notifications/service';

/**
 * GET /api/notifications/preferences — retorna prefs do user (criando defaults se não existir)
 * PATCH /api/notifications/preferences — atualiza prefs
 */
export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const prefs = await getOrCreatePreferences(user.id);
  return NextResponse.json(prefs);
}

export async function PATCH(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const allowedKeys = [
    'pushEnabled',
    'emailEnabled',
    'promoEnabled',
    'reminderEnabled',
    'achievementEnabled',
    'recoveryEnabled',
    'quietHoursStart',
    'quietHoursEnd',
  ] as const;

  const patch: Record<string, unknown> = {};
  for (const k of allowedKeys) {
    if (k in body) patch[k] = body[k];
  }

  // Validações leves
  for (const k of ['quietHoursStart', 'quietHoursEnd'] as const) {
    if (k in patch) {
      const v = patch[k];
      if (v !== null && (typeof v !== 'number' || v < 0 || v > 23)) {
        return NextResponse.json({ error: `${k} deve ser 0-23 ou null` }, { status: 400 });
      }
    }
  }

  const prefs = await updatePreferences(user.id, patch);
  return NextResponse.json(prefs);
}
