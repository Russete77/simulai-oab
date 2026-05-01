/**
 * Targeting — resolve audience filter de uma campanha em lista de userIds.
 *
 * AudienceFilter (Json no banco):
 *   {
 *     subscriptionStatus?: 'NO_SUB' | 'ACTIVE' | 'INCOMPLETE' | 'PAST_DUE' | 'CANCELED',
 *     planType?: 'BASIC' | 'PRO' | 'PREMIUM',
 *     daysSinceSignup?: { min?: number, max?: number },
 *     lastActiveDays?: { min?: number, max?: number },
 *     limit?: number  // cap de segurança
 *   }
 */

import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

export interface AudienceFilter {
  subscriptionStatus?:
    | 'NO_SUB'
    | 'ACTIVE'
    | 'INCOMPLETE'
    | 'PAST_DUE'
    | 'CANCELED';
  planType?: 'BASIC' | 'PRO' | 'PREMIUM';
  daysSinceSignup?: { min?: number; max?: number };
  lastActiveDays?: { min?: number; max?: number };
  limit?: number;
}

/**
 * Resolve audience filter em userIds.
 */
export async function resolveAudience(filter: AudienceFilter): Promise<string[]> {
  const where: Prisma.UserWhereInput = {};
  const now = new Date();

  // subscriptionStatus
  if (filter.subscriptionStatus) {
    if (filter.subscriptionStatus === 'NO_SUB') {
      where.OR = [
        { customer: null },
        {
          customer: {
            subscriptions: { none: {} },
          },
        },
      ];
    } else {
      where.customer = {
        subscriptions: {
          some: { status: filter.subscriptionStatus },
        },
      };
    }
  }

  // planType
  if (filter.planType) {
    where.planType = filter.planType;
  }

  // daysSinceSignup → createdAt range
  if (filter.daysSinceSignup) {
    const range: { gte?: Date; lte?: Date } = {};
    if (filter.daysSinceSignup.min !== undefined) {
      range.lte = new Date(now.getTime() - filter.daysSinceSignup.min * 24 * 3600 * 1000);
    }
    if (filter.daysSinceSignup.max !== undefined) {
      range.gte = new Date(now.getTime() - filter.daysSinceSignup.max * 24 * 3600 * 1000);
    }
    where.createdAt = range;
  }

  // lastActiveDays → lastActiveAt range (invertido: min dias = ativo recentemente)
  if (filter.lastActiveDays) {
    const range: { gte?: Date; lte?: Date } = {};
    if (filter.lastActiveDays.min !== undefined) {
      range.lte = new Date(now.getTime() - filter.lastActiveDays.min * 24 * 3600 * 1000);
    }
    if (filter.lastActiveDays.max !== undefined) {
      range.gte = new Date(now.getTime() - filter.lastActiveDays.max * 24 * 3600 * 1000);
    }
    where.lastActiveAt = range;
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
    take: filter.limit ?? 5000,
    orderBy: { createdAt: 'desc' },
  });

  return users.map((u) => u.id);
}

/**
 * Conta sem listar — útil pra preview de campanha no admin.
 */
export async function countAudience(filter: AudienceFilter): Promise<number> {
  const ids = await resolveAudience({ ...filter, limit: filter.limit ?? 100000 });
  return ids.length;
}

/**
 * Substitui {{variables}} nos templates de title/body com dados do user.
 */
export function renderTemplate(
  template: string,
  vars: { name?: string | null; email?: string }
): string {
  return template
    .replace(/\{\{userName\}\}/g, vars.name || vars.email?.split('@')[0] || 'Estudante')
    .replace(/\{\{firstName\}\}/g, (vars.name || '').split(' ')[0] || 'Estudante')
    .replace(/\{\{email\}\}/g, vars.email ?? '');
}
