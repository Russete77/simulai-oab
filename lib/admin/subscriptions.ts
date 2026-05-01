/**
 * Queries de subscriptions para o admin.
 * Lista, detalhe, ações (cancel, extend trial).
 */

import { Prisma, SubscriptionStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export interface AdminSubscriptionListFilters {
  search?: string;
  status?: SubscriptionStatus | 'ALL';
  plan?: 'ALL' | 'BASIC_MONTHLY' | 'PRO_MONTHLY';
  page?: number;
  pageSize?: number;
}

export interface AdminSubscriptionRow {
  id: string;
  asaasSubscriptionId: string | null;
  plan: string;
  status: SubscriptionStatus;
  value: number;
  startDate: Date;
  trialEnd: Date | null;
  currentPeriodEnd: Date | null;
  canceledAt: Date | null;
  cancelAtPeriodEnd: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

export interface AdminSubscriptionListResult {
  rows: AdminSubscriptionRow[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listAdminSubscriptions(
  f: AdminSubscriptionListFilters = {}
): Promise<AdminSubscriptionListResult> {
  const page = Math.max(1, f.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, f.pageSize ?? 25));
  const skip = (page - 1) * pageSize;

  const where: Prisma.SubscriptionWhereInput = {};

  if (f.status && f.status !== 'ALL') {
    where.status = f.status;
  }

  if (f.plan && f.plan !== 'ALL') {
    where.plan = f.plan;
  }

  if (f.search && f.search.trim()) {
    const q = f.search.trim();
    where.customer = {
      user: {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      },
    };
  }

  const [total, rows] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          include: {
            user: { select: { id: true, email: true, name: true } },
          },
        },
      },
    }),
  ]);

  return {
    total,
    page,
    pageSize,
    rows: rows.map((s) => ({
      id: s.id,
      asaasSubscriptionId: s.asaasSubscriptionId,
      plan: s.plan,
      status: s.status,
      value: s.value,
      startDate: s.startDate,
      trialEnd: s.trialEnd,
      currentPeriodEnd: s.currentPeriodEnd,
      canceledAt: s.canceledAt,
      cancelAtPeriodEnd: s.cancelAtPeriodEnd,
      user: s.customer.user
        ? {
            id: s.customer.user.id,
            email: s.customer.user.email,
            name: s.customer.user.name,
          }
        : null,
    })),
  };
}

export interface SubscriptionStatusBreakdown {
  status: SubscriptionStatus;
  count: number;
  totalValueBRL: number;
}

/**
 * Distribuição por status (KPIs no topo da página subscriptions).
 */
export async function getSubscriptionsBreakdown(): Promise<SubscriptionStatusBreakdown[]> {
  const rows = await prisma.subscription.groupBy({
    by: ['status'],
    _count: true,
    _sum: { value: true },
  });

  return rows.map((r) => ({
    status: r.status,
    count: r._count,
    totalValueBRL: r._sum.value ?? 0,
  }));
}

// ============================================================================
// AÇÕES ADMIN — todas gravam AdminAudit
// ============================================================================

export interface AdminActionResult {
  ok: boolean;
  message: string;
}

/**
 * Liberar acesso por N dias (cortesia/grace period).
 * Útil quando o user reclama, perdeu prazo de pagamento, etc.
 * Define status=ACTIVE com currentPeriodEnd=now+Nd. Quando o período acabar, o cron
 * de reconcile (ou webhook) vai atualizar o estado de acordo com Asaas.
 *
 * IMPORTANTE: cobrança não acontece. É liberação manual.
 */
export async function grantGracePeriod(
  subscriptionId: string,
  days: number,
  adminEmail: string,
  ipAddress?: string
): Promise<AdminActionResult> {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { customer: { include: { user: true } } },
  });

  if (!sub) return { ok: false, message: 'Subscription não encontrada' };

  if (sub.status === 'ACTIVE') {
    return {
      ok: false,
      message: 'Subscription já está ativa — não precisa de cortesia',
    };
  }

  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + days);

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        canceledAt: null,
      },
    }),
    prisma.adminAudit.create({
      data: {
        adminEmail,
        action: 'grant_grace_period',
        targetType: 'Subscription',
        targetId: subscriptionId,
        ipAddress,
        metadata: {
          previousStatus: sub.status,
          newPeriodEnd: periodEnd.toISOString(),
          daysGranted: days,
          userEmail: sub.customer.user.email,
        },
      },
    }),
  ]);

  logger.warn('[ADMIN] Cortesia liberada (sem cobrança)', {
    subscriptionId,
    days,
    periodEnd: periodEnd.toISOString(),
    adminEmail,
  });

  return {
    ok: true,
    message: `Acesso liberado por ${days} dias até ${periodEnd.toLocaleDateString('pt-BR')}`,
  };
}

/**
 * Cancela subscription manualmente. Não chama Asaas (admin assume responsabilidade).
 */
export async function cancelSubscriptionAdmin(
  subscriptionId: string,
  reason: string,
  adminEmail: string,
  ipAddress?: string
): Promise<AdminActionResult> {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { customer: { include: { user: true } } },
  });

  if (!sub) return { ok: false, message: 'Subscription não encontrada' };

  if (sub.status === 'CANCELED') {
    return { ok: false, message: 'Subscription já está cancelada' };
  }

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    }),
    prisma.adminAudit.create({
      data: {
        adminEmail,
        action: 'cancel_subscription',
        targetType: 'Subscription',
        targetId: subscriptionId,
        ipAddress,
        metadata: {
          previousStatus: sub.status,
          reason,
          asaasSubscriptionId: sub.asaasSubscriptionId,
          userEmail: sub.customer.user.email,
        },
      },
    }),
  ]);

  logger.warn('[ADMIN] Subscription cancelada manualmente', {
    subscriptionId,
    reason,
    adminEmail,
  });

  return { ok: true, message: 'Subscription cancelada com sucesso' };
}

/**
 * Reativa subscription cancelada. Volta pra ACTIVE (assume admin sabe que usuário pagou).
 */
export async function reactivateSubscriptionAdmin(
  subscriptionId: string,
  adminEmail: string,
  ipAddress?: string
): Promise<AdminActionResult> {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!sub) return { ok: false, message: 'Subscription não encontrada' };

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'ACTIVE',
        canceledAt: null,
      },
    }),
    prisma.adminAudit.create({
      data: {
        adminEmail,
        action: 'reactivate_subscription',
        targetType: 'Subscription',
        targetId: subscriptionId,
        ipAddress,
        metadata: { previousStatus: sub.status },
      },
    }),
  ]);

  return { ok: true, message: 'Subscription reativada' };
}
