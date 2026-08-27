'use client';

import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui';
import { Check, ShieldCheck } from 'lucide-react';
import { AssinarButton } from '@/components/billing/assinar-button';
import { PLANO } from '@/lib/stripe/plan';

const PERGUNTAS = [
  {
    q: 'Como funciona a cobrança?',
    a: 'R$ 9,99 por mês no cartão de crédito, renovando sozinho. Sem fidelidade e sem multa: você cancela quando quiser e mantém o acesso até o fim do mês já pago.',
  },
  {
    q: 'Como eu cancelo?',
    a: 'Pelo próprio app, em Assinatura. Dois cliques, sem precisar falar com ninguém. Você também consegue trocar o cartão e baixar suas faturas por lá.',
  },
  {
    q: 'Aceita PIX ou boleto?',
    a: 'Só cartão de crédito. É a única forma que renova sozinha todo mês sem você precisar lembrar de pagar — e é o que permite manter o preço em R$ 9,99.',
  },
  {
    q: 'Tem tudo mesmo por R$ 9,99?',
    a: 'Tem. Não existe plano de cima: as 5.875 questões, os simulados, o plano de estudos e as explicações com IA entram todos no mesmo preço.',
  },
];

export function PricingClient() {
  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <div className="container-page py-12 sm:py-16">
        <header className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-accent/30 mb-5">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-medium text-accent">
              Sem fidelidade · Cancele quando quiser
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-ink-1 mb-4">
            Um plano. Tudo dentro.
          </h1>
          <p className="text-lg text-ink-2">
            Sem versão limitada, sem recurso reservado para quem paga mais.
          </p>
        </header>

        <Card className="max-w-md mx-auto">
          <div className="p-2">
            <p className="text-eyebrow mb-3">{PLANO.nome}</p>

            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-5xl font-semibold tracking-tight text-ink-1 text-mono-tabular">
                {PLANO.precoFormatado}
              </span>
              <span className="text-ink-2">/mês</span>
            </div>
            <p className="text-sm text-ink-2 mb-7">{PLANO.descricao}</p>

            <AssinarButton fullWidth />

            <p className="text-xs text-ink-3 text-center mt-3">
              Cartão de crédito · renova todo mês · cancele em 2 cliques
            </p>

            <ul className="mt-8 space-y-3 border-t pt-7">
              {PLANO.beneficios.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-ink-1">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <section className="max-w-2xl mx-auto mt-16">
          <h2 className="text-eyebrow mb-5 text-center">Perguntas comuns</h2>
          <div className="space-y-3">
            {PERGUNTAS.map(({ q, a }) => (
              <Card key={q}>
                <h3 className="text-base font-semibold text-ink-1 mb-1.5">{q}</h3>
                <p className="text-sm text-ink-2 leading-relaxed">{a}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
