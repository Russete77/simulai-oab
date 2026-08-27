/**
 * POST /api/billing/subscription
 *
 * Cria a assinatura em estado `incomplete` e devolve o client secret para o
 * front confirmar o pagamento com o Payment Element — sem sair do app.
 *
 * O cartão continua não passando por aqui: o Payment Element renderiza os
 * campos dentro de iframes da Stripe, então o PAN nunca toca o nosso
 * servidor. É o mesmo ganho de PCI do Checkout hospedado, com a nossa cara.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { getPriceId, PLAN_KEY } from '@/lib/stripe/plan';
import { findOrCreateStripeCustomer } from '@/lib/stripe/checkout';

export async function POST(_req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json(
        { error: 'Sua conta não tem e-mail. Adicione um para assinar.' },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, name: true },
    });
    if (!dbUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado. Entre novamente.' },
        { status: 404 }
      );
    }

    const jaAtiva = await prisma.subscription.findFirst({
      where: {
        customer: { userId: dbUser.id },
        gateway: 'stripe',
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
      select: { id: true },
    });
    if (jaAtiva) {
      return NextResponse.json(
        { error: 'Você já tem uma assinatura ativa.', jaAssinante: true },
        { status: 409 }
      );
    }

    const stripe = getStripe();
    const stripeCustomerId = await findOrCreateStripeCustomer(dbUser.id, {
      email,
      nome: dbUser.name,
    });

    // Reaproveita uma tentativa anterior que ficou pendente, em vez de criar
    // uma assinatura nova a cada recarregada da página.
    const pendentes = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'incomplete',
      limit: 1,
    });

    let subscription =
      pendentes.data[0] &&
      (await stripe.subscriptions.retrieve(pendentes.data[0].id, {
        expand: ['latest_invoice.confirmation_secret'],
      }));

    if (!subscription) {
      subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: getPriceId() }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card'],
        },
        metadata: { userId: dbUser.id },
        expand: ['latest_invoice.confirmation_secret'],
      });
    }

    const invoice = subscription.latest_invoice;
    const clientSecret =
      typeof invoice === 'object' && invoice
        ? (invoice as unknown as { confirmation_secret?: { client_secret?: string } })
            .confirmation_secret?.client_secret
        : undefined;

    if (!clientSecret) {
      logger.error('[BILLING_SUBSCRIPTION] Sem confirmation_secret', {
        subscriptionId: subscription.id,
      });
      return NextResponse.json(
        { error: 'Não foi possível iniciar o pagamento. Tente de novo.' },
        { status: 500 }
      );
    }

    // Grava já como INCOMPLETE — quem libera acesso é o webhook invoice.paid.
    const customer = await prisma.customer.findUnique({
      where: { userId: dbUser.id },
      select: { id: true },
    });
    if (customer) {
      await prisma.subscription.upsert({
        where: { stripeSubscriptionId: subscription.id },
        update: {},
        create: {
          customerId: customer.id,
          stripeSubscriptionId: subscription.id,
          gateway: 'stripe',
          plan: PLAN_KEY,
          status: 'INCOMPLETE',
          value: 9.99,
          cycle: 'MONTHLY',
        },
      });
    }

    return NextResponse.json({
      clientSecret,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    logger.error('[BILLING_SUBSCRIPTION]', { error: message });
    return NextResponse.json(
      { error: 'Não foi possível iniciar o pagamento. Tente de novo em instantes.' },
      { status: 500 }
    );
  }
}
