/**
 * API para criar assinatura Asaas
 *
 * POST /api/billing/criar-intencao-pagamento
 * Redireciona para /api/billing/subscribe — mantido por compatibilidade.
 *
 * Body: { plan: AsaasPlanKey, billingType, cpfCnpj, creditCard?, creditCardHolderInfo? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import {
  findOrCreateAsaasCustomer,
  createAsaasSubscription,
  ASAAS_PLANS,
  type AsaasPlanKey,
} from '@/lib/asaas/checkout';
import type { AsaasBillingType } from '@/lib/asaas/types';

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    const user = await currentUser();

    if (!clerkId || !user) {
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
    const { plan, billingType, cpfCnpj, creditCard, creditCardHolderInfo } = body as {
      plan: AsaasPlanKey;
      billingType: AsaasBillingType;
      cpfCnpj: string;
      creditCard?: any;
      creditCardHolderInfo?: any;
    };

    if (!plan || !(plan in ASAAS_PLANS)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }

    if (!billingType || !['PIX', 'BOLETO', 'CREDIT_CARD'].includes(billingType)) {
      return NextResponse.json({ error: 'Forma de pagamento inválida' }, { status: 400 });
    }

    if (!cpfCnpj) {
      return NextResponse.json({ error: 'CPF/CNPJ é obrigatório' }, { status: 400 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || email;

    const asaasCustomerId = await findOrCreateAsaasCustomer(userId, {
      name,
      email,
      cpfCnpj,
    });

    const subscription = await createAsaasSubscription({
      userId,
      asaasCustomerId,
      plan,
      billingType,
      creditCard,
      creditCardHolderInfo,
    });

    const planConfig = ASAAS_PLANS[plan];

    logger.info('[CRIAR_INTENCAO_PAGAMENTO] Assinatura Asaas criada', {
      userId,
      plan,
      billingType,
      subscriptionId: subscription.id,
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      plan: planConfig.name,
      value: planConfig.value,
      billingType,
      // Para PIX/Boleto, o front-end redireciona a /pagamento/[subscriptionId]
      // Para cartão, pagamento já processado
      paymentPending: billingType !== 'CREDIT_CARD',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    logger.error('[CRIAR_INTENCAO_PAGAMENTO]', { error: message });
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
