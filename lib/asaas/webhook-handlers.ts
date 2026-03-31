/**
 * Handlers de webhook do Asaas — lógica de negócio por evento
 *
 * Cada handler recebe o payload completo e executa a ação correspondente.
 * Todos devem ser idempotentes (safe to call multiple times).
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { getServicoEmail } from '@/lib/email/servico-email';
import type { AsaasWebhookPayload } from './types';
import { ASAAS_PLANS, type AsaasPlanKey } from './checkout';

// ============================================================================
// PAYMENT_CONFIRMED / PAYMENT_RECEIVED
// Pagamento confirmado → ativar assinatura premium
// ============================================================================

export async function handlePaymentConfirmed(payload: AsaasWebhookPayload) {
  const payment = payload.payment;
  if (!payment) {
    logger.warn('[ASAAS_HANDLER] PAYMENT_CONFIRMED sem dados de payment');
    return;
  }

  logger.info('[ASAAS_HANDLER] Processando pagamento confirmado', {
    paymentId: payment.id,
    subscriptionId: payment.subscription,
    value: payment.value,
    billingType: payment.billingType,
  });

  // Só processar pagamentos vinculados a assinatura
  if (!payment.subscription) {
    logger.info('[ASAAS_HANDLER] Pagamento avulso (sem subscription), ignorando');
    return;
  }

  // Buscar customer no banco pelo asaasCustomerId
  const customer = await prisma.customer.findFirst({
    where: { asaasCustomerId: payment.customer },
    include: { user: true },
  });

  if (!customer) {
    // Fallback: tentar por externalReference (userId)
    if (payment.externalReference) {
      const user = await prisma.user.findUnique({
        where: { id: payment.externalReference },
      });

      if (user) {
        await activatePremium(user.id, payment.subscription, payment.customer, payment.paymentDate, payment.value);
        return;
      }
    }

    logger.error('[ASAAS_HANDLER] Customer não encontrado no banco', {
      asaasCustomerId: payment.customer,
      externalReference: payment.externalReference,
    });
    return;
  }

  await activatePremium(
    customer.userId,
    payment.subscription,
    payment.customer,
    payment.paymentDate,
    payment.value
  );

  // Enviar email de confirmação
  try {
    const servicoEmail = getServicoEmail();
    const detectedPlan = detectPlanFromValue(payment.value);
    const planName = detectedPlan ? ASAAS_PLANS[detectedPlan as AsaasPlanKey].name : 'Premium';
    await servicoEmail.enviarPagamentoConfirmado({
      destinatario: customer.email,
      nomeUsuario: customer.name,
      nomePlano: planName,
      valor: String(payment.value),
      dataCobranca: calculatePeriodEnd(payment.paymentDate || new Date().toISOString(), 'MONTHLY'),
    });
  } catch (emailError) {
    logger.error('[ASAAS_HANDLER] Erro ao enviar email de confirmação', {
      error: emailError instanceof Error ? emailError.message : String(emailError),
    });
  }
}

// ============================================================================
// PAYMENT_OVERDUE
// Pagamento atrasado → notificar, mas NÃO cancelar (dar grace period)
// ============================================================================

export async function handlePaymentOverdue(payload: AsaasWebhookPayload) {
  const payment = payload.payment;
  if (!payment) return;

  logger.warn('[ASAAS_HANDLER] Pagamento atrasado', {
    paymentId: payment.id,
    customer: payment.customer,
    dueDate: payment.dueDate,
  });

  const customer = await prisma.customer.findFirst({
    where: { asaasCustomerId: payment.customer },
    include: { user: true },
  });

  if (!customer) return;

  // Atualizar status da subscription para PAST_DUE
  if (payment.subscription) {
    await prisma.subscription.updateMany({
      where: {
        asaasSubscriptionId: payment.subscription,
        customerId: customer.id,
      },
      data: { status: 'PAST_DUE' },
    });
  }

  // Enviar email de pagamento atrasado
  try {
    const servicoEmail = getServicoEmail();
    await servicoEmail.enviarPagamentoFalhou({
      destinatario: customer.email,
      nomeUsuario: customer.name,
      nomePlano: detectPlanFromValue(payment.value) ? ASAAS_PLANS[detectPlanFromValue(payment.value) as AsaasPlanKey].name : 'Premium',
      valor: String(payment.value),
    });
  } catch (emailError) {
    logger.error('[ASAAS_HANDLER] Erro ao enviar email de pagamento atrasado', {
      error: emailError instanceof Error ? emailError.message : String(emailError),
    });
  }
}

// ============================================================================
// PAYMENT_REFUNDED / PAYMENT_DELETED
// Pagamento estornado → manter premium até fim do período
// ============================================================================

export async function handlePaymentRefunded(payload: AsaasWebhookPayload) {
  const payment = payload.payment;
  if (!payment) return;

  logger.info('[ASAAS_HANDLER] Pagamento estornado/deletado', {
    paymentId: payment.id,
    status: payment.status,
  });

  // Registrar no banco para auditoria, mas NÃO cancelar automaticamente
  // O cancelamento acontece via SUBSCRIPTION_INACTIVATED
}

// ============================================================================
// SUBSCRIPTION_INACTIVATED / SUBSCRIPTION_DELETED
// Assinatura cancelada → downgrade para FREE
// ============================================================================

export async function handleSubscriptionInactivated(payload: AsaasWebhookPayload) {
  const sub = payload.subscription;
  if (!sub) {
    logger.warn('[ASAAS_HANDLER] SUBSCRIPTION_INACTIVATED sem dados de subscription');
    return;
  }

  logger.info('[ASAAS_HANDLER] Assinatura inativada/deletada', {
    subscriptionId: sub.id,
    customer: sub.customer,
  });

  const customer = await prisma.customer.findFirst({
    where: { asaasCustomerId: sub.customer },
    include: { user: true },
  });

  if (!customer) {
    // Fallback por externalReference
    if (sub.externalReference) {
      await deactivatePremium(sub.externalReference, sub.id);
      return;
    }
    logger.error('[ASAAS_HANDLER] Customer não encontrado para cancelamento', {
      asaasCustomerId: sub.customer,
    });
    return;
  }

  await deactivatePremium(customer.userId, sub.id);

  // Enviar email de cancelamento
  try {
    const servicoEmail = getServicoEmail();
    await servicoEmail.enviarAssinaturaCancelada({
      destinatario: customer.email,
      nomeUsuario: customer.name,
      dataTermino: new Date().toLocaleDateString('pt-BR'),
    });
  } catch (emailError) {
    logger.error('[ASAAS_HANDLER] Erro ao enviar email de cancelamento', {
      error: emailError instanceof Error ? emailError.message : String(emailError),
    });
  }
}

// ============================================================================
// HELPERS
// ============================================================================

async function activatePremium(
  userId: string,
  asaasSubscriptionId: string,
  asaasCustomerId: string,
  paymentDate?: string | null,
  paymentValue?: number
) {
  // Detectar plano pelo valor pago
  const planKey = detectPlanFromValue(paymentValue) || 'BASIC_MONTHLY';
  const planConfig = ASAAS_PLANS[planKey as AsaasPlanKey];
  const nextPeriodEnd = calculatePeriodEnd(paymentDate || new Date().toISOString(), planConfig.cycle);

  // P0 FIX: Transação atômica — subscription + user update devem ser consistentes
  await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findFirst({
      where: { userId },
    });

    if (customer) {
      await tx.subscription.upsert({
        where: { asaasSubscriptionId },
        update: {
          status: 'ACTIVE',
          plan: planKey,
          value: planConfig.value,
          cycle: planConfig.cycle,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(nextPeriodEnd),
        },
        create: {
          customerId: customer.id,
          asaasSubscriptionId,
          gateway: 'asaas',
          plan: planKey,
          status: 'ACTIVE',
          value: planConfig.value,
          cycle: planConfig.cycle,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(nextPeriodEnd),
        },
      });
    }

    await tx.user.update({
      where: { id: userId },
      data: { planType: planConfig.tier },
    });
  });

  logger.info('[ASAAS_HANDLER] Plano ativado', { userId, asaasSubscriptionId, plan: planKey, tier: planConfig.tier });
}

async function deactivatePremium(userId: string, asaasSubscriptionId: string) {
  // P0 FIX: Transação atômica — cancelamento deve ser consistente
  await prisma.$transaction(async (tx) => {
    await tx.subscription.updateMany({
      where: { asaasSubscriptionId },
      data: { status: 'CANCELED', canceledAt: new Date() },
    });

    await tx.user.update({
      where: { id: userId },
      data: { planType: 'FREE' },
    });
  });

  logger.info('[ASAAS_HANDLER] Premium desativado', { userId, asaasSubscriptionId });
}

function calculatePeriodEnd(fromDate: string, cycle: string): string {
  const date = new Date(fromDate);
  // Todos os planos são MONTHLY agora
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

function detectPlanFromValue(value?: number): AsaasPlanKey | null {
  if (!value) return null;
  // Encontrar plano pelo valor exato (com tolerância de R$0.10 para arredondamentos)
  for (const [key, plan] of Object.entries(ASAAS_PLANS)) {
    if (Math.abs(plan.value - value) < 0.1) {
      return key as AsaasPlanKey;
    }
  }
  return null;
}

function translateBillingType(type: string): string {
  const map: Record<string, string> = {
    BOLETO: 'Boleto Bancário',
    CREDIT_CARD: 'Cartão de Crédito',
    PIX: 'PIX',
    UNDEFINED: 'A definir',
  };
  return map[type] || type;
}
