/**
 * API para buscar dados de pagamento pendente (PIX QR Code / Boleto URL)
 * GET /api/billing/pagamento/[subscriptionId]
 *
 * Retorna QR code PIX ou URL do boleto para a primeira cobrança da assinatura.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { asaas } from '@/lib/asaas/client';
import { ASAAS_PLANS } from '@/lib/asaas/checkout';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
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
    const userId = dbUser?.id;

    const { subscriptionId } = await params;

    // 1. Buscar assinatura no Asaas
    const subscription = await asaas.getSubscription(subscriptionId);

    // Verificar que pertence ao usuário (via externalReference = DB userId)
    if (subscription.externalReference && subscription.externalReference !== userId) {
      return NextResponse.json({ error: 'Assinatura não pertence a este usuário' }, { status: 403 });
    }

    // 2. Buscar pagamentos da assinatura
    const payments = await asaas.getSubscriptionPayments(subscriptionId);
    const pendingPayment = payments.data.find(
      (p) => p.status === 'PENDING' || p.status === 'AWAITING_RISK_ANALYSIS'
    );
    const confirmedPayment = payments.data.find(
      (p) => p.status === 'CONFIRMED' || p.status === 'RECEIVED'
    );

    // Se já confirmado, informar o front
    if (confirmedPayment) {
      return NextResponse.json({
        status: 'CONFIRMED',
        billingType: subscription.billingType,
      });
    }

    if (!pendingPayment) {
      return NextResponse.json({
        status: 'NO_PENDING_PAYMENT',
        billingType: subscription.billingType,
        message: 'Nenhum pagamento pendente encontrado',
      });
    }

    // Detectar nome do plano
    const planEntry = Object.entries(ASAAS_PLANS).find(
      ([, cfg]) => Math.abs(cfg.value - subscription.value) < 0.1
    );
    const planName = planEntry ? planEntry[1].name : subscription.description;

    // 3. Buscar dados de pagamento (PIX QR Code ou Boleto)
    const result: Record<string, any> = {
      status: pendingPayment.status,
      billingType: subscription.billingType,
      value: subscription.value,
      plan: planName,
      paymentId: pendingPayment.id,
    };

    if (subscription.billingType === 'PIX') {
      try {
        const pixData = await asaas.getPaymentPixQrCode(pendingPayment.id);
        result.pixQrCode = pixData;
      } catch (pixError) {
        logger.warn('[PAGAMENTO] PIX QR Code ainda não disponível', {
          paymentId: pendingPayment.id,
          error: pixError instanceof Error ? pixError.message : String(pixError),
        });
        result.pixQrCode = null;
        result.message = 'QR Code PIX sendo gerado, tente novamente em alguns segundos.';
      }
    }

    if (subscription.billingType === 'BOLETO') {
      result.bankSlipUrl = pendingPayment.bankSlipUrl || null;
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    logger.error('[BILLING_PAGAMENTO]', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
