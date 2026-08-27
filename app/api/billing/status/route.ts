/**
 * GET /api/billing/status
 *
 * Estado da assinatura do usuário, lido do nosso banco (sem chamar a Stripe).
 * Serve os dois gateways enquanto durar a migração: o que importa é existir
 * alguma assinatura ativa, não qual sistema a cobra.
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { PLANO } from '@/lib/stripe/plan';

const ATIVOS = ['ACTIVE', 'TRIALING'] as const;

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        customer: {
          select: {
            subscriptions: {
              orderBy: { createdAt: 'desc' },
              select: {
                gateway: true,
                status: true,
                value: true,
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

    const subs = user.customer?.subscriptions ?? [];
    const ativa = subs.find((s) => ATIVOS.includes(s.status as (typeof ATIVOS)[number]));
    const referencia = ativa ?? subs[0];

    if (!referencia) {
      return NextResponse.json({
        assinante: false,
        status: 'sem_assinatura',
        precoFormatado: PLANO.precoFormatado,
      });
    }

    return NextResponse.json({
      assinante: Boolean(ativa),
      status: referencia.status,
      gateway: referencia.gateway,
      valor: referencia.value,
      renovaEm: referencia.currentPeriodEnd,
      cancelaNoFimDoPeriodo: referencia.cancelAtPeriodEnd,
      // O portal self-service só existe para assinaturas da Stripe. Quem ainda
      // está no Asaas precisa falar com o suporte para cancelar.
      temPortal: referencia.gateway === 'stripe',
      precoFormatado: PLANO.precoFormatado,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    logger.error('[BILLING_STATUS]', { error: message });
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
