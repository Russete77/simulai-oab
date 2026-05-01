/**
 * Dispatcher — orquestra entrega multicanal de uma notificação.
 *
 * Fluxo:
 *   1. Cria a Notification na inbox (sempre, independente de canais)
 *   2. Resolve preferências do user (opt-out, quiet hours)
 *   3. Para cada canal habilitado: enviar push e/ou email
 *   4. Atualiza tracking (pushSent/emailSent na Notification)
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import {
  Notification,
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from '@prisma/client';
import {
  createNotification,
  isPushAllowed,
  isEmailAllowed,
  isInQuietHours,
  getOrCreatePreferences,
} from './service';
import { sendPushToUser } from './send-push';
import { resend, emailConfig } from '@/lib/email/config';

export interface DispatchInput {
  userId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  body: string;
  iconUrl?: string;
  imageUrl?: string;
  actionUrl?: string;
  actionLabel?: string;
  channels?: NotificationChannel[]; // default: ['IN_APP']
  vibrate?: boolean;
  campaignId?: string;
  emailSubject?: string;
  emailHtml?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
  /** Se true, ignora quiet hours (ex: alertas críticos) */
  bypassQuietHours?: boolean;
}

export interface DispatchResult {
  notificationId: string;
  inAppDelivered: boolean;
  pushSent: boolean;
  emailSent: boolean;
  reasons: string[]; // motivos de skip por canal
}

/**
 * Dispara uma notificação para um único usuário em todos os canais configurados.
 * Cria a entrada na inbox sempre. Push/email respeitam preferences.
 */
export async function dispatch(input: DispatchInput): Promise<DispatchResult> {
  const channels = input.channels ?? ['IN_APP'];
  const reasons: string[] = [];

  // 1. Cria na inbox (in-app sempre)
  const notif = await createNotification({
    ...input,
    channels,
  });

  let pushSent = false;
  let emailSent = false;

  // 2. Resolve prefs
  const prefs = await getOrCreatePreferences(input.userId);
  const now = new Date();
  const inQuiet = !input.bypassQuietHours && isInQuietHours(now, prefs);

  // 3. PUSH
  if (channels.includes('PUSH')) {
    if (inQuiet && input.priority !== 'URGENT') {
      reasons.push('push:quiet_hours');
    } else if (!isPushAllowed(input.type, prefs)) {
      reasons.push('push:opt_out');
    } else {
      try {
        const sent = await sendPushToUser(input.userId, {
          title: input.title,
          body: input.body,
          icon: input.iconUrl ?? '/icon-192.png',
          url: input.actionUrl ?? '/notificacoes',
          tag: notif.id,
          requireInteraction: input.priority === 'URGENT',
          // vibrate é via service worker — adicionar via metadata
        });
        pushSent = sent > 0;
        if (sent === 0) reasons.push('push:no_subscriptions');
      } catch (e) {
        reasons.push('push:error');
        logger.error('[NOTIF_DISPATCH] push falhou', {
          userId: input.userId,
          notificationId: notif.id,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }

  // 4. EMAIL
  if (channels.includes('EMAIL')) {
    if (!isEmailAllowed(input.type, prefs)) {
      reasons.push('email:opt_out');
    } else if (!resend) {
      reasons.push('email:resend_not_configured');
    } else {
      try {
        const user = await prisma.user.findUnique({
          where: { id: input.userId },
          select: { email: true, name: true },
        });
        if (!user) {
          reasons.push('email:user_not_found');
        } else {
          const subject = input.emailSubject ?? input.title;
          const html =
            input.emailHtml ??
            renderDefaultEmailHtml(input.title, input.body, input.actionUrl, input.actionLabel);

          await resend.emails.send({
            from: emailConfig.from,
            to: user.email,
            replyTo: emailConfig.replyTo,
            subject,
            html,
          });
          emailSent = true;
        }
      } catch (e) {
        reasons.push('email:error');
        logger.error('[NOTIF_DISPATCH] email falhou', {
          userId: input.userId,
          notificationId: notif.id,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }

  // 5. Update tracking
  await prisma.notification.update({
    where: { id: notif.id },
    data: {
      pushSent,
      pushSentAt: pushSent ? new Date() : null,
      emailSent,
      emailSentAt: emailSent ? new Date() : null,
    },
  });

  return {
    notificationId: notif.id,
    inAppDelivered: true,
    pushSent,
    emailSent,
    reasons,
  };
}

/**
 * Dispatch em batch — usado por campaigns. Retorna stats agregadas.
 */
export async function dispatchBatch(
  userIds: string[],
  template: Omit<DispatchInput, 'userId'>,
  options: { batchSize?: number } = {}
): Promise<{
  total: number;
  inApp: number;
  push: number;
  email: number;
  failed: number;
}> {
  const batchSize = options.batchSize ?? 50;
  const stats = { total: userIds.length, inApp: 0, push: 0, email: 0, failed: 0 };

  for (let i = 0; i < userIds.length; i += batchSize) {
    const slice = userIds.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      slice.map((userId) => dispatch({ ...template, userId }))
    );
    for (const r of results) {
      if (r.status === 'fulfilled') {
        stats.inApp++;
        if (r.value.pushSent) stats.push++;
        if (r.value.emailSent) stats.email++;
      } else {
        stats.failed++;
        logger.error('[NOTIF_DISPATCH_BATCH] erro', { reason: r.reason });
      }
    }
  }

  return stats;
}

function renderDefaultEmailHtml(
  title: string,
  body: string,
  actionUrl?: string,
  actionLabel?: string
): string {
  const cta =
    actionUrl && actionLabel
      ? `<div style="text-align:center;margin:32px 0;">
          <a href="${actionUrl}" style="display:inline-block;background:linear-gradient(to right,#3B82F6,#8B5CF6);color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">${actionLabel}</a>
        </div>`
      : '';

  return `
    <!DOCTYPE html>
    <html>
      <body style="background-color:#0F172A;font-family:sans-serif;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background-color:#1E293B;border-radius:12px;padding:32px;">
          <h1 style="color:#FFFFFF;font-size:24px;margin-bottom:16px;">${escapeHtml(title)}</h1>
          <div style="color:#E2E8F0;font-size:16px;line-height:24px;">${body}</div>
          ${cta}
          <p style="color:#94A3B8;font-size:12px;margin-top:32px;text-align:center;">
            Você está recebendo isto porque assinou notificações do Simulai OAB.
            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://simulaioab.com'}/configuracoes/notificacoes" style="color:#60A5FA;">Gerenciar preferências</a>.
          </p>
        </div>
      </body>
    </html>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
