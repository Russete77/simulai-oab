/**
 * Webhook do Asaas
 *
 * REGRAS CRÍTICAS (a fila PAUSA após 15 falhas consecutivas):
 * 1. SEMPRE retornar 200 — mesmo com erro interno
 * 2. Idempotência via eventId — mesmo evento pode chegar 2x
 * 3. Validar token via header `asaas-access-token`
 * 4. Logar payload ANTES de processar
 * 5. Processar em < 5 segundos
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import type { AsaasWebhookPayload } from '@/lib/asaas/types';
import {
  handlePaymentConfirmed,
  handlePaymentOverdue,
  handlePaymentRefunded,
  handleSubscriptionInactivated,
} from '@/lib/asaas/webhook-handlers';

// Lazy — evita caching de valor vazio no Turbopack/dev
function getWebhookToken(): string {
  return process.env.ASAAS_WEBHOOK_TOKEN || '';
}

export async function POST(req: NextRequest) {
  // 1. VALIDAR TOKEN
  const webhookToken = getWebhookToken();
  const token = req.headers.get('asaas-access-token');

  if (!webhookToken) {
    logger.error('[ASAAS_WEBHOOK] ASAAS_WEBHOOK_TOKEN não configurado no .env — webhooks ignorados!');
    return NextResponse.json({ received: true });
  }

  if (token !== webhookToken) {
    logger.error('[ASAAS_WEBHOOK] Token inválido', {
      received: token?.substring(0, 8) + '...',
    });
    // Retornar 200 mesmo com token inválido para NÃO pausar a fila
    return NextResponse.json({ received: true });
  }

  // 2. PARSEAR PAYLOAD
  let payload: AsaasWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    logger.error('[ASAAS_WEBHOOK] Payload inválido (JSON parse falhou)');
    return NextResponse.json({ received: true });
  }

  logger.info('[ASAAS_WEBHOOK] Evento recebido', {
    event: payload.event,
    eventId: payload.id,
  });

  // 3. LOGAR ANTES DE PROCESSAR (se falhar depois, temos o registro)
  let logId: string | undefined;
  try {
    const log = await prisma.webhookLog.create({
      data: {
        eventType: payload.event,
        eventId: payload.id,
        source: 'asaas',
        payload: payload as any,
        processed: false,
      },
    });
    logId = log.id;
  } catch (logError) {
    logger.error('[ASAAS_WEBHOOK] Falha ao logar evento no banco', {
      error: logError instanceof Error ? logError.message : String(logError),
    });
    // Continuar mesmo sem log — melhor processar sem log do que perder evento
  }

  // 4. IDEMPOTÊNCIA — verificar duplicata pelo eventId
  if (payload.id) {
    try {
      const existing = await prisma.webhookLog.findFirst({
        where: {
          eventId: payload.id,
          source: 'asaas',
          processed: true,
        },
      });

      if (existing) {
        logger.info('[ASAAS_WEBHOOK] Evento duplicado ignorado', {
          eventId: payload.id,
        });
        // Remover o log que acabamos de criar (é duplicata)
        if (logId) {
          await prisma.webhookLog.delete({ where: { id: logId } }).catch(() => {});
        }
        return NextResponse.json({ received: true, duplicate: true });
      }
    } catch {
      // Se falhar a verificação de idempotência, processar mesmo assim
      // (melhor processar 2x do que não processar)
    }
  }

  // 5. PROCESSAR EVENTO (try-catch para SEMPRE retornar 200)
  try {
    switch (payload.event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        await handlePaymentConfirmed(payload);
        break;

      case 'PAYMENT_OVERDUE':
        await handlePaymentOverdue(payload);
        break;

      case 'PAYMENT_DELETED':
      case 'PAYMENT_REFUNDED':
        await handlePaymentRefunded(payload);
        break;

      case 'SUBSCRIPTION_INACTIVATED':
      case 'SUBSCRIPTION_DELETED':
        await handleSubscriptionInactivated(payload);
        break;

      case 'SUBSCRIPTION_CREATED':
      case 'SUBSCRIPTION_RENEWED':
        logger.info('[ASAAS_WEBHOOK] Evento informacional', {
          event: payload.event,
          subscriptionId: payload.subscription?.id,
        });
        break;

      default:
        logger.info('[ASAAS_WEBHOOK] Evento não tratado', {
          event: payload.event,
        });
    }

    // 6. MARCAR COMO PROCESSADO
    if (logId) {
      await prisma.webhookLog.update({
        where: { id: logId },
        data: { processed: true, processedAt: new Date() },
      });
    }
  } catch (error) {
    logger.error('[ASAAS_WEBHOOK] Erro ao processar evento', {
      event: payload.event,
      eventId: payload.id,
      error: error instanceof Error ? error.message : String(error),
    });

    // Salvar erro no log para retry manual
    if (logId) {
      await prisma.webhookLog
        .update({
          where: { id: logId },
          data: { error: error instanceof Error ? error.message : 'Unknown error' },
        })
        .catch(() => {});
    }
  }

  // SEMPRE retornar 200 — NUNCA causar pausa na fila do Asaas
  return NextResponse.json({ received: true });
}
