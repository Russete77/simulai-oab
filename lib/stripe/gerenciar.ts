/**
 * Ler e desfazer o cancelamento de uma assinatura.
 *
 * O portal do cliente muda a assinatura fora do app — a pessoa cancela lá e
 * volta para cá. O webhook conta o que aconteceu, mas ele é assíncrono: o
 * redirect do portal costuma chegar antes. Por isso a tela de assinatura
 * sincroniza com a Stripe ao abrir, em vez de confiar só no banco.
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { getStripe } from './client';
import { handleSubscriptionChanged } from './webhook-handlers';

/** Status em que ainda existe assinatura para mexer. */
const VIVAS = ['ACTIVE', 'TRIALING', 'PAST_DUE'];

/**
 * A assinatura Stripe que a tela mostra: a que está de pé, ou a mais
 * recente se nenhuma estiver.
 */
async function assinaturaRelevante(userId: string) {
  const customer = await prisma.customer.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!customer) return null;

  const assinaturas = await prisma.subscription.findMany({
    where: {
      customerId: customer.id,
      gateway: 'stripe',
      stripeSubscriptionId: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, stripeSubscriptionId: true, status: true },
  });

  return assinaturas.find((a) => VIVAS.includes(a.status)) ?? assinaturas[0] ?? null;
}

/**
 * Traz o estado da Stripe para o nosso banco.
 *
 * Nunca lança: é uma melhoria de frescor, não um requisito. Se a Stripe
 * estiver fora do ar a tela ainda abre com o que o banco tem.
 */
export async function sincronizarAssinatura(userId: string): Promise<void> {
  try {
    const alvo = await assinaturaRelevante(userId);
    if (!alvo?.stripeSubscriptionId) return;

    const remota = await getStripe().subscriptions.retrieve(alvo.stripeSubscriptionId);
    await handleSubscriptionChanged(remota);
  } catch (error) {
    logger.warn('[STRIPE_SYNC] Não consegui sincronizar', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Desfaz um cancelamento agendado.
 *
 * Só funciona enquanto a assinatura não chegou ao fim. Depois que ela vira
 * `canceled` não há volta, e a doc é explícita sobre isso: "Não é possível
 * reativar uma assinatura cancelada".
 */
export async function reativarAssinatura(userId: string): Promise<void> {
  const alvo = await assinaturaRelevante(userId);
  if (!alvo?.stripeSubscriptionId) {
    throw new Error('Nenhuma assinatura Stripe encontrada para este usuário');
  }

  const stripe = getStripe();
  const remota = await stripe.subscriptions.retrieve(alvo.stripeSubscriptionId);

  if (!VIVAS.includes(remota.status.toUpperCase())) {
    // Assinatura já encerrada: reativar não existe, só assinar de novo.
    throw new Error('Esta assinatura já terminou. Para voltar, é preciso assinar de novo.');
  }

  if (!remota.cancel_at && !remota.cancel_at_period_end) {
    // Já está ativa e renovando — nada a desfazer. Sincroniza e sai, porque
    // o que motivou o clique foi o banco estar atrasado.
    await handleSubscriptionChanged(remota);
    return;
  }

  // A API recusa os dois parâmetros na mesma chamada: "Received both
  // cancel_at_period_end and cancel_at parameters. Please pass in only one."
  // Então manda o que estiver marcado — o booleano tem prioridade porque
  // limpá-lo já derruba o cancel_at que ele mesmo gerou.
  const desfazer = remota.cancel_at_period_end
    ? { cancel_at_period_end: false as const }
    : { cancel_at: null };

  const atualizada = await stripe.subscriptions.update(
    alvo.stripeSubscriptionId,
    desfazer
  );

  // Grava na hora: quem clicou em "reativar" precisa ver o resultado na
  // volta, e o webhook pode demorar.
  await handleSubscriptionChanged(atualizada);

  logger.info('[STRIPE] Cancelamento desfeito', {
    userId,
    stripeSubscriptionId: alvo.stripeSubscriptionId,
  });
}
