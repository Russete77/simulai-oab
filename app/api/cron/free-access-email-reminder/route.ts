import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServicoEmail } from '@/lib/email/servico-email';
import { getDaysUntilEnd, isNearingEnd, getFreeAccessEndDate } from '@/lib/billing/free-access-mode';

/**
 * Cron job para enviar emails de aviso antes do fim do acesso gratuito
 *
 * Configurar no Vercel:
 * vercel.json -> "crons": [{ "path": "/api/cron/free-access-email-reminder", "schedule": "0 10 * * *" }]
 *
 * Ou chamar manualmente: POST /api/cron/free-access-email-reminder
 * Header: Authorization: Bearer {CRON_SECRET}
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação do cron job (fail-close: rejeita se CRON_SECRET não estiver configurado)
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar se modo gratuito está próximo do fim
    if (!isNearingEnd()) {
      return NextResponse.json({
        status: 'skipped',
        message: 'Modo gratuito não está próximo do fim (mais de 14 dias restantes)',
      });
    }

    const daysLeft = getDaysUntilEnd();
    const endDate = getFreeAccessEndDate();

    if (!daysLeft || !endDate) {
      return NextResponse.json({
        status: 'skipped',
        message: 'Modo gratuito sem data de término definida',
      });
    }

    // Buscar usuários sem subscription paga ativa — são os que se beneficiam do modo gratuito.
    // Inclui TRIALING/INCOMPLETE/CANCELED e quem ainda não tem nenhuma sub.
    const usuarios = await prisma.user.findMany({
      where: {
        OR: [
          { customer: null },
          {
            customer: {
              subscriptions: {
                none: { status: 'ACTIVE' },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(`[CRON] Enviando emails de aviso para ${usuarios.length} usuários (${daysLeft} dias restantes)`);

    const servicoEmail = getServicoEmail();
    const resultados = {
      enviados: 0,
      falhas: 0,
      total: usuarios.length,
    };

    // Enviar emails em lote (com delay para não sobrecarregar)
    for (const usuario of usuarios) {
      const sucesso = await servicoEmail.enviarFimAcessoGratuito({
        destinatario: usuario.email,
        nomeUsuario: usuario.name || 'Estudante',
        diasRestantes: daysLeft,
        dataTermino: endDate.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
      });

      if (sucesso) {
        resultados.enviados++;
      } else {
        resultados.falhas++;
      }

      // Delay de 100ms entre emails para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`[CRON] Emails enviados: ${resultados.enviados}/${resultados.total}`);

    return NextResponse.json({
      status: 'success',
      daysLeft,
      endDate: endDate.toISOString(),
      resultados,
    });

  } catch (error: any) {
    console.error('[CRON] Erro ao enviar emails de aviso:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
