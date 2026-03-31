'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Header } from '@/components/layout/header';
import { Card, Button } from '@/components/ui';
import { Check, Loader2, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { PLANS } from '@/lib/billing/plans';

export function PricingClient() {
  const { isSignedIn } = useUser();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planKey: string) => {
    if (!isSignedIn) {
      window.location.href = '/register';
      return;
    }
    setLoading(planKey);
    window.location.href = `/checkout/${planKey}`;
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-navy-950">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
            Escolha seu plano
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-navy-400 mb-2 px-4">
            Todos os planos com recorrência mensal. Cancele quando quiser.
          </p>
          <p className="text-sm text-navy-500">
            Sem fidelidade, sem taxas escondidas, sem surpresas.
          </p>
        </div>

        {/* Plans Grid - 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">

          {/* FREE Plan */}
          <Card variant="glass" className="flex flex-col h-full">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Gratuito</h3>
              <div className="text-4xl font-bold text-white mb-2">
                {formatPrice(0)}
              </div>
              <p className="text-navy-400">para sempre</p>
            </div>
            <div className="space-y-3 mb-6 flex-1">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">5 questões por dia</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">1 simulado por mês</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">100 questões no banco</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">Analytics básico</span>
              </div>
              <div className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-400/50 flex-shrink-0 mt-0.5" />
                <span className="text-gray-500 text-sm">Sem explicações com IA</span>
              </div>
              <div className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-400/50 flex-shrink-0 mt-0.5" />
                <span className="text-gray-500 text-sm">Sem chat com IA</span>
              </div>
            </div>
            {isSignedIn ? (
              <Button variant="outline" size="lg" disabled className="w-full mt-auto">
                Plano Atual
              </Button>
            ) : (
              <Link href="/register" className="mt-auto">
                <Button variant="outline" size="lg" className="w-full">
                  Começar Grátis
                </Button>
              </Link>
            )}
          </Card>

          {/* ESSENCIAL Plan (BASIC) */}
          <Card variant="glass" className="border-2 border-blue-500 relative flex flex-col h-full">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
              Mais Popular
            </div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Essencial
              </h3>
              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-bold text-white">
                  {formatPrice(PLANS.BASIC.MONTHLY.monthlyValue)}
                </span>
                <span className="text-gray-400 ml-2">/mês</span>
              </div>
              <p className="text-navy-300">Tudo que você precisa para estudar</p>
            </div>
            <div className="space-y-3 mb-6 flex-1">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-200 text-sm font-medium">Questões ilimitadas</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-200 text-sm font-medium">Simulados ilimitados</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-200 text-sm">5.605 questões (banco completo)</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-200 text-sm">Analytics avançado por matéria</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-200 text-sm">Revisão de erros completa</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-200 text-sm">Simulados adaptativos</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-200 text-sm">Flashcards + Desafios semanais</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-200 text-sm">Acesso offline (PWA)</span>
              </div>
              <div className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-400/50 flex-shrink-0 mt-0.5" />
                <span className="text-gray-500 text-sm">Sem explicações com IA</span>
              </div>
              <div className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-400/50 flex-shrink-0 mt-0.5" />
                <span className="text-gray-500 text-sm">Sem chat com IA</span>
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full mt-auto"
              onClick={() => handleSubscribe('BASIC_MONTHLY')}
              disabled={loading === 'BASIC_MONTHLY'}
            >
              {loading === 'BASIC_MONTHLY' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Assinar Essencial'
              )}
            </Button>
          </Card>

          {/* PRO Plan */}
          <Card variant="premium" className="relative flex flex-col h-full">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 whitespace-nowrap">
              <Sparkles className="w-4 h-4" />
              Com IA
            </div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Pro
              </h3>
              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-bold text-white">
                  {formatPrice(PLANS.PRO.MONTHLY.monthlyValue)}
                </span>
                <span className="text-gray-400 ml-2">/mês</span>
              </div>
              <p className="text-navy-300">Estudo turbinado com inteligência artificial</p>
            </div>
            <div className="space-y-3 mb-6 flex-1">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-200 text-sm font-medium">Tudo do plano Essencial</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-200 text-sm font-medium">Explicações por IA ilimitadas</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-200 text-sm font-medium">Chat com IA ilimitado</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-200 text-sm">Revisão de erros com IA</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-200 text-sm">Coaching virtual com IA</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-200 text-sm">Relatórios em PDF</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-200 text-sm">Analytics completo + Predições</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-200 text-sm">Suporte prioritário</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-200 text-sm">Badge exclusivo Pro</span>
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full mt-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              onClick={() => handleSubscribe('PRO_MONTHLY')}
              disabled={loading === 'PRO_MONTHLY'}
            >
              {loading === 'PRO_MONTHLY' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Assinar Pro'
              )}
            </Button>
          </Card>
        </div>

        {/* Comparison callout */}
        <div className="mt-10 max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/20 rounded-xl p-6 text-center">
            <p className="text-white font-semibold text-lg mb-2">
              Qual a diferença entre Essencial e Pro?
            </p>
            <p className="text-navy-300 text-sm">
              O Essencial dá acesso a tudo: questões ilimitadas, simulados, analytics, flashcards.
              O Pro adiciona a inteligência artificial: explicações detalhadas de cada questão,
              chat para tirar dúvidas em tempo real, e revisão de erros com IA.
            </p>
          </div>
        </div>

        {/* Guarantee */}
        <div className="mt-8 max-w-4xl mx-auto px-4">
          <div className="bg-navy-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
              Garantia de 7 dias
            </h3>
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
              Experimente qualquer plano sem riscos. Se não ficar satisfeito, devolvemos seu dinheiro
              nos primeiros 7 dias. Sem perguntas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
