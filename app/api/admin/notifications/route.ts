import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { prisma } from '@/lib/db/prisma';
import {
  NotificationChannel,
  NotificationCampaignStatus,
  NotificationPriority,
  NotificationType,
} from '@prisma/client';
import { countAudience, AudienceFilter } from '@/lib/notifications/targeting';

/**
 * GET /api/admin/notifications — lista todas as campanhas
 * POST /api/admin/notifications — cria nova campanha (DRAFT)
 */
export async function GET(req: NextRequest) {
  await requireAdmin();
  const sp = req.nextUrl.searchParams;
  const status = sp.get('status') as NotificationCampaignStatus | null;

  const where = status ? { status } : {};
  const items = await prisma.notificationCampaign.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  const body = await req.json().catch(() => ({}));

  // Validação básica
  const required = ['name', 'type', 'titleTemplate', 'bodyTemplate', 'channels', 'audienceFilter'];
  for (const k of required) {
    if (!body[k]) {
      return NextResponse.json({ error: `${k} é obrigatório` }, { status: 400 });
    }
  }

  const validTypes: NotificationType[] = [
    'INFO', 'ALERT', 'ACHIEVEMENT', 'REMINDER', 'PAYMENT_RECOVERY', 'PROMO', 'CAMPAIGN', 'SYSTEM',
  ];
  if (!validTypes.includes(body.type)) {
    return NextResponse.json({ error: 'type inválido' }, { status: 400 });
  }

  const validChannels: NotificationChannel[] = ['IN_APP', 'PUSH', 'EMAIL'];
  const channels = (body.channels as string[]).filter((c): c is NotificationChannel =>
    validChannels.includes(c as NotificationChannel)
  );
  if (channels.length === 0) {
    return NextResponse.json({ error: 'Pelo menos 1 canal' }, { status: 400 });
  }

  const validPriorities: NotificationPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
  const priority = validPriorities.includes(body.priority) ? body.priority : 'NORMAL';

  // Preview da audiência
  const audienceCount = await countAudience(body.audienceFilter as AudienceFilter);

  const created = await prisma.notificationCampaign.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      type: body.type,
      priority,
      channels,
      vibrate: !!body.vibrate,
      titleTemplate: body.titleTemplate,
      bodyTemplate: body.bodyTemplate,
      iconUrl: body.iconUrl ?? null,
      imageUrl: body.imageUrl ?? null,
      actionUrl: body.actionUrl ?? null,
      actionLabel: body.actionLabel ?? null,
      emailSubjectTemplate: body.emailSubjectTemplate ?? null,
      emailHtmlTemplate: body.emailHtmlTemplate ?? null,
      audienceFilter: body.audienceFilter,
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
      recurring: !!body.recurring,
      recurringKey: body.recurringKey ?? null,
      totalTargeted: audienceCount,
      createdBy: admin.email,
    },
  });

  await prisma.adminAudit.create({
    data: {
      adminEmail: admin.email,
      action: 'campaign_created',
      targetType: 'NotificationCampaign',
      targetId: created.id,
      metadata: { name: created.name, audienceCount },
    },
  });

  return NextResponse.json({ campaign: created, audiencePreview: audienceCount });
}
