/**
 * Plan gating — payment-only. Acesso somente com Subscription ACTIVE.
 */

import { PlanType, SubscriptionStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { isFreeAccessModeEnabled } from './free-access-mode';

export type GateReason = 'no_user' | 'no_subscription' | 'subscription_inactive' | 'ok';

export interface GateResult {
  allowed: boolean;
  reason: GateReason;
  planType: PlanType | null;
  subscriptionStatus: SubscriptionStatus | null;
  trialEndsAt?: Date | null;
}

const ACTIVE_STATUSES: SubscriptionStatus[] = ['ACTIVE'];

/**
 * Bypass de admin: e-mails em ADMIN_EMAILS (separados por vírgula) têm acesso
 * total sem assinatura. Para o dono/equipe testarem o produto em produção.
 * Vazio/ausente = nenhum bypass.
 */
function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = process.env.ADMIN_EMAILS;
  if (!list) return false;
  return list
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function requirePaidPlan(userId: string | null | undefined): Promise<GateResult> {
  if (!userId) {
    return { allowed: false, reason: 'no_user', planType: null, subscriptionStatus: null };
  }

  if (isFreeAccessModeEnabled()) {
    return { allowed: true, reason: 'ok', planType: 'PREMIUM', subscriptionStatus: 'ACTIVE' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      planType: true,
      email: true,
      customer: {
        select: {
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { status: true, trialEnd: true },
          },
        },
      },
    },
  });

  if (!user) {
    return { allowed: false, reason: 'no_user', planType: null, subscriptionStatus: null };
  }

  if (isAdminEmail(user.email)) {
    return { allowed: true, reason: 'ok', planType: 'PREMIUM', subscriptionStatus: 'ACTIVE' };
  }

  const sub = user.customer?.subscriptions[0];

  if (!sub) {
    return {
      allowed: false,
      reason: 'no_subscription',
      planType: user.planType,
      subscriptionStatus: null,
    };
  }

  const allowed = ACTIVE_STATUSES.includes(sub.status);

  return {
    allowed,
    reason: allowed ? 'ok' : 'subscription_inactive',
    planType: user.planType,
    subscriptionStatus: sub.status,
    trialEndsAt: sub.trialEnd,
  };
}

export async function requirePaidPlanByClerkId(
  clerkId: string | null | undefined
): Promise<GateResult> {
  if (!clerkId) {
    return { allowed: false, reason: 'no_user', planType: null, subscriptionStatus: null };
  }

  if (isFreeAccessModeEnabled()) {
    return { allowed: true, reason: 'ok', planType: 'PREMIUM', subscriptionStatus: 'ACTIVE' };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      planType: true,
      email: true,
      customer: {
        select: {
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { status: true, trialEnd: true },
          },
        },
      },
    },
  });

  if (!user) {
    return { allowed: false, reason: 'no_user', planType: null, subscriptionStatus: null };
  }

  if (isAdminEmail(user.email)) {
    return { allowed: true, reason: 'ok', planType: 'PREMIUM', subscriptionStatus: 'ACTIVE' };
  }

  const sub = user.customer?.subscriptions[0];

  if (!sub) {
    return {
      allowed: false,
      reason: 'no_subscription',
      planType: user.planType,
      subscriptionStatus: null,
    };
  }

  const allowed = ACTIVE_STATUSES.includes(sub.status);

  return {
    allowed,
    reason: allowed ? 'ok' : 'subscription_inactive',
    planType: user.planType,
    subscriptionStatus: sub.status,
    trialEndsAt: sub.trialEnd,
  };
}
