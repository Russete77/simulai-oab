'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Card, Badge } from '@/components/ui';
import { Check, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { PLANS } from '@/lib/billing/plans';

const ESSENCIAL_FEATURES = [
  'Questões ilimitadas',
  'Simulados ilimitados',
  '5.875 questões oficiais (banco completo)',
  'Analytics avançado por matéria',
  'Revisão de erros completa',
  'Simulados adaptativos',
  'Flashcards e desafios semanais',
  '3 explicações de IA por dia',
  'Acesso offline (PWA)',
];

const PRO_FEATURES = [
  'Tudo do plano Essencial',
  'Explicações por IA ilimitadas',
  'Chat com IA ilimitado',
  'Revisão de erros com IA',
  'Coaching virtual com IA',
  'Relatórios em PDF',
  'Analytics completo + Predições',
  'Suporte prioritário',
  'Badge exclusivo Pro',
];

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function PricingClient() {
  const { isSignedIn } = useUser();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = (planKey: string) => {
    if (!isSignedIn) {
      window.location.href = `/register?next=/checkout/${planKey}`;
      return;
    }
    setLoading(planKey);
    window.location.href = `/checkout/${planKey}`;
  };

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <div className="container-page py-12 sm:py-16">
        {/* Header */}
        <header className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-accent/30 mb-5">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-medium text-accent">
              Garantia 7 dias · Cancele quando quiser
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-ink-1 mb-4">
            Escolha seu plano
          </h1>
          <p className="text-lg text-ink-2">
            Mensalidade direta. Sem fidelidade, sem taxas escondidas.
          </p>
          <p className="text-sm text-ink-3 mt-2">
            Não gostou? Devolvemos 100% do dinheiro nos primeiros 7 dias.
          </p>
        </header>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto items-stretch">
          {/* ESSENCIAL */}
          <Card className="flex flex-col">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-ink-1">Essencial</h3>
              <p className="text-sm text-ink-2 mt-1">
                Tudo que você precisa pra estudar com seriedade
              </p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-semibold tracking-tight text-ink-1">
                {fmt(PLANS.BASIC.MONTHLY.monthlyValue)}
              </span>
              <span className="text-sm text-ink-3 ml-1">/mês</span>
            </div>
            <ul className="space-y-2.5 mb-8 text-sm text-ink-2 flex-1">
              {ESSENCIAL_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => handleSubscribe('BASIC_MONTHLY')}
              disabled={loading === 'BASIC_MONTHLY'}
              className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-md border bg-surface text-ink-1 text-sm font-medium hover:bg-surface-2 transition-all disabled:opacity-50"
            >
              {loading === 'BASIC_MONTHLY' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Assinar Essencial'
              )}
            </button>
          </Card>

          {/* PRO */}
          <Card variant="highlighted" className="flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge variant="accent" className="shadow-sm">
                <Sparkles className="w-3 h-3" />
                Com IA
              </Badge>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-ink-1">Pro</h3>
              <p className="text-sm text-ink-2 mt-1">
                Estudo turbinado com inteligência artificial
              </p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-semibold tracking-tight text-ink-1">
                {fmt(PLANS.PRO.MONTHLY.monthlyValue)}
              </span>
              <span className="text-sm text-ink-3 ml-1">/mês</span>
            </div>
            <ul className="space-y-2.5 mb-8 text-sm text-ink-2 flex-1">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => handleSubscribe('PRO_MONTHLY')}
              disabled={loading === 'PRO_MONTHLY'}
              className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-md bg-accent text-accent-fg text-sm font-medium hover:bg-accent-hover shadow-sm transition-all disabled:opacity-50"
            >
              {loading === 'PRO_MONTHLY' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Assinar Pro'
              )}
            </button>
          </Card>
        </div>

        {/* Compare callout */}
        <div className="max-w-2xl mx-auto mt-12">
          <Card className="text-center">
            <h3 className="text-base font-semibold text-ink-1 mb-2">
              Qual a diferença entre Essencial e Pro?
            </h3>
            <p className="text-sm text-ink-2 leading-relaxed">
              O Essencial dá acesso a tudo: questões, simulados, analytics, flashcards.
              O Pro adiciona IA: explicações detalhadas de cada questão,
              chat pra tirar dúvidas em tempo real, e revisão com IA.
            </p>
          </Card>
        </div>

        {/* Guarantee */}
        <div className="max-w-2xl mx-auto mt-6 text-center">
          <p className="text-sm text-ink-3">
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            Garantia de 7 dias com devolução total. Cancele a qualquer momento.
          </p>
        </div>
      </div>
    </div>
  );
}
