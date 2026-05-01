/**
 * API para verificar status da assinatura do usuário
 * GET /api/billing/status — consulta banco local (sem chamada ao Asaas)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar usuário pelo clerkId (não pelo id interno)
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        planType: true,
        customer: {
          select: {
            id: true,
            asaasCustomerId: true,
            gateway: true,
            subscriptions: {
              where: {
                gateway: 'asaas',
                status: { in: ['ACTIVE', 'PAST_DUE'] },
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                asaasSubscriptionId: true,
                plan: true,
                status: true,
                value: true,
                cycle: true,
                currentPeriodStart: true,
                currentPeriodEnd: true,
                cancelAtPeriodEnd: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const subscription = user.customer?.subscriptions?.[0];

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        planType: user.planType || 'BASIC',
        status: user.customer ? 'no_subscription' : 'no_customer',
      });
    }

    return NextResponse.json({
      hasSubscription: true,
      planType: user.planType,
      status: subscription.status,
      plan: subscription.plan,
      value: subscription.value,
      cycle: subscription.cycle,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      subscriptionId: subscription.asaasSubscriptionId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    logger.error('[BILLING_STATUS]', { error: message });
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
