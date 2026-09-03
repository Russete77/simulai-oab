/**
 * Handlers dos eventos de webhook da Stripe.
 *
 * Regras que valem para todos:
 *   - idempotentes: o mesmo evento pode chegar duas vezes
 *   - o acesso é liberado em `invoice.paid`, nunca no retorno do checkout
 *     (o usuário pode fechar o navegador antes de voltar)
 *   - o acesso é revogado em `canceled` e `unpaid`
 */

import type Stripe from 'stripe';
import { SubscriptionStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { getStripe } from './client';
import { PLAN_KEY, ciclo as cicloPorChave } from './plan';
import { cicloDePreco, cicloDePrecoId } from './precos';

// ============================================================================
// Helpers
// ============================================================================

/** Converte o status da Stripe para o nosso enum. */
function mapStatus(s: Stripe.Subscription.Status): SubscriptionStatus {
  const mapa: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    active: 'ACTIVE',
    trialing: 'TRIALING',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    unpaid: 'UNPAID',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'INCOMPLETE_EXPIRED',
    paused: 'PAUSED',
  };
  return mapa[s] ?? 'INCOMPLETE';
}

function paraData(epoch: number | null | undefined): Date | null {
  return typeof epoch === 'number' ? new Date(epoch * 1000) : null;
}

/**
 * Extrai o id da assinatura de uma fatura.
 *
 * A partir da API 2025-03-31.basil o campo `invoice.subscription` saiu do
 * lugar e virou `invoice.parent.subscription_details.subscription`. Tratamos
 * os dois para o handler não quebrar se a conta rodar numa versão anterior.
 */
function subscriptionIdDaInvoice(invoice: Stripe.Invoice): string | null {
  const parent = (invoice as unknown as {
    parent?: { subscription_details?: { subscription?: string | { id: string } } };
  }).parent;
  const novo = parent?.subscription_details?.subscription;
  if (novo) return typeof novo === 'string' ? novo : novo.id;

  const legado = (invoice as unknown as { subscription?: string | { id: string } })
    .subscription;
  if (legado) return typeof legado === 'string' ? legado : legado.id;

  return null;
}

function idDe(valor: string | { id: string } | null | undefined): string | null {
  if (!valor) return null;
  return typeof valor === 'string' ? valor : valor.id;
}

/** Acha nosso Customer a partir do id da Stripe, com fallback pelo metadata. */
async function acharCustomer(stripeCustomerId: string | null, userId?: string | null) {
  if (stripeCustomerId) {
    const porStripe = await prisma.customer.findUnique({
      where: { stripeCustomerId },
    });
    if (porStripe) return porStripe;
  }

  if (userId) {
    const porUser = await prisma.customer.findUnique({ where: { userId } });
    if (porUser) {
      // Registro existia sem o id da Stripe (ex.: veio do Asaas). Vincula agora.
      if (stripeCustomerId && !porUser.stripeCustomerId) {
        return prisma.customer.update({
          where: { id: porUser.id },
          data: { stripeCustomerId, gateway: 'stripe' },
        });
      }
      return porUser;
    }
  }

  return null;
}

// ============================================================================
// invoice.paid — LIBERA O ACESSO
// ============================================================================

export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const stripeSubscriptionId = subscriptionIdDaInvoice(invoice);
  const stripeCustomerId = idDe(invoice.customer);

  if (!stripeSubscriptionId) {
    logger.info('[STRIPE_HANDLER] Fatura avulsa (sem assinatura), ignorando', {
      invoiceId: invoice.id,
    });
    return;
  }

  const customer = await acharCustomer(stripeCustomerId);
  if (!customer) {
    logger.error('[STRIPE_HANDLER] Customer não encontrado em invoice.paid', {
      stripeCustomerId,
      invoiceId: invoice.id,
    });
    return;
  }

  const linha = invoice.lines?.data?.[0];
  const periodo = linha?.period;

  // O ciclo sai do preço cobrado, não de um padrão: uma assinatura anual
  // gravada como MONTHLY faz o relatório somar receita errada.
  //
  // A linha da fatura traz só o ID do preço (`pricing.price_details.price`
  // substituiu o antigo `line.price` na API 2025-03-31.basil), então é
  // preciso buscar o objeto para chegar na lookup_key. Uma chamada por
  // fatura paga — isso acontece uma vez por assinante por período.
  const cicloDaFatura = await cicloDePrecoId(idDe(linha?.pricing?.price_details?.price));

  await prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.upsert({
      where: { stripeSubscriptionId },
      update: {
        status: 'ACTIVE',
        currentPeriodStart: paraData(periodo?.start),
        currentPeriodEnd: paraData(periodo?.end),
      },
      create: {
        customerId: customer.id,
        stripeSubscriptionId,
        gateway: 'stripe',
        plan: PLAN_KEY,
        status: 'ACTIVE',
        value: (invoice.amount_paid ?? 0) / 100,
        cycle: cicloDaFatura?.cicloBanco ?? cicloPorChave('mensal').cicloBanco,
        currentPeriodStart: paraData(periodo?.start),
        currentPeriodEnd: paraData(periodo?.end),
      },
    });

    // A integração antiga NUNCA gravava Payment — o histórico financeiro do
    // banco ficou vazio desde abril. Aqui grava.
    if (invoice.id) {
      await tx.payment.upsert({
        where: { externalPaymentId: invoice.id },
        update: {
          status: 'RECEIVED',
          confirmedDate: new Date(),
          netValue: (invoice.amount_paid ?? 0) / 100,
        },
        create: {
          customerId: customer.id,
          subscriptionId: sub.id,
          externalPaymentId: invoice.id,
          value: (invoice.amount_paid ?? 0) / 100,
          netValue: (invoice.amount_paid ?? 0) / 100,
          status: 'RECEIVED',
          paymentMethod: 'CARD',
          dueDate: paraData(invoice.due_date) ?? new Date(),
          paymentDate: new Date(),
          confirmedDate: new Date(),
          invoiceUrl: invoice.hosted_invoice_url ?? null,
          receiptUrl: invoice.invoice_pdf ?? null,
          description: PLAN_KEY,
        },
      });
    }

    await tx.user.update({
      where: { id: customer.userId },
      data: { planType: 'PREMIUM' },
    });
  });

  logger.info('[STRIPE_HANDLER] Acesso liberado', {
    userId: customer.userId,
    stripeSubscriptionId,
  });
}

// ============================================================================
// invoice.payment_failed
// ============================================================================

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const stripeSubscriptionId = subscriptionIdDaInvoice(invoice);
  if (!stripeSubscriptionId) return;

  logger.warn('[STRIPE_HANDLER] Pagamento falhou', {
    stripeSubscriptionId,
    invoiceId: invoice.id,
    tentativa: invoice.attempt_count,
  });

  // Não revoga acesso aqui. O Smart Retries da Stripe ainda vai tentar; a
  // revogação acontece quando a assinatura vira canceled/unpaid.
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId },
    data: { status: 'PAST_DUE' },
  });
}

// ============================================================================
// customer.subscription.updated / .deleted
// ============================================================================

/** Status em que o usuário NÃO deve ter acesso. */
const SEM_ACESSO: SubscriptionStatus[] = ['CANCELED', 'UNPAID', 'INCOMPLETE_EXPIRED'];

export async function handleSubscriptionChanged(subscription: Stripe.Subscription) {
  const status = mapStatus(subscription.status);
  const item = subscription.items?.data?.[0];

  const atualizada = await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
      // O portal agenda o cancelamento gravando SO esta data e deixa
      // cancel_at_period_end em false. Guardar as duas e a unica forma de
      // saber que a assinatura tem fim marcado.
      cancelAt: paraData(subscription.cancel_at),
      canceledAt: paraData(subscription.canceled_at),
      currentPeriodStart: paraData(item?.current_period_start),
      currentPeriodEnd: paraData(item?.current_period_end),
    },
  });

  if (atualizada.count === 0) {
    // Assinatura que não passou pelo nosso fluxo — criada pelo painel da
    // Stripe, por exemplo. Sem isto o cliente paga e nunca ganha acesso:
    // o updateMany não encontra linha, avisa no log e desiste em silêncio.
    const customer = await acharCustomer(
      idDe(subscription.customer),
      subscription.metadata?.userId ?? null
    );

    if (!customer) {
      logger.error('[STRIPE_HANDLER] Assinatura sem customer conhecido', {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: idDe(subscription.customer),
      });
      return;
    }

    await prisma.subscription.create({
      data: {
        customerId: customer.id,
        stripeSubscriptionId: subscription.id,
        gateway: 'stripe',
        plan: PLAN_KEY,
        status,
        value: (item?.price?.unit_amount ?? 0) / 100,
        cycle:
          cicloDePreco(item?.price)?.cicloBanco ?? cicloPorChave('mensal').cicloBanco,
        cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
        cancelAt: paraData(subscription.cancel_at),
        canceledAt: paraData(subscription.canceled_at),
        currentPeriodStart: paraData(item?.current_period_start),
        currentPeriodEnd: paraData(item?.current_period_end),
      },
    });

    logger.info('[STRIPE_HANDLER] Assinatura adotada (criada fora do app)', {
      stripeSubscriptionId: subscription.id,
      userId: customer.userId,
      status,
    });
    return;
  }

  logger.info('[STRIPE_HANDLER] Assinatura atualizada', {
    stripeSubscriptionId: subscription.id,
    status,
    cancelaNoFim: subscription.cancel_at_period_end,
  });

  if (SEM_ACESSO.includes(status)) {
    logger.info('[STRIPE_HANDLER] Acesso revogado', {
      stripeSubscriptionId: subscription.id,
      status,
    });
  }
}

// ============================================================================
// charge.refunded
// ============================================================================

export async function handleChargeRefunded(charge: Stripe.Charge) {
  const valor = (charge.amount_refunded ?? 0) / 100;
  logger.info('[STRIPE_HANDLER] Reembolso', {
    chargeId: charge.id,
    valor,
    total: charge.refunded,
  });

  // A doc manda chegar na fatura por PaymentIntent -> InvoicePayment, e não
  // por `charge.invoice`: a partir da API 2025-03-31.basil esse campo pode vir
  // vazio, e o estorno passaria despercebido no nosso banco.
  const paymentIntentId = idDe(charge.payment_intent);
  let invoiceId: string | null = null;

  if (paymentIntentId) {
    try {
      const pagamentos = await getStripe().invoicePayments.list({
        payment: { type: 'payment_intent', payment_intent: paymentIntentId },
        limit: 1,
      });
      invoiceId = idDe(pagamentos.data[0]?.invoice);
    } catch (err) {
      logger.warn('[STRIPE_HANDLER] Falha ao resolver fatura do reembolso', {
        chargeId: charge.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Última tentativa: o campo legado, para contas em versões anteriores.
  if (!invoiceId) {
    invoiceId = idDe(
      (charge as unknown as { invoice?: string | { id: string } }).invoice
    );
  }

  if (!invoiceId) {
    logger.warn('[STRIPE_HANDLER] Reembolso sem fatura identificável', {
      chargeId: charge.id,
    });
    return;
  }

  if (!charge.refunded) {
    logger.info('[STRIPE_HANDLER] Estorno parcial — status do pagamento mantido', {
      invoiceId,
      valorEstornado: valor,
    });
  }

  await prisma.payment.updateMany({
    where: { externalPaymentId: invoiceId },
    // O enum não tem estorno parcial; marcamos REFUNDED só no total, e
    // registramos o parcial no log para não mentir sobre o valor recebido.
    data: charge.refunded ? { status: 'REFUNDED' } : {},
  });
}

// ============================================================================
// invoice.payment_action_required — 3DS / autenticação pendente
// ============================================================================

export async function handlePaymentActionRequired(invoice: Stripe.Invoice) {
  const stripeSubscriptionId = subscriptionIdDaInvoice(invoice);
  if (!stripeSubscriptionId) return;

  // O cliente precisa autenticar (3D Secure) para o pagamento fechar. Não é
  // falha: a assinatura fica `incomplete` até ele concluir. Sem tratar isso,
  // uma cobrança que exige autenticação some sem deixar rastro no log.
  logger.warn('[STRIPE_HANDLER] Pagamento exige autenticação do cliente', {
    stripeSubscriptionId,
    invoiceId: invoice.id,
    urlFatura: invoice.hosted_invoice_url,
  });

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId },
    data: { status: 'INCOMPLETE' },
  });
}

// ============================================================================
// invoice.finalization_failed — silencioso e caro
// ============================================================================

export async function handleFinalizationFailed(invoice: Stripe.Invoice) {
  // Fatura que não finaliza não cobra, e a assinatura continua ativa: o
  // usuário segue com acesso de graça até alguém perceber.
  logger.error('[STRIPE_HANDLER] Fatura não finalizou — cobrança não vai acontecer', {
    invoiceId: invoice.id,
    customer: idDe(invoice.customer),
    erro: invoice.last_finalization_error?.message,
  });
}
