/**
 * POST /api/billing/portal
 *
 * Abre o portal do cliente da Stripe: cancelar, trocar cartão, ver e baixar
 * faturas, atualizar dados de cobrança — tudo self-service, em pt-BR.
 *
 * Antes esta rota implementava um "portal" caseiro que só sabia cancelar,
 * porque o Asaas não tinha portal nenhum.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { criarPortalSession } from '@/lib/stripe/checkout';

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || '';

    const url = await criarPortalSession({ userId: dbUser.id, baseUrl });
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    logger.error('[BILLING_PORTAL]', { error: message });
    return NextResponse.json(
      { error: 'Não foi possível abrir o portal de assinatura.' },
      { status: 500 }
    );
  }
}
