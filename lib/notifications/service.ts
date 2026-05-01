/**
 * Notification service — coordena criação e tracking de notificações.
 *
 * Camadas:
 *   - service.ts (este arquivo): CRUD de notificações na inbox do user
 *   - dispatcher.ts: orquestra entrega multicanal (push + email + in-app)
 *   - campaigns.ts: lógica de campanha (audience, dispatch em batch)
 *   - send-push.ts: envio web push (pré-existente)
 */

import { prisma } from '@/lib/db/prisma';
import {
  Notification,
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from '@prisma/client';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  body: string;
  iconUrl?: string;
  imageUrl?: string;
  actionUrl?: string;
  actionLabel?: string;
  channels?: NotificationChannel[];
  vibrate?: boolean;
  campaignId?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

/**
 * Cria notificação na inbox. Não dispara push/email — use dispatcher.
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification> {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      priority: input.priority ?? 'NORMAL',
      title: input.title,
      body: input.body,
      iconUrl: input.iconUrl,
      imageUrl: input.imageUrl,
      actionUrl: input.actionUrl,
      actionLabel: input.actionLabel,
      channels: input.channels ?? ['IN_APP'],
      vibrate: input.vibrate ?? input.priority === 'URGENT',
      campaignId: input.campaignId,
      metadata: input.metadata as never,
      expiresAt: input.expiresAt,
    },
  });
}

/**
 * Lista notificações da inbox de um user.
 * Default: não-expiradas, ordenadas mais recentes primeiro.
 */
export async function listNotifications(
  userId: string,
  options: {
    limit?: number;
    cursor?: string;
    onlyUnread?: boolean;
    includeExpired?: boolean;
  } = {}
) {
  const limit = Math.min(50, options.limit ?? 20);
  const now = new Date();

  return prisma.notification.findMany({
    where: {
      userId,
      ...(options.onlyUnread ? { readAt: null } : {}),
      ...(options.includeExpired
        ? {}
        : { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }),
      dismissedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1, // +1 pra detectar nextCursor
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  });
}

/**
 * Conta notificações não-lidas (pra badge no sino).
 */
export async function countUnread(userId: string): Promise<number> {
  const now = new Date();
  return prisma.notification.count({
    where: {
      userId,
      readAt: null,
      dismissedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });
}

/**
 * Marca uma notificação como lida.
 */
export async function markRead(
  notificationId: string,
  userId: string
): Promise<{ ok: boolean }> {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  });

  if (result.count > 0) {
    // Incrementar stat na campanha se existir
    const notif = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { campaignId: true },
    });
    if (notif?.campaignId) {
      await prisma.notificationCampaign.update({
        where: { id: notif.campaignId },
        data: { totalRead: { increment: 1 } },
      });
    }
  }

  return { ok: result.count > 0 };
}

/**
 * Marca todas como lidas.
 */
export async function markAllRead(userId: string): Promise<{ count: number }> {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null, dismissedAt: null },
    data: { readAt: new Date() },
  });
  return { count: result.count };
}

/**
 * Dismiss (esconde da inbox sem apagar).
 */
export async function dismiss(
  notificationId: string,
  userId: string
): Promise<{ ok: boolean }> {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { dismissedAt: new Date() },
  });
  return { ok: result.count > 0 };
}

/**
 * Marca click (analytics + redireciona via actionUrl no client).
 */
export async function markClicked(
  notificationId: string,
  userId: string
): Promise<{ ok: boolean; actionUrl: string | null }> {
  const notif = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
    select: { actionUrl: true, campaignId: true, readAt: true },
  });

  if (!notif) return { ok: false, actionUrl: null };

  // Marcar como read se ainda não foi
  if (!notif.readAt) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  // Incrementar click stat na campanha
  if (notif.campaignId) {
    await prisma.notificationCampaign.update({
      where: { id: notif.campaignId },
      data: { totalClicked: { increment: 1 } },
    });
  }

  return { ok: true, actionUrl: notif.actionUrl };
}

/**
 * Pega ou cria preferences default.
 */
export async function getOrCreatePreferences(userId: string) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

/**
 * Atualiza preferences. Validação leve.
 */
export async function updatePreferences(
  userId: string,
  patch: Partial<{
    pushEnabled: boolean;
    emailEnabled: boolean;
    promoEnabled: boolean;
    reminderEnabled: boolean;
    achievementEnabled: boolean;
    recoveryEnabled: boolean;
    quietHoursStart: number | null;
    quietHoursEnd: number | null;
  }>
) {
  await getOrCreatePreferences(userId);
  return prisma.notificationPreference.update({
    where: { userId },
    data: patch,
  });
}

/**
 * Determina se um tipo respeitando preferences pode ser enviado por push.
 */
export function isPushAllowed(
  type: NotificationType,
  prefs: { pushEnabled: boolean; promoEnabled: boolean; reminderEnabled: boolean; achievementEnabled: boolean; recoveryEnabled: boolean }
): boolean {
  if (!prefs.pushEnabled) return false;
  if (type === 'PROMO' && !prefs.promoEnabled) return false;
  if (type === 'REMINDER' && !prefs.reminderEnabled) return false;
  if (type === 'ACHIEVEMENT' && !prefs.achievementEnabled) return false;
  if (type === 'PAYMENT_RECOVERY' && !prefs.recoveryEnabled) return false;
  return true;
}

export function isEmailAllowed(
  type: NotificationType,
  prefs: { emailEnabled: boolean; promoEnabled: boolean; reminderEnabled: boolean; achievementEnabled: boolean; recoveryEnabled: boolean }
): boolean {
  if (!prefs.emailEnabled) return false;
  if (type === 'PROMO' && !prefs.promoEnabled) return false;
  if (type === 'REMINDER' && !prefs.reminderEnabled) return false;
  if (type === 'ACHIEVEMENT' && !prefs.achievementEnabled) return false;
  if (type === 'PAYMENT_RECOVERY' && !prefs.recoveryEnabled) return false;
  return true;
}

/**
 * Verifica quiet hours (não enviar push entre N e M horas, hora local server).
 */
export function isInQuietHours(
  now: Date,
  prefs: { quietHoursStart: number | null; quietHoursEnd: number | null }
): boolean {
  if (prefs.quietHoursStart === null || prefs.quietHoursEnd === null) return false;
  const h = now.getHours();
  const start = prefs.quietHoursStart;
  const end = prefs.quietHoursEnd;
  if (start === end) return false;
  if (start < end) return h >= start && h < end; // ex: 8-22
  return h >= start || h < end; // ex: 22-8 (cross midnight)
}
