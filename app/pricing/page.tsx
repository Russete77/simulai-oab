'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Header } from '@/components/layout/header';
import { Card, Button } from '@/components/ui';
import { Check, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { PLANS, BillingCycle, PlanTier } from '@/lib/billing/plans';
import { getStripePriceId } from '@/lib/billing/stripe-plan-mapping';

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('YEARLY');

  const handleSubscribe = async (tier: PlanTier, cycle: BillingCycle) => {
    if (!isSignedIn) {
      window.location.href = '/register';
      return;
    }

    const priceId = getStripePriceId(tier, cycle);
    if (!priceId) {
      alert('Este plano ainda não está configurado. Contate o suporte.');
      return;
    }

    // Redirecionar para página de checkout customizada
    window.location.href = `/checkout/${priceId}`;
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
            Escolha seu plano
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-navy-400 mb-6 sm:mb-8 px-4">
            Acesse todas as questões oficiais da OAB e aprove na primeira tentativa
          </p>

          {/* Cycle Selector */}
          <div className="inline-flex flex-col sm:flex-row bg-navy-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-1 w-full max-w-md sm:max-w-none sm:w-auto">
            <button
              onClick={() => setSelectedCycle('MONTHLY')}
              className={`px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg font-semibold transition-all text-sm sm:text-base ${
                selectedCycle === 'MONTHLY'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setSelectedCycle('QUARTERLY')}
              className={`px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg font-semibold transition-all text-sm sm:text-base flex items-center justify-center ${
                selectedCycle === 'QUARTERLY'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Trimestral
              <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                {PLANS.PRO.QUARTERLY.discount}% off
              </span>
            </button>
            <button
              onClick={() => setSelectedCycle('YEARLY')}
              className={`px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg font-semibold transition-all text-sm sm:text-base flex items-center justify-center ${
                selectedCycle === 'YEARLY'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Anual
              <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                {PLANS.PREMIUM.YEARLY.discount}% off
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto items-stretch">
          {/* FREE Plan */}
          <Card variant="glass" className="flex flex-col h-full">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Gratuito</h3>
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {formatPrice(0)}
              </div>
              <p className="text-sm sm:text-base text-navy-400">{PLANS.FREE.MONTHLY.description}</p>
            </div>
            <div className="space-y-3 mb-6">
              {PLANS.FREE.MONTHLY.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">{feature}</span>
                </div>
              ))}
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

          {/* BASIC Plan */}
          <Card variant="glass" className="flex flex-col h-full">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {PLANS.BASIC[selectedCycle].name}
              </h3>
              <div className="flex items-baseline mb-2">
                <span className="text-3xl sm:text-4xl font-bold text-white">
                  {formatPrice(PLANS.BASIC[selectedCycle].monthlyValue)}
                </span>
                <span className="text-sm sm:text-base text-gray-400 ml-2">/mês</span>
              </div>
              {selectedCycle !== 'MONTHLY' && (
                <p className="text-xs sm:text-sm text-green-400 mb-2">
                  Total: {formatPrice(PLANS.BASIC[selectedCycle].value)} / {selectedCycle === 'YEARLY' ? 'ano' : 'trimestre'}
                </p>
              )}
              <p className="text-sm sm:text-base text-navy-300">{PLANS.BASIC[selectedCycle].description}</p>
            </div>
            <div className="space-y-3 mb-6">
              {PLANS.BASIC[selectedCycle].features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 text-sm">{feature}</span>
                </div>
              ))}
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full mt-auto"
              onClick={() => handleSubscribe('BASIC', selectedCycle)}
              disabled={loading === `BASIC_${selectedCycle}`}
            >
              {loading === `BASIC_${selectedCycle}` ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Assinar Agora'
              )}
            </Button>
          </Card>

          {/* PRO Plan */}
          <Card variant="glass" className="border-2 border-blue-500 relative flex flex-col h-full">
            <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap">
              Mais Popular
            </div>
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {PLANS.PRO[selectedCycle].name}
              </h3>
              <div className="flex items-baseline mb-2">
                <span className="text-3xl sm:text-4xl font-bold text-white">
                  {formatPrice(PLANS.PRO[selectedCycle].monthlyValue)}
                </span>
                <span className="text-sm sm:text-base text-gray-400 ml-2">/mês</span>
              </div>
              {selectedCycle !== 'MONTHLY' && (
                <p className="text-xs sm:text-sm text-green-400 mb-2">
                  Total: {formatPrice(PLANS.PRO[selectedCycle].value)} / {selectedCycle === 'YEARLY' ? 'ano' : 'trimestre'}
                </p>
              )}
              <p className="text-sm sm:text-base text-navy-300">{PLANS.PRO[selectedCycle].description}</p>
            </div>
            <div className="space-y-3 mb-6">
              {PLANS.PRO[selectedCycle].features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 text-sm">{feature}</span>
                </div>
              ))}
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full mt-auto"
              onClick={() => handleSubscribe('PRO', selectedCycle)}
              disabled={loading === `PRO_${selectedCycle}`}
            >
              {loading === `PRO_${selectedCycle}` ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Assinar Agora'
              )}
            </Button>
          </Card>

          {/* PREMIUM Plan */}
          <Card variant="premium" className="relative flex flex-col h-full">
            <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1 whitespace-nowrap">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              Premium
            </div>
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {PLANS.PREMIUM[selectedCycle].name}
              </h3>
              <div className="flex items-baseline mb-2">
                <span className="text-3xl sm:text-4xl font-bold text-white">
                  {formatPrice(PLANS.PREMIUM[selectedCycle].monthlyValue)}
                </span>
                <span className="text-sm sm:text-base text-gray-400 ml-2">/mês</span>
              </div>
              {selectedCycle !== 'MONTHLY' && (
                <p className="text-xs sm:text-sm text-purple-400 mb-2">
                  Total: {formatPrice(PLANS.PREMIUM[selectedCycle].value)} / {selectedCycle === 'YEARLY' ? 'ano' : 'trimestre'}
                </p>
              )}
              <p className="text-sm sm:text-base text-navy-300">{PLANS.PREMIUM[selectedCycle].description}</p>
            </div>
            <div className="space-y-3 mb-6">
              {PLANS.PREMIUM[selectedCycle].features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 text-sm">{feature}</span>
                </div>
              ))}
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full mt-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              onClick={() => handleSubscribe('PREMIUM', selectedCycle)}
              disabled={loading === `PREMIUM_${selectedCycle}`}
            >
              {loading === `PREMIUM_${selectedCycle}` ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Assinar Premium'
              )}
            </Button>
          </Card>
        </div>

        {/* FAQ / Guarantee */}
        <div className="mt-12 sm:mt-16 max-w-4xl mx-auto px-4">
          <div className="bg-navy-900/50 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
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
