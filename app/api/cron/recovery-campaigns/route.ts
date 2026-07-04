import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { dispatchBatch } from '@/lib/notifications/dispatcher';
import { resolveAudience } from '@/lib/notifications/targeting';

/**
 * Cron diário: recovery campaigns para users sem subscription ACTIVE.
 *
 * Janelas:
 *   D+1  — recém cadastrou e não pagou
 *   D+3  — primeira tentativa de recuperação
 *   D+7  — segunda tentativa
 *   D+14 — desconto especial
 *   D+30 — última chance
 *
 * Cada user recebe APENAS UMA campanha por dia (a janela mais antiga match).
 * Idempotência garantida via Notification metadata.recoveryDay.
 *
 * Vercel Cron: { "path": "/api/cron/recovery-campaigns", "schedule": "0 13 * * *" }
 */

const RECOVERY_WINDOWS: Array<{
  day: number;
  campaignKey: string;
  title: string;
  body: string;
  emailSubject: string;
  actionLabel: string;
  vibrate: boolean;
}> = [
  {
    day: 1,
    campaignKey: 'RECOVERY_D1',
    title: '🎓 Pronto pra começar a estudar pra OAB?',
    body: 'Seu cadastro foi feito ontem. Comece agora com simulados ilimitados e analytics de desempenho.',
    emailSubject: '🎓 Pronto pra começar a estudar pra OAB?',
    actionLabel: 'Ver planos',
    vibrate: false,
  },
  {
    day: 3,
    campaignKey: 'RECOVERY_D3',
    title: '📚 Sua aprovação na OAB começa hoje',
    body: 'Já são 3 dias desde seu cadastro. 5.875 questões oficiais te esperam — Essencial por R$ 19,90/mês.',
    emailSubject: '📚 Sua aprovação na OAB começa hoje',
    actionLabel: 'Assinar Essencial',
    vibrate: false,
  },
  {
    day: 7,
    campaignKey: 'RECOVERY_D7',
    title: '⏰ Não deixe a OAB pra última hora',
    body: 'Uma semana já passou. A próxima OAB tá chegando e cada dia conta. Comece hoje com 7 dias de garantia.',
    emailSubject: '⏰ Não deixe a OAB pra última hora',
    actionLabel: 'Ver planos',
    vibrate: true, // toque suave nesse ponto
  },
  {
    day: 14,
    campaignKey: 'RECOVERY_D14',
    title: '🎁 Oferta especial: 20% off no Essencial',
    body: 'Só pra você que ainda não assinou: use o cupom VOLTA20 e leve o Essencial por R$ 15,99/mês no primeiro mês.',
    emailSubject: '🎁 Oferta especial: 20% off no Essencial',
    actionLabel: 'Resgatar 20% off',
    vibrate: true,
  },
  {
    day: 30,
    campaignKey: 'RECOVERY_D30',
    title: '⚡ Última chance — sua conta vai ser pausada',
    body: 'Já faz 1 mês. Sem assinatura, mantemos seu progresso por mais 30 dias e depois a conta é arquivada. Assine pra continuar.',
    emailSubject: '⚡ Última chance — sua conta vai ser pausada',
    actionLabel: 'Assinar agora',
    vibrate: true,
  },
];

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: Array<{ day: number; targeted: number; sent: number }> = [];

    for (const w of RECOVERY_WINDOWS) {
      // Audience: signup há exatamente {day} dias (range de 24h pra catar a janela)
      // E não tem subscription ACTIVE
      const userIds = await resolveAudience({
        subscriptionStatus: 'NO_SUB',
        daysSinceSignup: { min: w.day, max: w.day + 1 },
        limit: 5000,
      });

      // Dedup: pra cada user nessa janela, ver se já recebeu essa recovery key
      // (evita reenvio quando o cron roda 2x em 24h por algum motivo)
      const existing = await prisma.notification.findMany({
        where: {
          userId: { in: userIds },
          type: 'PAYMENT_RECOVERY',
          metadata: { path: ['recoveryKey'], equals: w.campaignKey } as never,
        },
        select: { userId: true },
      });
      const alreadySent = new Set(existing.map((n) => n.userId));
      const toSend = userIds.filter((uid) => !alreadySent.has(uid));

      if (toSend.length === 0) {
        results.push({ day: w.day, targeted: userIds.length, sent: 0 });
        continue;
      }

      const stats = await dispatchBatch(
        toSend,
        {
          type: 'PAYMENT_RECOVERY',
          priority: w.day >= 14 ? 'HIGH' : 'NORMAL',
          title: w.title,
          body: w.body,
          channels: ['IN_APP', 'PUSH', 'EMAIL'],
          vibrate: w.vibrate,
          actionUrl: '/pricing',
          actionLabel: w.actionLabel,
          emailSubject: w.emailSubject,
          metadata: { recoveryKey: w.campaignKey, dayWindow: w.day },
        },
        { batchSize: 50 }
      );

      results.push({ day: w.day, targeted: userIds.length, sent: stats.inApp });
      logger.info('[CRON_RECOVERY] janela disparada', {
        day: w.day,
        targeted: userIds.length,
        sent: stats.inApp,
        push: stats.push,
        email: stats.email,
      });
    }

    return NextResponse.json({ status: 'success', windows: results });
  } catch (error) {
    console.error('[CRON_RECOVERY]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
