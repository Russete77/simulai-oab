'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui';
import {
  Loader2,
  CheckCircle2,
  Shield,
  CreditCard,
  QrCode,
  FileText,
} from 'lucide-react';
import { PLANS, type PlanTier, type BillingCycle } from '@/lib/billing/plans';

type BillingMethod = 'PIX' | 'BOLETO' | 'CREDIT_CARD';

export default function CheckoutPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const planKey = params.priceId as string; // ex: "BASIC_MONTHLY" ou "PRO_MONTHLY"

  const [billingMethod, setBillingMethod] = useState<BillingMethod>('PIX');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Cartão
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpMonth, setCardExpMonth] = useState('');
  const [cardExpYear, setCardExpYear] = useState('');
  const [cardCcv, setCardCcv] = useState('');
  const [cardPostalCode, setCardPostalCode] = useState('');
  const [cardAddressNumber, setCardAddressNumber] = useState('');
  const [cardPhone, setCardPhone] = useState('');

  // Parse planKey → tier + cycle
  const parts = planKey?.split('_') || [];
  const tier = parts[0] as PlanTier;
  const cycle = parts.slice(1).join('_') as BillingCycle;
  const planDetails =
    tier && cycle && PLANS[tier]?.[cycle] ? PLANS[tier][cycle] : null;

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push('/register');
    }
  }, [isLoaded, isSignedIn, router]);

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };

  const handleSubmit = async () => {
    if (!cpfCnpj || cpfCnpj.replace(/\D/g, '').length < 11) {
      setErro('CPF/CNPJ inválido');
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const payload: Record<string, any> = {
        plan: planKey,
        billingType: billingMethod,
        cpfCnpj: cpfCnpj.replace(/\D/g, ''),
      };

      if (billingMethod === 'CREDIT_CARD') {
        if (!cardNumber || !cardName || !cardExpMonth || !cardExpYear || !cardCcv) {
          setErro('Preencha todos os dados do cartão');
          setCarregando(false);
          return;
        }
        payload.creditCard = {
          holderName: cardName,
          number: cardNumber.replace(/\s/g, ''),
          expiryMonth: cardExpMonth,
          expiryYear: cardExpYear,
          ccv: cardCcv,
        };
        payload.creditCardHolderInfo = {
          name: cardName,
          email: user?.emailAddresses[0]?.emailAddress || '',
          cpfCnpj: cpfCnpj.replace(/\D/g, ''),
          postalCode: cardPostalCode.replace(/\D/g, ''),
          addressNumber: cardAddressNumber,
          phone: cardPhone.replace(/\D/g, ''),
        };
      }

      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar assinatura');
      }

      // Redirecionar
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao processar pagamento');
    } finally {
      setCarregando(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!planDetails) {
    return (
      <div className="min-h-screen bg-navy-950">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card variant="glass">
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">Plano não encontrado</p>
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

  const formatPrice = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

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
                    <p className="text-green-500 text-sm font-semibold">
                      Economize {planDetails.discount}%
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-6 mb-6">
                <p className="text-sm font-semibold text-white mb-3">
                  Incluído no plano:
                </p>
                <div className="space-y-2">
                  {planDetails.features.slice(0, 5).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
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

              <div className="border-t border-white/10 pt-6">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-gray-400">Valor mensal</span>
                  <span className="text-white">{formatPrice(planDetails.monthlyValue)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-semibold text-white">Total</span>
                  <span className="text-2xl font-bold text-white">
                    {formatPrice(planDetails.value)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Cobrado mensalmente
                </p>
              </div>

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
                  Escolha a forma de pagamento e complete sua assinatura
                </p>
              </div>

              {/* Seletor de método */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                <button
                  onClick={() => setBillingMethod('PIX')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    billingMethod === 'PIX'
                      ? 'border-green-500 bg-green-500/10 text-green-500'
                      : 'border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <QrCode className="w-6 h-6" />
                  <span className="text-sm font-semibold">PIX</span>
                  <span className="text-xs opacity-70">Instantâneo</span>
                </button>
                <button
                  onClick={() => setBillingMethod('BOLETO')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    billingMethod === 'BOLETO'
                      ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                      : 'border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <FileText className="w-6 h-6" />
                  <span className="text-sm font-semibold">Boleto</span>
                  <span className="text-xs opacity-70">1-3 dias úteis</span>
                </button>
                <button
                  onClick={() => setBillingMethod('CREDIT_CARD')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    billingMethod === 'CREDIT_CARD'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-sm font-semibold">Cartão</span>
                  <span className="text-xs opacity-70">Instantâneo</span>
                </button>
              </div>

              {/* CPF/CNPJ (sempre necessário) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CPF ou CNPJ
                </label>
                <input
                  type="text"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Campos de cartão */}
              {billingMethod === 'CREDIT_CARD' && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nome no cartão
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Como está no cartão"
                      className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Número do cartão
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      placeholder="0000 0000 0000 0000"
                      className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Mês</label>
                      <input
                        type="text"
                        value={cardExpMonth}
                        onChange={(e) => setCardExpMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                        placeholder="MM"
                        className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Ano</label>
                      <input
                        type="text"
                        value={cardExpYear}
                        onChange={(e) => setCardExpYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="AAAA"
                        className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">CVV</label>
                      <input
                        type="text"
                        value={cardCcv}
                        onChange={(e) => setCardCcv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="000"
                        className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-center font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">CEP</label>
                      <input
                        type="text"
                        value={cardPostalCode}
                        onChange={(e) => setCardPostalCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        placeholder="00000-000"
                        className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Número</label>
                      <input
                        type="text"
                        value={cardAddressNumber}
                        onChange={(e) => setCardAddressNumber(e.target.value)}
                        placeholder="Nº endereço"
                        className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
                    <input
                      type="text"
                      value={cardPhone}
                      onChange={(e) => setCardPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      placeholder="11999999999"
                      className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Erro */}
              {erro && (
                <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-red-500 text-sm">{erro}</p>
                </div>
              )}

              {/* Botão */}
              <button
                onClick={handleSubmit}
                disabled={carregando}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
              >
                {carregando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Pagar {formatPrice(planDetails.value)}
                    {billingMethod === 'PIX' && ' via PIX'}
                    {billingMethod === 'BOLETO' && ' via Boleto'}
                    {billingMethod === 'CREDIT_CARD' && ' no Cartão'}
                  </>
                )}
              </button>

              {/* Métodos aceitos */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <p className="text-sm text-gray-400 text-center mb-4">
                  Pagamento processado com segurança via Asaas
                </p>
                <div className="flex items-center justify-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2 text-gray-400">
                    <QrCode className="w-5 h-5" />
                    <span className="text-sm">PIX</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm">Boleto</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <CreditCard className="w-5 h-5" />
                    <span className="text-sm">Cartões</span>
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
