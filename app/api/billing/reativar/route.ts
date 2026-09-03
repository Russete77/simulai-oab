/**
 * POST /api/billing/reativar
 *
 * Desfaz um cancelamento agendado — a assinatura volta a renovar.
 *
 * Existe porque o portal da Stripe não tem fluxo de reativação: dá para
 * cancelar por link direto, mas para voltar atrás a pessoa teria que
 * navegar o portal inteiro e achar o botão. Aqui é um clique.
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { reativarAssinatura } from '@/lib/stripe/gerenciar';

export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    await reativarAssinatura(dbUser.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    logger.error('[BILLING_REATIVAR]', { error: message });
    return NextResponse.json(
      { error: 'Não foi possível reativar sua assinatura. Tente de novo.' },
      { status: 500 }
    );
  }
}
