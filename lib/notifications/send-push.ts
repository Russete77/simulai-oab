/**
 * Server-side push notification sender
 * Usa web-push para enviar notificações para subscribers
 *
 * Para usar em cron jobs ou eventos do servidor:
 *   import { sendPushToUser, sendStudyReminder } from '@/lib/notifications/send-push';
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
  actions?: Array<{ action: string; title: string }>;
  requireInteraction?: boolean;
}

/**
 * Envia push notification para todas as subscriptions de um usuário
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  try {
    // Importar web-push dinamicamente (não disponível no edge runtime)
    const webpush = await import('web-push');

    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublic || !vapidPrivate) {
      logger.warn('VAPID keys not configured — skipping push notification');
      return 0;
    }

    webpush.setVapidDetails(
      'mailto:contato@simulaioab.com',
      vapidPublic,
      vapidPrivate
    );

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return 0;
    }

    let sent = 0;
    const expired: string[] = [];

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify(payload)
        );
        sent++;
      } catch (error: any) {
        // 410 Gone or 404 — subscription expired
        if (error?.statusCode === 410 || error?.statusCode === 404) {
          expired.push(sub.id);
        } else {
          logger.error('Push send error', {
            userId,
            endpoint: sub.endpoint.substring(0, 50),
            error: error?.message,
          });
        }
      }
    }

    // Limpar subscriptions expiradas
    if (expired.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { id: { in: expired } },
      });
      logger.info('Cleaned expired push subscriptions', { count: expired.length });
    }

    logger.info('Push notifications sent', { userId, sent, total: subscriptions.length });
    return sent;
  } catch (error) {
    logger.error('sendPushToUser error', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return 0;
  }
}

/**
 * Envia lembrete de estudo para um usuário
 */
export async function sendStudyReminder(userId: string): Promise<number> {
  return sendPushToUser(userId, {
    title: 'Hora de estudar! ',
    body: 'Não perca sua sequência! Complete pelo menos 5 questões hoje.',
    url: '/practice',
    tag: 'study-reminder',
    actions: [
      { action: 'practice', title: 'Praticar' },
      { action: 'review', title: 'Revisar' },
    ],
  });
}

/**
 * Envia lembrete de revisão SRS para um usuário
 */
export async function sendReviewReminder(userId: string, dueCount: number): Promise<number> {
  return sendPushToUser(userId, {
    title: 'Revisão pendente',
    body: `Você tem ${dueCount} questões para revisar hoje. A revisão espaçada é essencial para fixar o conteúdo!`,
    url: '/revisao-inteligente',
    tag: 'review-reminder',
    actions: [
      { action: 'review', title: 'Revisar agora' },
    ],
  });
}
