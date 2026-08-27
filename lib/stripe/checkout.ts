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
 * Sessão do portal do cliente: cancelar, trocar cartão, ver faturas.
 * Substitui a tela caseira que existia por causa do Asaas, que não tinha portal.
 */
export async function criarPortalSession(params: {
  userId: string;
  baseUrl: string;
}): Promise<string> {
  const customer = await prisma.customer.findUnique({
    where: { userId: params.userId },
    select: { stripeCustomerId: true },
  });

  if (!customer?.stripeCustomerId) {
    throw new Error('Nenhuma assinatura Stripe encontrada para este usuário');
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripeCustomerId,
    return_url: `${params.baseUrl}/dashboard`,
    locale: 'pt-BR',
  });

  return session.url;
}
