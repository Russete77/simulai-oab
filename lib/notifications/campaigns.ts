/**
 * Campaign engine — pega NotificationCampaign do banco, resolve audiência,
 * dispara em batch e atualiza stats.
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { NotificationCampaign } from '@prisma/client';
import { dispatch } from './dispatcher';
import { resolveAudience, renderTemplate, AudienceFilter } from './targeting';

export interface RunCampaignResult {
  campaignId: string;
  totalTargeted: number;
  totalSent: number;
  totalFailed: number;
  durationMs: number;
}

/**
 * Executa campanha por ID. Idempotente em recurring (verifica recurringKey).
 * Atualiza stats no banco.
 */
export async function runCampaign(campaignId: string): Promise<RunCampaignResult> {
  const start = Date.now();
  const campaign = await prisma.notificationCampaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) {
    throw new Error(`Campaign ${campaignId} não encontrada`);
  }
  if (campaign.status === 'SENDING') {
    throw new Error(`Campaign ${campaignId} já está em SENDING`);
  }
  if (campaign.status === 'CANCELED') {
    throw new Error(`Campaign ${campaignId} foi cancelada`);
  }

  await prisma.notificationCampaign.update({
    where: { id: campaignId },
    data: { status: 'SENDING' },
  });

  try {
    const filter = (campaign.audienceFilter as unknown) as AudienceFilter;
    const userIds = await resolveAudience(filter);

    logger.info('[CAMPAIGN] dispatch iniciado', {
      campaignId,
      name: campaign.name,
      audience: userIds.length,
    });

    let sent = 0;
    let failed = 0;

    // Resolver dados pra render: pega name/email em batch
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Dispatch em chunks de 50
    const chunkSize = 50;
    for (let i = 0; i < userIds.length; i += chunkSize) {
      const chunk = userIds.slice(i, i + chunkSize);
      const results = await Promise.allSettled(
        chunk.map((uid) => {
          const u = userMap.get(uid);
          if (!u) return Promise.reject(new Error('user not found'));

          const title = renderTemplate(campaign.titleTemplate, {
            name: u.name,
            email: u.email,
          });
          const body = renderTemplate(campaign.bodyTemplate, {
            name: u.name,
            email: u.email,
          });
          const emailSubject = campaign.emailSubjectTemplate
            ? renderTemplate(campaign.emailSubjectTemplate, { name: u.name, email: u.email })
            : title;
          const emailHtml = campaign.emailHtmlTemplate
            ? renderTemplate(campaign.emailHtmlTemplate, { name: u.name, email: u.email })
            : undefined;

          return dispatch({
            userId: uid,
            type: campaign.type,
            priority: campaign.priority,
            title,
            body,
            iconUrl: campaign.iconUrl ?? undefined,
            imageUrl: campaign.imageUrl ?? undefined,
            actionUrl: campaign.actionUrl ?? undefined,
            actionLabel: campaign.actionLabel ?? undefined,
            channels: campaign.channels,
            vibrate: campaign.vibrate,
            campaignId: campaign.id,
            emailSubject,
            emailHtml,
          });
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled') sent++;
        else {
          failed++;
          logger.warn('[CAMPAIGN] dispatch item falhou', { reason: r.reason });
        }
      }
    }

    await prisma.notificationCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        totalTargeted: userIds.length,
        totalSent: sent,
        totalFailed: failed,
      },
    });

    return {
      campaignId,
      totalTargeted: userIds.length,
      totalSent: sent,
      totalFailed: failed,
      durationMs: Date.now() - start,
    };
  } catch (error) {
    await prisma.notificationCampaign.update({
      where: { id: campaignId },
      data: { status: 'FAILED' },
    });
    throw error;
  }
}

/**
 * Roda todas as campanhas recurring que devem disparar agora.
 * Identificadas pela `recurringKey` — cada uma roda 1x por dia (controlado pelo cron schedule).
 */
export async function runRecurringCampaigns(): Promise<RunCampaignResult[]> {
  const recurring = await prisma.notificationCampaign.findMany({
    where: {
      recurring: true,
      status: { in: ['DRAFT', 'SENT', 'SCHEDULED'] },
    },
  });

  const results: RunCampaignResult[] = [];
  for (const c of recurring) {
    try {
      const r = await runCampaign(c.id);
      results.push(r);
    } catch (e) {
      logger.error('[CAMPAIGN] recurring falhou', {
        campaignId: c.id,
        name: c.name,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return results;
}

/**
 * Cancela campanha agendada.
 */
export async function cancelCampaign(campaignId: string): Promise<NotificationCampaign> {
  return prisma.notificationCampaign.update({
    where: { id: campaignId },
    data: { status: 'CANCELED', cancelledAt: new Date() },
  });
}
