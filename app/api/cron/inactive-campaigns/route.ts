import { NextRequest, NextResponse } from 'next/server';
import { runInactiveCampaigns } from '@/lib/email/inactive-campaign';

/**
 * Cron diário: envia campanhas D+3, D+7, D+14 para usuários SEM ASSINATURA ATIVA inativos.
 *
 * Vercel Cron (em vercel.json):
 *   { "path": "/api/cron/inactive-campaigns", "schedule": "0 14 * * *" }
 *   (14h UTC = 11h Brasília — horário nobre de abertura de email no BR)
 *
 * Manual:
 *   curl -X POST https://www.simulaioab.com/api/cron/inactive-campaigns \
 *     -H "Authorization: Bearer ${CRON_SECRET}"
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await runInactiveCampaigns();
    const summary = {
      totalSent: results.reduce((s, r) => s + r.sent, 0),
      totalFailed: results.reduce((s, r) => s + r.failed, 0),
      totalCandidates: results.reduce((s, r) => s + r.candidates, 0),
    };

    return NextResponse.json({ status: 'success', summary, results });
  } catch (error) {
    console.error('[CRON_INACTIVE_CAMPAIGNS] erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'internal' },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Use POST with CRON_SECRET in production' },
      { status: 405 }
    );
  }
  const results = await runInactiveCampaigns();
  return NextResponse.json({ status: 'dev-success', results });
}
