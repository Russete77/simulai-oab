/**
 * GET /api/billing/status
 *
 * Estado da assinatura do usuário, lido do nosso banco. Serve os dois
 * gateways enquanto durar a migração: o que importa é existir alguma
 * assinatura ativa, não qual sistema a cobra.
 *
 * Com `?sincronizar=1` confere antes com a Stripe — só a tela de assinatura
 * pede isso, porque é para lá que o portal devolve a pessoa.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { CICLOS, PRECO_BASE_FORMATADO, formatarBRL } from '@/lib/stripe/plan';
import { fimDoAcesso, podeReativar, temFimMarcado } from '@/lib/stripe/assinatura';
import { sincronizarAssinatura } from '@/lib/stripe/gerenciar';

const ATIVOS = ['ACTIVE', 'TRIALING'] as const;

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // A tela de assinatura pede `?sincronizar=1`: a pessoa acabou de voltar
    // do portal da Stripe, onde pode ter cancelado, e o webhook que conta
    // isso costuma chegar DEPOIS do redirect. Sem isto ela volta e le
    // "proxima cobranca em..." logo apos ter cancelado.
    if (req.nextUrl.searchParams.get('sincronizar') === '1') {
      const dono = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });
      if (dono) await sincronizarAssinatura(dono.id);
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        customer: {
          select: {
            subscriptions: {
              orderBy: { createdAt: 'desc' },
              select: {
                gateway: true,
                status: true,
                value: true,
                currentPeriodEnd: true,
                cancelAtPeriodEnd: true,
                cancelAt: true,
                cycle: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const subs = user.customer?.subscriptions ?? [];
    const ativa = subs.find((s) => ATIVOS.includes(s.status as (typeof ATIVOS)[number]));
    const referencia = ativa ?? subs[0];

    if (!referencia) {
      return NextResponse.json({
        assinante: false,
        status: 'sem_assinatura',
        precoFormatado: PRECO_BASE_FORMATADO,
      });
    }

    // O que a pessoa paga de fato, e de quanto em quanto tempo. Antes era
    // sempre "R$ 9,99 por mês" — errado para quem assinou o anual.
    const cicloAssinado = CICLOS.find((c) => c.cicloBanco === referencia.cycle);
    const precoFormatado = formatarBRL(Math.round(referencia.value * 100));

    return NextResponse.json({
      assinante: Boolean(ativa),
      status: referencia.status,
      gateway: referencia.gateway,
      valor: referencia.value,
      renovaEm: referencia.currentPeriodEnd,
      // Le os DOIS campos de cancelamento. O portal da Stripe agenda pela
      // data e deixa o booleano em false: quem so olhava o booleano dizia
      // "proxima cobranca em 27/09" para quem tinha acabado de cancelar.
      cancelaNoFimDoPeriodo: temFimMarcado(referencia),
      acessoAte: fimDoAcesso(referencia),
      podeReativar: podeReativar(referencia),
      // O portal self-service só existe para assinaturas da Stripe. Quem ainda
      // está no Asaas precisa falar com o suporte para cancelar.
      temPortal: referencia.gateway === 'stripe',
      precoFormatado,
      // "todo mês", "a cada 6 meses", "uma vez por ano".
      cicloCobranca: cicloAssinado?.rotuloCobranca ?? 'todo mês',
      cicloRotulo: cicloAssinado?.rotulo ?? 'Mensal',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    logger.error('[BILLING_STATUS]', { error: message });
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
