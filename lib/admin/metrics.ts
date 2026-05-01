/**
 * Queries agregadas para o dashboard admin.
 * Tudo tipado, sem `any`. Todas as funções fazem 1-2 queries no máximo.
 */

import { prisma } from '@/lib/db/prisma';

export interface OverviewMetrics {
  totalUsers: number;
  usersPaid: number;
  usersUnpaid: number;        // cadastrou mas nunca pagou (sem subscription ACTIVE)
  usersIncomplete: number;    // tem subscription mas em estado bloqueado
  usersActiveNow: number;     // sessão ativa nas últimas 5 min
  usersActive7d: number;
  usersActive30d: number;
  mrrBRL: number;
  paymentsConfirmedAll: number;
  paymentsConfirmed30d: number;
  subscriptionsActive: number;
  subscriptionsPastDue: number;
  signups30d: number;
  signups7d: number;
  signupsToday: number;
  churnLast30d: number;
}

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  const now = new Date();
  const d5min = new Date(now.getTime() - 5 * 60 * 1000);
  const d7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const d1 = new Date(now.getTime() - 24 * 3600 * 1000);

  const [
    totalUsers,
    usersPaid,
    usersUnpaid,
    usersIncomplete,
    usersActiveNow,
    usersActive7d,
    usersActive30d,
    subsActive,
    subsPastDue,
    payAll,
    pay30d,
    signups30d,
    signups7d,
    signupsToday,
    churnLast30d,
    mrrAgg,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        customer: { subscriptions: { some: { status: 'ACTIVE' } } },
      },
    }),
    // Cadastrou mas nunca pagou: sem customer OU customer sem nenhuma sub ACTIVE
    prisma.user.count({
      where: {
        OR: [
          { customer: null },
          {
            customer: {
              subscriptions: {
                none: { status: 'ACTIVE' },
              },
            },
          },
        ],
      },
    }),
    prisma.user.count({
      where: {
        customer: {
          subscriptions: {
            some: { status: { in: ['INCOMPLETE', 'INCOMPLETE_EXPIRED', 'PAST_DUE', 'UNPAID'] } },
          },
        },
      },
    }),
    prisma.user.count({ where: { lastActiveAt: { gte: d5min } } }),
    prisma.user.count({ where: { lastActiveAt: { gte: d7 } } }),
    prisma.user.count({ where: { lastActiveAt: { gte: d30 } } }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.subscription.count({ where: { status: 'PAST_DUE' } }),
    prisma.payment.count({ where: { status: { in: ['RECEIVED', 'CONFIRMED'] } } }),
    prisma.payment.count({
      where: {
        status: { in: ['RECEIVED', 'CONFIRMED'] },
        createdAt: { gte: d30 },
      },
    }),
    prisma.user.count({ where: { createdAt: { gte: d30 } } }),
    prisma.user.count({ where: { createdAt: { gte: d7 } } }),
    prisma.user.count({ where: { createdAt: { gte: d1 } } }),
    prisma.subscription.count({
      where: { status: 'CANCELED', canceledAt: { gte: d30 } },
    }),
    prisma.subscription.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { value: true },
    }),
  ]);

  return {
    totalUsers,
    usersPaid,
    usersUnpaid,
    usersIncomplete,
    usersActiveNow,
    usersActive7d,
    usersActive30d,
    mrrBRL: mrrAgg._sum.value ?? 0,
    paymentsConfirmedAll: payAll,
    paymentsConfirmed30d: pay30d,
    subscriptionsActive: subsActive,
    subscriptionsPastDue: subsPastDue,
    signups30d,
    signups7d,
    signupsToday,
    churnLast30d,
  };
}

export interface DailySignup {
  date: string;   // YYYY-MM-DD
  count: number;
}

/** Série temporal de signups dos últimos N dias, agrupados por dia. */
export async function getSignupsSeries(days = 30): Promise<DailySignup[]> {
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);
  const rows = await prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
    SELECT date_trunc('day', "createdAt")::date AS day, COUNT(*)::bigint AS count
    FROM "User"
    WHERE "createdAt" >= ${since}
    GROUP BY day
    ORDER BY day ASC
  `;
  return rows.map((r) => ({
    date: r.day.toISOString().split('T')[0],
    count: Number(r.count),
  }));
}

export interface DailyRevenue {
  date: string;
  valueBRL: number;
  count: number;
}

export async function getRevenueSeries(days = 30): Promise<DailyRevenue[]> {
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);
  const rows = await prisma.$queryRaw<
    Array<{ day: Date; sum: number | null; count: bigint }>
  >`
    SELECT
      date_trunc('day', "paymentDate")::date AS day,
      SUM("value")::float AS sum,
      COUNT(*)::bigint AS count
    FROM "Payment"
    WHERE "status" IN ('RECEIVED','CONFIRMED') AND "paymentDate" >= ${since}
    GROUP BY day
    ORDER BY day ASC
  `;
  return rows.map((r) => ({
    date: r.day.toISOString().split('T')[0],
    valueBRL: r.sum ?? 0,
    count: Number(r.count),
  }));
}

export interface PlanDistribution {
  plan: string;
  count: number;
}

export async function getPlanDistribution(): Promise<PlanDistribution[]> {
  const rows = await prisma.user.groupBy({
    by: ['planType'],
    _count: true,
  });
  return rows.map((r) => ({ plan: r.planType, count: r._count }));
}
