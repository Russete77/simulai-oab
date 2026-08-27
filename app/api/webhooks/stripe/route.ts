/**
 * Webhook da Stripe.
 *
 * Regras críticas:
 *  1. Verificar a assinatura sobre o CORPO CRU (`req.text()`), nunca sobre o
 *     JSON já parseado — qualquer reserialização invalida a assinatura.
 *  2. Assinatura inválida → 400. Diferente do Asaas, aqui um 400 é o certo:
 *     ou é ataque, ou o segredo está errado, e nos dois casos queremos ver.
 *  3. Erro ao PROCESSAR um evento válido → 200 mesmo assim. Se devolvermos
 *     erro, a Stripe repete por 3 dias; pior, se ela não receber 2xx no
 *     `invoice.created` ela ADIA a finalização de todas as faturas em
 *     cobrança automática por até 72h. O evento fica logado para replay.
 *  4. Idempotência por `event.id` — o mesmo evento chega mais de uma vez.
 */

import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import {
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleSubscriptionChanged,
  handleChargeRefunded,
  handleFinalizationFailed,
  handlePaymentActionRequired,
} from '@/lib/stripe/webhook-handlers';

export async function POST(req: NextRequest) {
  const segredo = process.env.STRIPE_WEBHOOK_SECRET;
  if (!segredo) {
    logger.error('[STRIPE_WEBHOOK] STRIPE_WEBHOOK_SECRET não configurado');
    return NextResponse.json({ error: 'webhook não configurado' }, { status: 500 });
  }

  const assinatura = req.headers.get('stripe-signature');
  if (!assinatura) {
    return NextResponse.json({ error: 'sem assinatura' }, { status: 400 });
  }

  // 1. CORPO CRU — obrigatório para a verificação
  const corpo = await req.text();

  let evento: Stripe.Event;
  try {
    evento = getStripe().webhooks.constructEvent(corpo, assinatura, segredo);
  } catch (err) {
    logger.error('[STRIPE_WEBHOOK] Assinatura inválida', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'assinatura inválida' }, { status: 400 });
  }

  // 2. LOGAR ANTES DE PROCESSAR
  let logId: string | undefined;
  try {
    const log = await prisma.webhookLog.create({
      data: {
        eventType: evento.type,
        eventId: evento.id,
        source: 'stripe',
        payload: evento as unknown as object,
        processed: false,
      },
    });
    logId = log.id;
  } catch (err) {
    logger.error('[STRIPE_WEBHOOK] Falha ao logar evento', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // 3. IDEMPOTÊNCIA
  try {
    const jaProcessado = await prisma.webhookLog.findFirst({
      where: { eventId: evento.id, source: 'stripe', processed: true },
    });
    if (jaProcessado) {
      logger.info('[STRIPE_WEBHOOK] Evento duplicado ignorado', { eventId: evento.id });
      if (logId) {
        await prisma.webhookLog.delete({ where: { id: logId } }).catch(() => {});
      }
      return NextResponse.json({ received: true, duplicate: true });
    }
  } catch {
    // Falhou a checagem: processa mesmo assim. Os handlers são idempotentes.
  }

  // 4. PROCESSAR
  try {
    switch (evento.type) {
      case 'invoice.paid':
        await handleInvoicePaid(evento.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(evento.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_action_required':
        await handlePaymentActionRequired(evento.data.object as Stripe.Invoice);
        break;

      case 'invoice.finalization_failed':
        await handleFinalizationFailed(evento.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChanged(evento.data.object as Stripe.Subscription);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(evento.data.object as Stripe.Charge);
        break;

      default:
        logger.info('[STRIPE_WEBHOOK] Evento não tratado', { type: evento.type });
    }

    if (logId) {
      await prisma.webhookLog.update({
        where: { id: logId },
        data: { processed: true, processedAt: new Date() },
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[STRIPE_WEBHOOK] Erro ao processar evento', {
      type: evento.type,
      eventId: evento.id,
      error: msg,
    });
    if (logId) {
      await prisma.webhookLog
        .update({ where: { id: logId }, data: { error: msg } })
        .catch(() => {});
    }
    // 200 de propósito — ver regra 3 no topo.
  }

  return NextResponse.json({ received: true });
}
