import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { dispatch } from '@/lib/notifications/dispatcher';

/**
 * Cron diário do loop de hábito (08:00 BRT):
 *
 * 1. Reseta streaks vencidos — quem não estuda há mais de 1 dia não pode
 *    continuar exibindo streak antigo no dashboard/leaderboard (dado mentia).
 * 2. Push personalizado de revisão: "N revisões vencem hoje" para usuários
 *    com cards SRS vencidos e push habilitado. O SRS é o gancho de retorno.
 *
 * Vercel Cron: { "path": "/api/cron/daily-study-reminder", "schedule": "0 11 * * *" }
 */

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    // ── 1. Reset de streaks vencidos ─────────────────────────────────────
    // Última sessão de estudo antes de ontem = streak quebrado.
    const resetResult = await prisma.userProfile.updateMany({
      where: {
        streak: { gt: 0 },
        OR: [
          { lastStudyDate: { lt: startOfYesterday } },
          { lastStudyDate: null },
        ],
      },
      data: { streak: 0 },
    });

    // ── 2. Push de revisões vencidas ─────────────────────────────────────
    // Só quem tem push inscrito (evita criar notificação in-app pra base toda
    // no cron) e cards SRS vencidos.
    // Sem limite artificial de usuários — o volume real (dezenas hoje) não
    // justifica paginação, e um `take` fixo aqui silenciosamente excluía
    // usuários assim que a base de inscritos passasse desse número.
    const usersWithPush = await prisma.pushSubscription.findMany({
      select: { userId: true },
      distinct: ['userId'],
    });
    const pushUserIds = usersWithPush.map((u) => u.userId);

    let sent = 0;
    let skipped = 0;

    if (pushUserIds.length > 0) {
      const dueByUser = await prisma.reviewCard.groupBy({
        by: ['userId'],
        where: { userId: { in: pushUserIds }, nextReviewAt: { lte: now } },
        _count: true,
      });

      // Idempotência: não enviar duas vezes no mesmo dia
      const alreadySent = await prisma.notification.findMany({
        where: {
          userId: { in: dueByUser.map((d) => d.userId) },
          type: 'REMINDER',
          createdAt: { gte: startOfToday },
          metadata: { path: ['kind'], equals: 'daily_srs' },
        },
        select: { userId: true },
      });
      const alreadySentIds = new Set(alreadySent.map((n) => n.userId));

      const profiles = await prisma.userProfile.findMany({
        where: { userId: { in: dueByUser.map((d) => d.userId) } },
        select: { userId: true, streak: true },
      });
      const streakByUser = new Map(profiles.map((p) => [p.userId, p.streak]));

      for (const due of dueByUser) {
        if (alreadySentIds.has(due.userId)) {
          skipped++;
          continue;
        }
        const streak = streakByUser.get(due.userId) ?? 0;
        const streakPart = streak > 0 ? `🔥 Streak de ${streak} ${streak === 1 ? 'dia' : 'dias'} · ` : '';
        try {
          await dispatch({
            userId: due.userId,
            type: 'REMINDER',
            title: '⚖️ Suas revisões de hoje chegaram',
            body: `${streakPart}${due._count} ${due._count === 1 ? 'questão vence' : 'questões vencem'} hoje na revisão espaçada. 10 minutos agora valem mais que 2 horas na véspera.`,
            actionUrl: '/review',
            actionLabel: 'Revisar agora',
            channels: ['IN_APP', 'PUSH'],
            metadata: { kind: 'daily_srs', dueCount: due._count },
          });
          sent++;
        } catch (err) {
          logger.error('daily-study-reminder dispatch failed', {
            userId: due.userId,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    logger.info('daily-study-reminder done', {
      streaksReset: resetResult.count,
      pushSent: sent,
      skippedAlreadySent: skipped,
    });

    return NextResponse.json({
      ok: true,
      streaksReset: resetResult.count,
      pushSent: sent,
      skipped,
    });
  } catch (error) {
    logger.error('daily-study-reminder error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
