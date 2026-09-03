/**
 * Customer e portal da Stripe.
 *
 * O checkout NÃO mora aqui: ele acontece dentro do app, com o Payment
 * Element (app/assinar + app/api/billing/subscription). O Checkout hospedado
 * foi removido — redirecionava o aluno para um domínio da Stripe.
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { getStripe } from './client';

/**
 * Devolve o id do Customer na Stripe, criando se ainda não existir.
 * Grava `metadata.userId` para o webhook conseguir voltar ao nosso usuário
 * mesmo se o banco estiver fora de sincronia.
 */
export async function findOrCreateStripeCustomer(
  userId: string,
  dados: { email: string; nome?: string | null }
): Promise<string> {
  const existente = await prisma.customer.findUnique({ where: { userId } });
  if (existente?.stripeCustomerId) return existente.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: dados.email,
    name: dados.nome || undefined,
    metadata: { userId },
  });

  await prisma.customer.upsert({
    where: { userId },
    update: { stripeCustomerId: customer.id, gateway: 'stripe' },
    create: {
      userId,
      stripeCustomerId: customer.id,
      gateway: 'stripe',
      name: dados.nome || dados.email,
      email: dados.email,
    },
  });

  logger.info('[STRIPE] Customer criado', { userId, stripeCustomerId: customer.id });
  return customer.id;
}

/**
 * Sessão do portal do cliente.
 *
 * Dois retornos diferentes, e a distinção importa:
 *
 *   return_url                                  link "voltar" no cabeçalho,
 *                                               clicado por quem desistiu
 *   flow_data.after_completion.redirect         redireciona SOZINHO quando a
 *                                               pessoa conclui a ação
 *
 * Sem o segundo, quem cancela conclui o fluxo e fica parado no domínio da
 * Stripe, tendo que achar o link de volta.
 */
export async function criarPortalSession(params: {
  userId: string;
  baseUrl: string;
  /** 'cancelar' abre direto o fluxo de cancelamento e volta ao concluir. */
  acao?: 'cancelar';
  /** Para onde voltar. Padrão: a tela de assinatura. */
  voltarPara?: string;
}): Promise<string> {
  const customer = await prisma.customer.findUnique({
    where: { userId: params.userId },
    select: { id: true, stripeCustomerId: true },
  });

  if (!customer?.stripeCustomerId) {
    throw new Error('Nenhuma assinatura Stripe encontrada para este usuário');
  }

  const volta = `${params.baseUrl}${params.voltarPara ?? '/dashboard/assinatura'}`;
  const stripe = getStripe();

  if (params.acao === 'cancelar') {
    const assinatura = await prisma.subscription.findFirst({
      where: {
        customerId: customer.id,
        gateway: 'stripe',
        status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
        stripeSubscriptionId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      select: { stripeSubscriptionId: true },
    });

    if (assinatura?.stripeSubscriptionId) {
      const sessao = await stripe.billingPortal.sessions.create({
        customer: customer.stripeCustomerId,
        return_url: volta,
        locale: 'pt-BR',
        flow_data: {
          type: 'subscription_cancel',
          subscription_cancel: {
            subscription: assinatura.stripeSubscriptionId,
          },
          after_completion: {
            type: 'redirect',
            redirect: { return_url: `${volta}?assinatura=cancelada` },
          },
        },
      });
      return sessao.url;
    }
    // Sem assinatura ativa identificada: cai no portal completo.
  }

  const sessao = await stripe.billingPortal.sessions.create({
    customer: customer.stripeCustomerId,
    return_url: volta,
    locale: 'pt-BR',
  });

  return sessao.url;
}
