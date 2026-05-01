import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { prisma } from '@/lib/db/prisma';
import { runCampaign, cancelCampaign } from '@/lib/notifications/campaigns';

/**
 * POST /api/admin/notifications/:id/dispatch — dispara a campanha agora
 *   body: { action: 'send' | 'cancel' }
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = body?.action ?? 'send';

  if (action === 'cancel') {
    const c = await cancelCampaign(id);
    await prisma.adminAudit.create({
      data: {
        adminEmail: admin.email,
        action: 'campaign_cancelled',
        targetType: 'NotificationCampaign',
        targetId: id,
        metadata: { name: c.name },
      },
    });
    return NextResponse.json({ ok: true, status: c.status });
  }

  if (action !== 'send') {
    return NextResponse.json({ error: 'action inválida' }, { status: 400 });
  }

  try {
    const result = await runCampaign(id);
    await prisma.adminAudit.create({
      data: {
        adminEmail: admin.email,
        action: 'campaign_dispatched',
        targetType: 'NotificationCampaign',
        targetId: id,
        metadata: result as never,
      },
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Erro' },
      { status: 500 }
    );
  }
}
