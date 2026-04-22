/**
 * Serviço de checkout Asaas
 *
 * Fluxo de assinatura recorrente mensal:
 * 1. findOrCreateCustomer → garante que existe um customer no Asaas
 * 2. createAsaasSubscription → cria assinatura recorrente MONTHLY
 *    - POST /v3/subscriptions com cycle: "MONTHLY"
 *    - Asaas gera automaticamente a cobrança todo mês
 * 3. Webhook PAYMENT_CONFIRMED → ativa o plano
 * 4. Webhook PAYMENT_RECEIVED → confirma recebimento (crédito 30d após confirmed)
 * 5. Webhook SUBSCRIPTION_INACTIVATED → downgrade para FREE
 *
 * Referência: https://docs.asaas.com/docs/criando-uma-assinatura
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { asaas } from './client';
import type { AsaasBillingType, AsaasSubscriptionCycle } from './types';

// ============================================================================
// Planos disponíveis — APENAS RECORRÊNCIA MENSAL
// ============================================================================

export const ASAAS_PLANS = {
  // Essencial — R$ 19,99/mês — SEM IA
  BASIC_MONTHLY: {
    name: 'Essencial',
    tier: 'BASIC' as const,
    value: 19.99,
    cycle: 'MONTHLY' as AsaasSubscriptionCycle,
    description: 'Simulai OAB Essencial - Recorrência Mensal',
  },
  // Pro — R$ 89,99/mês — COM IA
  PRO_MONTHLY: {
    name: 'Pro',
    tier: 'PRO' as const,
    value: 89.99,
    cycle: 'MONTHLY' as AsaasSubscriptionCycle,
    description: 'Simulai OAB Pro - Recorrência Mensal (com IA)',
  },
} as const;

export type AsaasPlanKey = keyof typeof ASAAS_PLANS;

/**
 * Resolver plan key a partir de tier + cycle
 * Como agora só tem MONTHLY, simplifica a lógica
 */
export function resolveAsaasPlanKey(tier: string, _cycle?: string): AsaasPlanKey | null {
  const key = `${tier}_MONTHLY` as AsaasPlanKey;
  return key in ASAAS_PLANS ? key : null;
}

// ============================================================================
// Find or Create Customer
// ============================================================================

export async function findOrCreateAsaasCustomer(
  userId: string,
  data: { name: string; email: string; cpfCnpj: string; phone?: string }
): Promise<string> {
  // 1. Verificar se já temos customer no banco
  const existing = await prisma.customer.findFirst({
    where: { userId, gateway: 'asaas' },
  });

  if (existing?.asaasCustomerId) {
    return existing.asaasCustomerId;
  }

  // 2. Verificar se já existe no Asaas por email (404 = não encontrado, segue pro create)
  try {
    const asaasSearch = await asaas.getCustomerByEmail(data.email);
    if (asaasSearch.data && asaasSearch.data.length > 0) {
      const asaasCustomer = asaasSearch.data[0];

      // Salvar/atualizar no banco
      await prisma.customer.upsert({
        where: { userId },
        update: {
          asaasCustomerId: asaasCustomer.id,
          gateway: 'asaas',
          cpfCnpj: data.cpfCnpj,
        },
        create: {
          userId,
          asaasCustomerId: asaasCustomer.id,
          gateway: 'asaas',
          name: data.name,
          email: data.email,
          cpfCnpj: data.cpfCnpj,
          phone: data.phone,
        },
      });

      return asaasCustomer.id;
    }
  } catch (searchError) {
    // 404 ou outro erro na busca — seguir para criação
    logger.info('[ASAAS_CHECKOUT] Busca por email falhou, criando novo customer', {
      email: data.email,
      error: searchError instanceof Error ? searchError.message : String(searchError),
    });
  }

  // 3. Criar novo customer no Asaas (POST /v3/customers)
  const newCustomer = await asaas.createCustomer({
    name: data.name,
    email: data.email,
    cpfCnpj: data.cpfCnpj,
    mobilePhone: data.phone,
    externalReference: userId,
    notificationDisabled: false,
  });

  // 4. Salvar no banco
  await prisma.customer.upsert({
    where: { userId },
    update: {
      asaasCustomerId: newCustomer.id,
      gateway: 'asaas',
      cpfCnpj: data.cpfCnpj,
    },
    create: {
      userId,
      asaasCustomerId: newCustomer.id,
      gateway: 'asaas',
      name: data.name,
      email: data.email,
      cpfCnpj: data.cpfCnpj,
      phone: data.phone,
    },
  });

  logger.info('[ASAAS_CHECKOUT] Customer criado', {
    userId,
    asaasCustomerId: newCustomer.id,
  });

  return newCustomer.id;
}

// ============================================================================
// Create Subscription (Recorrência Mensal)
// ============================================================================

/**
 * Cria assinatura recorrente mensal no Asaas
 *
 * POST /v3/subscriptions
 * - customer: ID do customer no Asaas (cus_xxx)
 * - billingType: "BOLETO" | "CREDIT_CARD" | "PIX"
 * - value: valor mensal (19.99 ou 89.99)
 * - nextDueDate: data da primeira cobrança (YYYY-MM-DD)
 * - cycle: "MONTHLY" (recorrência mensal)
 * - description: descrição da assinatura
 * - externalReference: nosso userId (para rastreamento)
 *
 * Fluxo de eventos webhook após criação:
 * 1. SUBSCRIPTION_CREATED → assinatura criada
 * 2. PAYMENT_CREATED → primeira cobrança gerada
 * 3. PAYMENT_CONFIRMED → pagamento confirmado (cartão/PIX)
 * 4. PAYMENT_RECEIVED → pagamento recebido (crédito disponível)
 */
export async function createAsaasSubscription(params: {
  userId: string;
  asaasCustomerId: string;
  plan: AsaasPlanKey;
  billingType: AsaasBillingType;
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
}) {
  const planConfig = ASAAS_PLANS[params.plan];

  // P1 FIX — evitar assinaturas duplicadas.
  // Se o cliente tenta pagar 2x (PIX travou, troca pra cartão, etc), cancela
  // a anterior antes de criar nova pra não ficar com cobrança dupla.
  const existing = await prisma.subscription.findMany({
    where: {
      customer: { userId: params.userId },
      gateway: 'asaas',
      status: { in: ['ACTIVE', 'PAST_DUE'] },
    },
  });
  for (const sub of existing) {
    if (!sub.asaasSubscriptionId) continue;
    try {
      await asaas.cancelSubscription(sub.asaasSubscriptionId);
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'CANCELED', canceledAt: new Date(), cancelAtPeriodEnd: true },
      });
      logger.info('[ASAAS_CHECKOUT] Subscription anterior cancelada (evita duplicata)', {
        userId: params.userId,
        oldSubscriptionId: sub.asaasSubscriptionId,
      });
    } catch (err) {
      logger.warn('[ASAAS_CHECKOUT] Falha ao cancelar subscription anterior', {
        userId: params.userId,
        oldSubscriptionId: sub.asaasSubscriptionId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Data de vencimento: hoje + 1 dia (dar tempo de gerar PIX/boleto)
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + 1);
  const formattedDate = nextDueDate.toISOString().split('T')[0];

  // POST /v3/subscriptions — Assinatura recorrente mensal
  const subscription = await asaas.createSubscription({
    customer: params.asaasCustomerId,
    billingType: params.billingType,
    value: planConfig.value,
    nextDueDate: formattedDate,
    cycle: 'MONTHLY', // SEMPRE mensal
    description: planConfig.description,
    externalReference: params.userId,
    creditCard: params.creditCard,
    creditCardHolderInfo: params.creditCardHolderInfo,
  });

  logger.info('[ASAAS_CHECKOUT] Assinatura recorrente mensal criada', {
    userId: params.userId,
    subscriptionId: subscription.id,
    plan: params.plan,
    value: planConfig.value,
    billingType: params.billingType,
    cycle: 'MONTHLY',
  });

  return subscription;
}

// ============================================================================
// Cancel Subscription
// ============================================================================

export async function cancelAsaasSubscription(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      customer: { userId },
      gateway: 'asaas',
      status: 'ACTIVE',
    },
  });

  if (!subscription?.asaasSubscriptionId) {
    throw new Error('Assinatura Asaas ativa não encontrada');
  }

  // DELETE /v3/subscriptions/{id}
  await asaas.cancelSubscription(subscription.asaasSubscriptionId);

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
      cancelAtPeriodEnd: true,
    },
  });

  logger.info('[ASAAS_CHECKOUT] Assinatura cancelada', {
    userId,
    subscriptionId: subscription.asaasSubscriptionId,
  });
}

// ============================================================================
// Get PIX QR Code (para pagamentos pendentes)
// ============================================================================

export async function getPaymentPixQrCode(paymentId: string) {
  return asaas.getPaymentPixQrCode(paymentId);
}
