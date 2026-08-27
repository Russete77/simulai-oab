'use client';

import { useEffect, useState, useCallback } from 'react';
import { loadStripe, type Appearance } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Card, Button } from '@/components/ui';
import { Loader2, Check, ShieldCheck, Lock, AlertCircle } from 'lucide-react';
import { useTheme } from '@/components/theme/theme-provider';
import { PLANO } from '@/lib/stripe/plan';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
);

/**
 * Aparência do Payment Element derivada dos nossos tokens.
 *
 * Os valores são literais de propósito: a API de aparência da Stripe roda
 * dentro de um iframe de outra origem, que não enxerga as CSS custom
 * properties da nossa página. `var(--accent)` aqui chegaria vazio.
 */
function aparencia(tema: 'light' | 'dark'): Appearance {
  const escuro = tema === 'dark';
  return {
    theme: escuro ? 'night' : 'stripe',
    variables: {
      colorPrimary: escuro ? '#7bacff' : '#004ac6',
      colorBackground: escuro ? '#232323' : '#ffffff',
      colorText: escuro ? '#ebebeb' : '#1e1b19',
      colorTextSecondary: escuro ? '#a3a8b5' : '#434655',
      colorTextPlaceholder: escuro ? '#7a7f8c' : '#737686',
      colorDanger: escuro ? '#ff8a80' : '#ba1a1a',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      fontSizeBase: '15px',
      borderRadius: '8px',
      spacingUnit: '4px',
    },
    rules: {
      '.Input': {
        border: escuro
          ? '1px solid rgba(255,255,255,0.1)'
          : '1px solid rgba(30,27,25,0.1)',
        boxShadow: 'none',
        padding: '10px 12px',
      },
      '.Input:focus': {
        border: `1px solid ${escuro ? '#7bacff' : '#004ac6'}`,
        boxShadow: `0 0 0 3px ${escuro ? 'rgba(123,172,255,0.16)' : 'rgba(0,74,198,0.1)'}`,
      },
      '.Label': {
        fontWeight: '500',
        marginBottom: '6px',
      },
      '.Tab': {
        border: escuro
          ? '1px solid rgba(255,255,255,0.1)'
          : '1px solid rgba(30,27,25,0.1)',
        boxShadow: 'none',
      },
      '.Tab--selected': {
        border: `1px solid ${escuro ? '#7bacff' : '#004ac6'}`,
        boxShadow: 'none',
      },
    },
  };
}

function Formulario() {
  const stripe = useStripe();
  const elements = useElements();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  const pagar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setEnviando(true);
    setErro(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/assinar/confirmacao`,
      },
    });

    // Só chega aqui se falhou antes de redirecionar (dados incompletos,
    // cartão recusado na hora). No sucesso o browser já saiu da página.
    if (error) {
      setErro(error.message ?? 'Não foi possível concluir o pagamento.');
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={pagar}>
      <PaymentElement
        options={{ layout: 'tabs' }}
        onReady={() => setPronto(true)}
      />

      {erro && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 p-3 rounded-md bg-danger-soft border border-danger/30"
        >
          <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-ink-1">{erro}</p>
        </div>
      )}

      <Button
        type="submit"
        fullWidth
        size="lg"
        disabled={!stripe || !pronto || enviando}
        className="mt-6"
      >
        {enviando ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Confirmando...
          </span>
        ) : (
          `Assinar por ${PLANO.precoFormatado}/mês`
        )}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-ink-3 mt-3">
        <Lock className="w-3 h-3" />
        Pagamento processado pela Stripe. Não guardamos seu cartão.
      </p>
    </form>
  );
}

export function AssinarClient() {
  const { resolvedTheme } = useTheme();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [jaAssinante, setJaAssinante] = useState(false);

  const iniciar = useCallback(async () => {
    setErro(null);
    try {
      const res = await fetch('/api/billing/subscription', { method: 'POST' });
      const dados = await res.json();

      if (res.status === 409 && dados.jaAssinante) {
        setJaAssinante(true);
        return;
      }
      if (!res.ok || !dados.clientSecret) {
        throw new Error(dados.error || 'Não foi possível iniciar o pagamento.');
      }
      setClientSecret(dados.clientSecret);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao iniciar o pagamento.');
    }
  }, []);

  useEffect(() => {
    iniciar();
  }, [iniciar]);

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <main id="main-content" role="main" className="container-page py-10 sm:py-14">
        <div className="max-w-4xl mx-auto grid gap-6 lg:grid-cols-[1fr_380px] items-start">
          {/* Formulário */}
          <Card>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-1 mb-1.5">
              Finalizar assinatura
            </h1>
            <p className="text-sm text-ink-2 mb-7">
              {PLANO.precoFormatado} por mês, renovando sozinho. Cancele quando
              quiser, em 2 cliques.
            </p>

            {jaAssinante ? (
              <div className="py-4">
                <p className="text-ink-1 font-medium mb-1.5">
                  Você já tem uma assinatura ativa.
                </p>
                <p className="text-sm text-ink-2 mb-5">
                  Não precisa assinar de novo.
                </p>
                <Link href="/dashboard">
                  <Button>Ir para o app</Button>
                </Link>
              </div>
            ) : erro ? (
              <div className="py-4">
                <div className="flex items-start gap-2.5 mb-5">
                  <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                  <p className="text-sm text-ink-1">{erro}</p>
                </div>
                <Button variant="secondary" onClick={iniciar}>
                  Tentar de novo
                </Button>
              </div>
            ) : !clientSecret ? (
              <div className="flex items-center gap-3 text-ink-2 py-10 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                Preparando o pagamento...
              </div>
            ) : (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: aparencia(resolvedTheme),
                  locale: 'pt-BR',
                }}
              >
                <Formulario />
              </Elements>
            )}
          </Card>

          {/* Resumo */}
          <div className="lg:sticky lg:top-20">
            <Card>
              <p className="text-eyebrow mb-3">Resumo</p>

              <div className="flex items-baseline justify-between gap-3 pb-4 border-b">
                <div>
                  <p className="font-medium text-ink-1">{PLANO.nome}</p>
                  <p className="text-xs text-ink-3 mt-0.5">Mensal, sem fidelidade</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xl font-semibold text-ink-1 text-mono-tabular">
                    {PLANO.precoFormatado}
                  </span>
                  <span className="text-xs text-ink-3">/mês</span>
                </div>
              </div>

              <ul className="space-y-2.5 py-5">
                {PLANO.beneficios.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-ink-2">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>

              <div className="flex items-start gap-2.5 pt-4 border-t">
                <ShieldCheck className="w-4 h-4 text-ink-3 shrink-0 mt-0.5" />
                <p className="text-xs text-ink-3 leading-relaxed">
                  Cobrança recorrente no cartão. Você cancela pelo próprio app,
                  sem falar com ninguém, e mantém o acesso até o fim do mês pago.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
