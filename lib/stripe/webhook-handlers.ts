// @ts-nocheck
/**
 * Stripe Webhook Handlers
 * Funções para processar eventos do Stripe e sincronizar com o banco
 */

import { prisma } from '@/lib/db/prisma';
import Stripe from 'stripe';
import { getServicoEmail } from '@/lib/email/servico-email';

const servicoEmail = getServicoEmail();

/**
 * Mapeia status do Stripe para nosso enum
 */
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
  const statusMap: Record<Stripe.Subscription.Status, string> = {
    active: 'ACTIVE',
    trialing: 'TRIALING',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    unpaid: 'UNPAID',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'INCOMPLETE_EXPIRED',
    paused: 'PAUSED',
  };

  return statusMap[stripeStatus] || 'ACTIVE';
}

/**
 * Mapeia payment method do Stripe para nosso enum
 */
function mapPaymentMethod(
  paymentMethodType: string | null
): 'CARD' | 'BOLETO' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'CASH_APP_PAY' | 'ACH_DEBIT' | 'OTHER' {
  if (!paymentMethodType) return 'OTHER';

  const methodMap: Record<string, any> = {
    card: 'CARD',
    boleto: 'BOLETO',
    apple_pay: 'APPLE_PAY',
    google_pay: 'GOOGLE_PAY',
    cashapp: 'CASH_APP_PAY',
    us_bank_account: 'ACH_DEBIT',
  };

  return methodMap[paymentMethodType] || 'OTHER';
}

/**
 * Handler: checkout.session.completed
 * Quando um checkout é completado com sucesso
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  console.log('[WEBHOOK] Processing checkout.session.completed:', session.id);

  const clerkUserId = session.metadata?.clerk_user_id;
  if (!clerkUserId) {
    throw new Error('Missing clerk_user_id in session metadata');
  }

  // Buscar usuário
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    include: { customer: true },
  });

  if (!user) {
    throw new Error(`User not found: ${clerkUserId}`);
  }

  // Criar ou atualizar customer
  const stripeCustomerId = session.customer as string;
  let customer = user.customer;

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        userId: user.id,
        stripeCustomerId,
        name: user.name || 'Unknown',
        email: user.email,
        cpfCnpj: '', // Campo obrigatório no banco
        phone: '', // Campo obrigatório no banco
      },
    });
  } else if (customer.stripeCustomerId !== stripeCustomerId) {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: { stripeCustomerId },
    });
  }

  // Se for subscription, será tratado no evento subscription.created
  console.log('[WEBHOOK] Checkout completed processed successfully');
}

/**
 * Handler: customer.subscription.created
 * Quando uma nova assinatura é criada
 */
export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('[WEBHOOK] Processing subscription.created:', subscription.id);

  const clerkUserId = subscription.metadata?.clerk_user_id;
  if (!clerkUserId) {
    throw new Error('Missing clerk_user_id in subscription metadata');
  }

  // Buscar usuário e customer
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    include: { customer: true },
  });

  if (!user) {
    throw new Error(`User not found: ${clerkUserId}`);
  }

  // Criar customer se não existir
  let customer = user.customer;
  if (!customer) {
    const stripeCustomerId = subscription.customer as string;
    customer = await prisma.customer.create({
      data: {
        userId: user.id,
        stripeCustomerId,
        name: user.name || 'Unknown',
        email: user.email,
        cpfCnpj: '', // Campo obrigatório no banco, mas não coletamos no webhook
        phone: '', // Campo obrigatório no banco
      },
    });
    console.log('[WEBHOOK] Customer created:', customer.id);
  }

  const priceId = subscription.items.data[0]?.price.id;
  const productId = subscription.items.data[0]?.price.product as string;
  const amount = subscription.items.data[0]?.price.unit_amount || 0;

  // Determinar plano baseado no priceId (isso deve ser mapeado com seus planos)
  const plan = determinePlanFromPriceId(priceId);

  // Criar subscription no banco
  await prisma.subscription.create({
    data: {
      customerId: customer.id,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeProductId: productId,
      plan,
      status: mapStripeStatus(subscription.status) as any,
      value: amount / 100, // Stripe usa centavos
      cycle: determineCycleFromPrice(priceId),
      currentPeriodStart: subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000)
        : null,
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialStart: subscription.trial_start
        ? new Date(subscription.trial_start * 1000)
        : null,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
      metadata: subscription.metadata as any,
    },
  });

  // Atualizar planType do usuário
  const planType = determinePlanTypeFromPlan(plan);
  await prisma.user.update({
    where: { id: user.id },
    data: { planType },
  });

  // Enviar email de boas-vindas
  try {
    const proximaCobranca = new Date(subscription.current_period_end * 1000).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    await servicoEmail.enviarAssinaturaCriada({
      destinatario: user.email,
      nomeUsuario: user.name || 'Estudante',
      nomePlano: plan.replace('_', ' '),
      valorMensal: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(amount / 100),
      proximaCobranca,
    });
  } catch (emailError) {
    console.error('[WEBHOOK] Erro ao enviar email de assinatura criada:', emailError);
  }

  console.log('[WEBHOOK] Subscription created successfully');
}

/**
 * Handler: customer.subscription.updated
 * Quando uma assinatura é atualizada
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('[WEBHOOK] Processing subscription.updated:', subscription.id);

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    include: { customer: { include: { user: true } } },
  });

  if (!dbSubscription) {
    console.warn(`Subscription not found in DB: ${subscription.id}`);
    return;
  }

  const amount = subscription.items.data[0]?.price.unit_amount || 0;
  const priceId = subscription.items.data[0]?.price.id;
  const plan = determinePlanFromPriceId(priceId);

  // Atualizar subscription
  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: mapStripeStatus(subscription.status) as any,
      value: amount / 100,
      stripePriceId: priceId,
      plan,
      currentPeriodStart: subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000)
        : null,
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
    },
  });

  // Atualizar planType do usuário se necessário
  const planType = determinePlanTypeFromPlan(plan);
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    await prisma.user.update({
      where: { id: dbSubscription.customer.user.id },
      data: { planType },
    });
  } else if (subscription.status === 'canceled') {
    await prisma.user.update({
      where: { id: dbSubscription.customer.user.id },
      data: { planType: 'FREE' },
    });
  }

  console.log('[WEBHOOK] Subscription updated successfully');
}

/**
 * Handler: customer.subscription.deleted
 * Quando uma assinatura é cancelada/deletada
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('[WEBHOOK] Processing subscription.deleted:', subscription.id);

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    include: { customer: { include: { user: true } } },
  });

  if (!dbSubscription) {
    console.warn(`Subscription not found in DB: ${subscription.id}`);
    return;
  }

  // Atualizar status da subscription
  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
      endDate: new Date(),
    },
  });

  // Reverter usuário para plano FREE
  await prisma.user.update({
    where: { id: dbSubscription.customer.user.id },
    data: { planType: 'FREE' },
  });

  console.log('[WEBHOOK] Subscription deleted successfully');
}

/**
 * Handler: invoice.payment_succeeded
 * Quando um pagamento é bem-sucedido
 */
export async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<void> {
  console.log('[WEBHOOK] Processing invoice.payment_succeeded:', invoice.id);

  if (!invoice.subscription) {
    console.log('Invoice not related to subscription, skipping');
    return;
  }

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: invoice.subscription as string },
    include: { customer: true },
  });

  if (!dbSubscription) {
    console.warn(`Subscription not found: ${invoice.subscription}`);
    return;
  }

  // Criar registro de pagamento
  await prisma.payment.create({
    data: {
      customerId: dbSubscription.customerId,
      subscriptionId: dbSubscription.id,
      stripePaymentId: invoice.charge as string,
      stripePaymentIntentId: invoice.payment_intent as string,
      stripeInvoiceId: invoice.id,
      value: (invoice.amount_paid || 0) / 100,
      netValue: ((invoice.amount_paid || 0) - (invoice.application_fee_amount || 0)) / 100,
      status: 'CONFIRMED',
      paymentMethod: mapPaymentMethod(invoice.payment_intent as any),
      dueDate: new Date(invoice.created * 1000),
      paymentDate: new Date(invoice.status_transitions.paid_at! * 1000),
      confirmedDate: new Date(invoice.status_transitions.paid_at! * 1000),
      receiptUrl: invoice.hosted_invoice_url || null,
      invoiceUrl: invoice.invoice_pdf || null,
      description: invoice.description || `Payment for ${dbSubscription.plan}`,
    },
  });

  // Enviar email de confirmação de pagamento
  try {
    await servicoEmail.enviarPagamentoConfirmado({
      destinatario: dbSubscription.customer.user.email,
      nomeUsuario: dbSubscription.customer.user.name || 'Estudante',
      nomePlano: dbSubscription.plan.replace('_', ' '),
      valor: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format((invoice.amount_paid || 0) / 100),
      dataCobranca: new Date(invoice.created * 1000).toLocaleDateString('pt-BR'),
    });
  } catch (emailError) {
    console.error('[WEBHOOK] Erro ao enviar email de pagamento confirmado:', emailError);
  }

  console.log('[WEBHOOK] Payment recorded successfully');
}

/**
 * Handler: invoice.payment_failed
 * Quando um pagamento falha
 */
export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  console.log('[WEBHOOK] Processing invoice.payment_failed:', invoice.id);

  if (!invoice.subscription) {
    return;
  }

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: invoice.subscription as string },
    include: { customer: { include: { user: true } } },
  });

  if (!dbSubscription) {
    console.warn(`Subscription not found: ${invoice.subscription}`);
    return;
  }

  // Criar registro de pagamento falhado
  await prisma.payment.create({
    data: {
      customerId: dbSubscription.customerId,
      subscriptionId: dbSubscription.id,
      stripePaymentId: invoice.charge as string || `failed_${invoice.id}`,
      stripePaymentIntentId: invoice.payment_intent as string,
      stripeInvoiceId: invoice.id,
      value: (invoice.amount_due || 0) / 100,
      status: 'FAILED',
      paymentMethod: 'OTHER',
      dueDate: new Date(invoice.created * 1000),
      description: `Failed payment for ${dbSubscription.plan}`,
    },
  });

  // Enviar email notificando falha de pagamento
  try {
    await servicoEmail.enviarPagamentoFalhou({
      destinatario: dbSubscription.customer.user.email,
      nomeUsuario: dbSubscription.customer.user.name || 'Estudante',
      nomePlano: dbSubscription.plan.replace('_', ' '),
      valor: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format((invoice.amount_due || 0) / 100),
    });
  } catch (emailError) {
    console.error('[WEBHOOK] Erro ao enviar email de pagamento falhou:', emailError);
  }

  console.log('[WEBHOOK] Payment failure recorded');
}

/**
 * Determinar plano pelo priceId
 */
function determinePlanFromPriceId(priceId: string): string {
  const { getPlanFromPriceId, getPlanKey } = require('@/lib/billing/stripe-plan-mapping');
  const planConfig = getPlanFromPriceId(priceId);

  if (!planConfig) {
    console.warn(`Unknown priceId: ${priceId}, defaulting to BASIC_MONTHLY`);
    return 'BASIC_MONTHLY';
  }

  return getPlanKey(planConfig.tier, planConfig.cycle);
}

/**
 * Determinar ciclo pelo priceId
 */
function determineCycleFromPrice(priceId: string): string {
  const { getPlanFromPriceId } = require('@/lib/billing/stripe-plan-mapping');
  const planConfig = getPlanFromPriceId(priceId);

  return planConfig?.cycle || 'MONTHLY';
}

/**
 * Determinar PlanType pelo plano
 */
function determinePlanTypeFromPlan(
  plan: string
): 'FREE' | 'BASIC' | 'PRO' | 'PREMIUM' {
  if (plan.startsWith('BASIC')) return 'BASIC';
  if (plan.startsWith('PRO')) return 'PRO';
  if (plan.startsWith('PREMIUM')) return 'PREMIUM';
  return 'FREE';
}
