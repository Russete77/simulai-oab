/**
 * API para criar assinaturas via Asaas
 * POST /api/billing/subscribe
 *
 * Body: { plan: AsaasPlanKey, billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD', cpfCnpj: string, creditCard?, creditCardHolderInfo? }
 *
 * Fluxo:
 * 1. Autenticar via Clerk
 * 2. findOrCreateAsaasCustomer
 * 3. createAsaasSubscription
 * 4. Retornar URL de pagamento (PIX/boleto → /pagamento/[id], cartão → dashboard)
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
    const clerkUser = await currentUser();

    if (!clerkId || !clerkUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Resolver Clerk ID → Database User ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado no banco. Faça login novamente.' },
        { status: 404 }
      );
    }

    const userId = dbUser.id; // cuid do banco, não o Clerk ID

    const body = await req.json();
    const { plan, billingType, cpfCnpj, creditCard, creditCardHolderInfo } = body as {
      plan: AsaasPlanKey;
      billingType: AsaasBillingType;
      cpfCnpj: string;
      creditCard?: {
        holderName: string;
        number: string;
        expiryMonth: string;
        expiryYear: string;
        ccv: string;
      };
      creditCardHolderInfo?: {
        name: string;
        email: string;
        cpfCnpj: string;
        postalCode: string;
        addressNumber: string;
        phone: string;
      };
    };

    // Validações
    if (!plan || !(plan in ASAAS_PLANS)) {
      return NextResponse.json(
        { error: 'Plano inválido', validPlans: Object.keys(ASAAS_PLANS) },
        { status: 400 }
      );
    }

    if (!billingType || !['PIX', 'BOLETO', 'CREDIT_CARD'].includes(billingType)) {
      return NextResponse.json(
        { error: 'Forma de pagamento inválida (PIX, BOLETO ou CREDIT_CARD)' },
        { status: 400 }
      );
    }

    if (!cpfCnpj) {
      return NextResponse.json(
        { error: 'CPF/CNPJ é obrigatório' },
        { status: 400 }
      );
    }

    if (billingType === 'CREDIT_CARD' && (!creditCard || !creditCardHolderInfo)) {
      return NextResponse.json(
        { error: 'Dados do cartão são obrigatórios para pagamento com cartão' },
        { status: 400 }
      );
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email;

    // 1. Criar/buscar customer no Asaas
    const asaasCustomerId = await findOrCreateAsaasCustomer(userId, {
      name,
      email,
      cpfCnpj,
    });

    // 2. Criar assinatura
    const subscription = await createAsaasSubscription({
      userId,
      asaasCustomerId,
      plan,
      billingType,
      creditCard,
      creditCardHolderInfo,
    });

    logger.info('[BILLING_SUBSCRIBE] Assinatura criada com sucesso', {
      userId,
      plan,
      billingType,
      subscriptionId: subscription.id,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin');

    // 3. Retornar resposta baseada no tipo de pagamento
    if (billingType === 'CREDIT_CARD') {
      // Cartão: pagamento processado imediatamente → redirecionar ao dashboard
      return NextResponse.json({
        success: true,
        subscriptionId: subscription.id,
        redirectUrl: `${baseUrl}/dashboard?assinatura=ativa`,
        message: 'Assinatura criada! Pagamento processado.',
      });
    }

    // PIX ou Boleto: redirecionar para página de pagamento
    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      redirectUrl: `${baseUrl}/pagamento/${subscription.id}`,
      message: billingType === 'PIX'
        ? 'Assinatura criada! Escaneie o QR Code PIX para ativar.'
        : 'Assinatura criada! Pague o boleto para ativar.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    logger.error('[BILLING_SUBSCRIBE]', {
      error: message,
    });
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
