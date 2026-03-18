/**
 * API para gerenciar assinatura (Asaas Customer Portal)
 *
 * POST /api/billing/portal — Cancelar assinatura
 * Body: { action: 'cancel' }
 *
 * Asaas não tem portal self-service, então gerenciamos via API.
 * O front-end exibe os controles diretamente no dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { cancelAsaasSubscription } from '@/lib/asaas/checkout';

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Resolver Clerk ID → Database User ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const userId = dbUser.id;

    const body = await req.json();
    const { action } = body as { action: string };

    switch (action) {
      case 'cancel': {
        await cancelAsaasSubscription(userId);

        logger.info('[BILLING_PORTAL] Assinatura cancelada pelo usuário', { userId });

        return NextResponse.json({
          success: true,
          message: 'Assinatura cancelada. Você mantém acesso até o fim do período pago.',
        });
      }

      default:
        return NextResponse.json(
          { error: `Ação não suportada: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    logger.error('[BILLING_PORTAL]', { error: message });
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
