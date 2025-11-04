'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui';
import { ProviderStripe } from '@/components/billing/provider-stripe';
import { FormularioPagamento } from '@/components/billing/formulario-pagamento';
import { Loader2, CheckCircle2, Shield, CreditCard } from 'lucide-react';
import { getPlanFromPriceId } from '@/lib/billing/stripe-plan-mapping';
import { PLANS } from '@/lib/billing/plans';

export default function CheckoutPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const priceId = params.priceId as string;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Obter informações do plano
  const planConfig = getPlanFromPriceId(priceId);
  const planDetails = planConfig
    ? PLANS[planConfig.tier][planConfig.cycle]
    : null;

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push('/register');
      return;
    }

    if (!priceId) return;

    criarIntencaoPagamento();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, isLoaded, priceId]);

  const criarIntencaoPagamento = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const response = await fetch('/api/billing/criar-intencao-pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar intenção de pagamento');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      console.error('Erro:', err);
      setErro(err.message || 'Erro ao carregar checkout');
    } finally {
      setCarregando(false);
    }
  };

  const handleSucesso = () => {
    if (process.env.NODE_ENV === 'development') console.log('Pagamento processado com sucesso!');
  };

  const handleErro = (mensagem: string) => {
    console.error('Erro no pagamento:', mensagem);
  };

  if (!isLoaded || carregando) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando checkout...</p>
        </div>
      </div>
    );
  }

  if (erro || !planConfig || !planDetails) {
    return (
      <div className="min-h-screen bg-navy-950">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card variant="glass">
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">
                {erro || 'Plano não encontrado'}
              </p>
              <button
                onClick={() => router.push('/pricing')}
                className="text-blue-400 hover:text-blue-300"
              >
                Voltar para planos
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <Card variant="glass" className="sticky top-24">
              <h2 className="text-2xl font-bold text-white mb-6">
                Resumo do Pedido
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Plano Selecionado</p>
                  <p className="text-lg font-semibold text-white">
                    {planDetails.name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-1">Descrição</p>
                  <p className="text-white">{planDetails.description}</p>
                </div>

                {planDetails.discount > 0 && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                    <p className="text-green-400 text-sm font-semibold">
                      🎉 Economize {planDetails.discount}%
                    </p>
                  </div>
                )}
              </div>

              {/* Features do Plano */}
              <div className="border-t border-white/10 pt-6 mb-6">
                <p className="text-sm font-semibold text-white mb-3">
                  Incluído no plano:
                </p>
                <div className="space-y-2">
                  {planDetails.features.slice(0, 5).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </div>
                  ))}
                  {planDetails.features.length > 5 && (
                    <p className="text-xs text-gray-400 mt-2">
                      + {planDetails.features.length - 5} benefícios adicionais
                    </p>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-white/10 pt-6">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-gray-400">Valor mensal</span>
                  <span className="text-white">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(planDetails.monthlyValue)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-semibold text-white">Total</span>
                  <span className="text-2xl font-bold text-white">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(planDetails.value)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Cobrado {planConfig.cycle === 'MONTHLY' ? 'mensalmente' : planConfig.cycle === 'QUARTERLY' ? 'trimestralmente' : 'anualmente'}
                </p>
              </div>

              {/* Garantia */}
              <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-400 mb-1">
                      Garantia de 7 dias
                    </p>
                    <p className="text-xs text-gray-400">
                      Se não ficar satisfeito, devolvemos 100% do seu dinheiro
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Formulário de Pagamento */}
          <div className="lg:col-span-2">
            <Card variant="glass">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Finalizar Pagamento
                </h2>
                <p className="text-gray-400">
                  Complete as informações abaixo para confirmar sua assinatura
                </p>
              </div>

              {clientSecret ? (
                <ProviderStripe clientSecret={clientSecret}>
                  <FormularioPagamento
                    clientSecret={clientSecret}
                    onSucesso={handleSucesso}
                    onErro={handleErro}
                  />
                </ProviderStripe>
              ) : (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Preparando checkout...</p>
                </div>
              )}

              {/* Métodos de pagamento aceitos */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <p className="text-sm text-gray-400 text-center mb-4">
                  Métodos de pagamento aceitos:
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-gray-400">
                    <CreditCard className="w-5 h-5" />
                    <span className="text-sm">Cartões</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-lg">🍎</span>
                    <span className="text-sm">Apple Pay</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-lg">📱</span>
                    <span className="text-sm">Google Pay</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
