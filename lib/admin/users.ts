import { PlanType, Prisma, SubscriptionStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export interface AdminUserListFilters {
  search?: string;
  plan?: PlanType | 'ALL';
  subStatus?: SubscriptionStatus | 'ALL' | 'NO_SUB';
  activity?: 'ALL' | 'ACTIVE_7D' | 'ACTIVE_30D' | 'INACTIVE_30D' | 'NEVER';
  page?: number;
  pageSize?: number;
  sort?: 'createdAt' | 'lastActiveAt' | 'totalSessionMinutes' | 'totalLogins';
  order?: 'asc' | 'desc';
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  planType: PlanType;
  createdAt: Date;
  lastActiveAt: Date | null;
  totalSessionMinutes: number;
  totalLogins: number;
  totalAnswers: number;
  totalSimulations: number;
  hasActiveSub: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  trialEndsAt: Date | null;
}

export interface AdminUserListResult {
  rows: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Lista paginada de usuários pro admin com filtros e ordenação.
 */
export async function listAdminUsers(
  f: AdminUserListFilters = {}
): Promise<AdminUserListResult> {
  const page = Math.max(1, f.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, f.pageSize ?? 25));
  const skip = (page - 1) * pageSize;

  const where: Prisma.UserWhereInput = {};

  if (f.search && f.search.trim()) {
    const q = f.search.trim();
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { name: { contains: q, mode: 'insensitive' } },
      { id: q },
      { clerkId: q },
    ];
  }

  if (f.plan && f.plan !== 'ALL') {
    where.planType = f.plan;
  }

  if (f.subStatus && f.subStatus !== 'ALL') {
    if (f.subStatus === 'NO_SUB') {
      where.OR = [
        ...(where.OR ?? []) as Prisma.UserWhereInput[],
        { customer: null },
        {
          customer: {
            subscriptions: { none: {} },
          },
        },
      ];
    } else {
      where.customer = {
        subscriptions: { some: { status: f.subStatus as SubscriptionStatus } },
      };
    }
  }

  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  if (f.activity === 'ACTIVE_7D') where.lastActiveAt = { gte: d7 };
  else if (f.activity === 'ACTIVE_30D') where.lastActiveAt = { gte: d30 };
  else if (f.activity === 'INACTIVE_30D') where.lastActiveAt = { lt: d30 };
  else if (f.activity === 'NEVER') where.lastActiveAt = null;

  const sortField = f.sort ?? 'createdAt';
  const sortOrder = f.order ?? 'desc';

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortField]: sortOrder },
      select: {
        id: true,
        email: true,
        name: true,
        planType: true,
        createdAt: true,
        lastActiveAt: true,
        totalSessionMinutes: true,
        totalLogins: true,
        _count: {
          select: {
            answers: true,
            simulations: true,
          },
        },
        customer: {
          select: {
            subscriptions: {
              orderBy: { createdAt: 'desc' },
              select: { id: true, status: true, trialEnd: true },
              take: 1,
            },
          },
        },
      },
    }),
  ]);

  return {
    total,
    page,
    pageSize,
    rows: rows.map((r) => {
      const sub = r.customer?.subscriptions[0];
      return {
        id: r.id,
        email: r.email,
        name: r.name,
        planType: r.planType,
        createdAt: r.createdAt,
        lastActiveAt: r.lastActiveAt,
        totalSessionMinutes: r.totalSessionMinutes,
        totalLogins: r.totalLogins,
        totalAnswers: r._count.answers,
        totalSimulations: r._count.simulations,
        hasActiveSub: sub?.status === 'ACTIVE' || sub?.status === 'TRIALING',
        subscriptionStatus: sub?.status ?? null,
        trialEndsAt: sub?.trialEnd ?? null,
      };
    }),
  };
}

/**
 * Dados completos de UM usuário pro drill-down.
 */
export async function getAdminUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      customer: {
        include: {
          subscriptions: {
            orderBy: { createdAt: 'desc' },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      },
      achievements: {
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
        take: 10,
      },
      studyPlans: { where: { isActive: true }, take: 3 },
      _count: {
        select: {
          answers: true,
          simulations: true,
          chatSessions: true,
        },
      },
    },
  });

  if (!user) return null;

  // Sessions dos últimos 30 dias, mais recentes primeiro
  const d30 = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const sessions = await prisma.userSession.findMany({
    where: { userId, startedAt: { gte: d30 } },
    orderBy: { startedAt: 'desc' },
    take: 50,
  });

  // Performance por matéria (últimos 30d)
  const subjectPerf = await prisma.$queryRaw<
    Array<{ subject: string; total: bigint; correct: bigint }>
  >`
    SELECT q."subject" AS subject,
           COUNT(*)::bigint AS total,
           COUNT(*) FILTER (WHERE ua."isCorrect")::bigint AS correct
    FROM "UserAnswer" ua
    JOIN "Question" q ON q.id = ua."questionId"
    WHERE ua."userId" = ${userId} AND ua."createdAt" >= ${d30}
    GROUP BY q."subject"
    ORDER BY total DESC
  `;

  // Campanhas de email enviadas a este user
  const emailCampaigns = await prisma.emailCampaign.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return {
    user,
    sessions,
    subjectPerformance: subjectPerf.map((r) => ({
      subject: r.subject,
      total: Number(r.total),
      correct: Number(r.correct),
      rate: Number(r.total) > 0 ? Number(r.correct) / Number(r.total) : 0,
    })),
    emailCampaigns,
  };
}
