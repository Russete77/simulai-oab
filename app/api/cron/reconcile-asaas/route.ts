import { NextRequest, NextResponse } from 'next/server';
import { reconcileAsaasPayments } from '@/lib/billing/reconcile';

/**
 * Cron: rede de segurança para webhooks do Asaas.
 *
 * Rode a cada 10 minutos. Puxa todos os payments RECEIVED/CONFIRMED do Asaas
 * e reconcilia com o banco. Garante que:
 *  - Customer/Subscription/Payment existem
 *  - User.planType reflete o plano pago
 *
 * Idempotente. Só ELEVA o plano — nunca rebaixa (downgrade é via webhook).
 *
 * Vercel Cron:
 *   { "path": "/api/cron/reconcile-asaas", "schedule": "* /10 * * * *" }
 *   (remova o espaço entre asterisco e barra — inserido aqui pra não fechar o comentário)
 *
 * Chamada manual:
 *   curl -X POST https://www.simulaioab.com/api/cron/reconcile-asaas \
 *     -H "Authorization: Bearer ${CRON_SECRET}"
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    // Vercel Cron envia `Authorization: Bearer ${CRON_SECRET}` automaticamente
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await reconcileAsaasPayments();
    return NextResponse.json({ status: 'success', ...result });
  } catch (error) {
    console.error('[CRON_RECONCILE] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

// GET para teste em dev (sem auth)
export async function GET(_request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Use POST with CRON_SECRET in production' },
      { status: 405 }
    );
  }
  const result = await reconcileAsaasPayments();
  return NextResponse.json({ status: 'dev-success', ...result });
}
