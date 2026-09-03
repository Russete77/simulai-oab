'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Card, Button } from '@/components/ui';
import {
  Loader2,
  Check,
  Clock,
  AlertCircle,
  ArrowRight,
  BookOpen,
  ClipboardList,
  Target,
} from 'lucide-react';
import { CICLOS, PLANO, PRECO_BASE_FORMATADO, formatarBRL } from '@/lib/stripe/plan';
import { carregarStripe } from '@/lib/stripe/browser';

type Estado = 'verificando' | 'pago' | 'processando' | 'falhou';

/**
 * Quando a próxima cobrança cai.
 *
 * Depende do ciclo: antes somava sempre um mês, o que prometeria cobrança em
 * outubro para quem acabou de pagar o ano inteiro.
 */
function proximaCobranca(meses: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + meses);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    ...(meses > 6 ? { year: 'numeric' as const } : {}),
  });
}

/** Descobre o ciclo pelo valor cobrado — os quatro têm valores distintos. */
function cicloPagoDe(centavos: number | null) {
  return CICLOS.find((c) => c.totalCentavos === centavos) ?? null;
}

/**
 * Retorno do Payment Element.
 *
 * A Stripe devolve `payment_intent_client_secret` na URL. Consultamos o
 * PaymentIntent só para contar ao usuário o que aconteceu — quem libera o
 * acesso é o webhook `invoice.paid`. Se a pessoa fechar o navegador aqui, o
 * acesso é liberado do mesmo jeito.
 */
export function ConfirmacaoClient() {
  const params = useSearchParams();
  const [estado, setEstado] = useState<Estado>('verificando');
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [pagoCentavos, setPagoCentavos] = useState<number | null>(null);

  useEffect(() => {
    const secret = params.get('payment_intent_client_secret');
    if (!secret) {
      setEstado('falhou');
      setMensagem('Não recebemos a confirmação do pagamento.');
      return;
    }

    carregarStripe().then(async (stripe) => {
      if (!stripe) {
        // O pagamento pode ter dado certo mesmo assim: quem libera acesso é
        // o webhook. Não afirme falha por não conseguir consultar.
        setEstado('processando');
        return;
      }
      const { paymentIntent, error } = await stripe.retrievePaymentIntent(secret);

      if (error || !paymentIntent) {
        setEstado('falhou');
        setMensagem(error?.message ?? 'Não foi possível verificar o pagamento.');
        return;
      }

      // O valor cobrado diz qual ciclo a pessoa assinou — é a fonte mais
      // confiável aqui, porque não depende do webhook já ter chegado.
      setPagoCentavos(paymentIntent.amount ?? null);

      switch (paymentIntent.status) {
        case 'succeeded':
          setEstado('pago');
          break;
        case 'processing':
          setEstado('processando');
          break;
        case 'requires_payment_method':
          setEstado('falhou');
          setMensagem('O pagamento não foi aprovado. Tente com outro cartão.');
          break;
        default:
          setEstado('processando');
      }
    }).catch(() => setEstado('processando'));
  }, [params]);

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <main
        id="main-content"
        role="main"
        className="container-page py-12 sm:py-20"
      >
        {estado === 'verificando' && (
          <div className="max-w-md mx-auto">
            <Card>
              <div className="flex items-center gap-3 text-ink-2 py-8 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                Confirmando seu pagamento...
              </div>
            </Card>
          </div>
        )}

        {estado === 'pago' && (
          <div className="max-w-2xl mx-auto animate-fade-up">
            {/* Confirmação */}
            <div className="flex items-center gap-2.5 mb-5">
              <span className="w-6 h-6 rounded-full bg-success flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </span>
              <span className="text-eyebrow text-success">Pagamento aprovado</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink-1 mb-3 leading-tight">
              Pronto. Agora é estudar.
            </h1>
            <p className="text-ink-2 leading-relaxed mb-8 max-w-lg">
              Faltam 11 dias para o 47º Exame. Quem passa faz cerca de 600
              questões — dá pra começar agora mesmo, com 20 por dia.
            </p>

            {/* Ação principal */}
            <Link
              href="/practice"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md bg-accent text-accent-fg font-medium shadow-sm hover:bg-accent-hover transition-all"
            >
              Começar pela primeira questão
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* O que abriu */}
            <div className="grid sm:grid-cols-3 gap-3 mt-10">
              <Link href="/simulations" className="block group">
                <Card interactive className="h-full">
                  <div className="w-9 h-9 rounded-md bg-accent-soft text-accent flex items-center justify-center mb-3">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-semibold text-ink-1 mb-1">
                    Simulado completo
                  </h2>
                  <p className="text-xs text-ink-2 leading-relaxed">
                    80 questões no formato oficial.
                  </p>
                </Card>
              </Link>

              <Link href="/practice" className="block group">
                <Card interactive className="h-full">
                  <div className="w-9 h-9 rounded-md bg-accent-soft text-accent flex items-center justify-center mb-3">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-semibold text-ink-1 mb-1">
                    5.875 questões
                  </h2>
                  <p className="text-xs text-ink-2 leading-relaxed">
                    Todos os exames de 2010 a 2026.
                  </p>
                </Card>
              </Link>

              <Link href="/plano-estudos" className="block group">
                <Card interactive className="h-full">
                  <div className="w-9 h-9 rounded-md bg-accent-soft text-accent flex items-center justify-center mb-3">
                    <Target className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-semibold text-ink-1 mb-1">
                    Plano de estudos
                  </h2>
                  <p className="text-xs text-ink-2 leading-relaxed">
                    Cronograma até o dia da prova.
                  </p>
                </Card>
              </Link>
            </div>

            {/* Dados da assinatura — sem letra miúda escondida */}
            <div className="hairline mt-10 pt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                <div>
                  <div className="text-sm font-medium text-ink-1 text-mono-tabular">
                    {pagoCentavos !== null
                      ? formatarBRL(pagoCentavos)
                      : PRECO_BASE_FORMATADO}
                  </div>
                  <div className="text-xs text-ink-3 mt-0.5">
                    {cicloPagoDe(pagoCentavos)?.rotulo ?? 'Valor'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-ink-1">
                    {proximaCobranca(cicloPagoDe(pagoCentavos)?.meses ?? 1)}
                  </div>
                  <div className="text-xs text-ink-3 mt-0.5">Próxima cobrança</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-ink-1">
                    Sem fidelidade
                  </div>
                  <div className="text-xs text-ink-3 mt-0.5">
                    Cancele em 2 cliques
                  </div>
                </div>
              </div>

              <Link
                href="/dashboard/assinatura"
                className="text-sm text-ink-2 hover:text-ink-1 transition-colors"
              >
                Gerenciar assinatura
              </Link>
            </div>

            <p className="text-xs text-ink-3 mt-6">
              O recibo foi enviado para o seu e-mail.
            </p>
          </div>
        )}

        {estado === 'processando' && (
          <div className="max-w-md mx-auto">
            <Card>
              <div className="w-10 h-10 rounded-full bg-warning-soft text-warning flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink-1 mb-2">
                Pagamento em processamento
              </h1>
              <p className="text-sm text-ink-2 leading-relaxed mb-7">
                O banco ainda está confirmando. Assim que aprovar, seu acesso é
                liberado sozinho — você não precisa fazer nada nem ficar nesta
                página.
              </p>
              <Link href="/dashboard">
                <Button fullWidth variant="secondary">
                  Ir para o app
                </Button>
              </Link>
            </Card>
          </div>
        )}

        {estado === 'falhou' && (
          <div className="max-w-md mx-auto">
            <Card>
              <div className="w-10 h-10 rounded-full bg-danger-soft text-danger flex items-center justify-center mb-4">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink-1 mb-2">
                Não deu certo
              </h1>
              <p className="text-sm text-ink-2 leading-relaxed mb-7">
                {mensagem ?? 'O pagamento não foi concluído.'} Nada foi cobrado.
              </p>
              <Link href="/assinar">
                <Button fullWidth size="lg">
                  Tentar de novo
                </Button>
              </Link>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
