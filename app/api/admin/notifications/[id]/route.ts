import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/admin/notifications/:id — detalhes da campanha + amostra de notificações
 * DELETE /api/admin/notifications/:id — apaga (apenas DRAFT)
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await ctx.params;

  const campaign = await prisma.notificationCampaign.findUnique({
    where: { id },
  });
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const recentNotifications = await prisma.notification.findMany({
    where: { campaignId: id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { user: { select: { email: true, name: true } } },
  });

  return NextResponse.json({
    campaign,
    recentNotifications: recentNotifications.map((n) => ({
      id: n.id,
      userEmail: n.user.email,
      userName: n.user.name,
      readAt: n.readAt,
      pushSent: n.pushSent,
      emailSent: n.emailSent,
      createdAt: n.createdAt,
    })),
  });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  const { id } = await ctx.params;

  const campaign = await prisma.notificationCampaign.findUnique({
    where: { id },
    select: { status: true, name: true },
  });
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (campaign.status !== 'DRAFT') {
    return NextResponse.json(
      { error: 'Só pode apagar campanhas DRAFT' },
      { status: 400 }
    );
  }

  await prisma.notificationCampaign.delete({ where: { id } });
  await prisma.adminAudit.create({
    data: {
      adminEmail: admin.email,
      action: 'campaign_deleted',
      targetType: 'NotificationCampaign',
      targetId: id,
      metadata: { name: campaign.name },
    },
  });

  return NextResponse.json({ ok: true });
}
