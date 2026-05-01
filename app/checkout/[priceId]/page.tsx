'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, Button, Input, Badge } from '@/components/ui';
import {
  Loader2,
  CheckCircle2,
  Shield,
  CreditCard,
  QrCode,
  FileText,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { clsx } from 'clsx';
import { PLANS, type PlanTier, type BillingCycle } from '@/lib/billing/plans';

type BillingMethod = 'PIX' | 'BOLETO' | 'CREDIT_CARD';

const METHOD_META: Record<
  BillingMethod,
  { label: string; sublabel: string; icon: typeof QrCode }
> = {
  PIX: { label: 'PIX', sublabel: 'Aprovação imediata', icon: QrCode },
  BOLETO: { label: 'Boleto', sublabel: '1 a 3 dias úteis', icon: FileText },
  CREDIT_CARD: { label: 'Cartão', sublabel: 'Aprovação imediata', icon: CreditCard },
};

export default function CheckoutPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const planKey = params.priceId as string;

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

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    return digits.length > 5 ? digits.replace(/(\d{5})(\d)/, '$1-$2') : digits;
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
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-ink-3 animate-spin" />
      </div>
    );
  }

  if (!planDetails) {
    return (
      <div className="min-h-screen bg-bg">
        <Header />
        <div className="container-narrow py-16">
          <Card>
            <div className="text-center py-8">
              <p className="text-ink-1 font-medium mb-1">Plano não encontrado</p>
              <p className="text-sm text-ink-3 mb-5">
                O plano selecionado não existe ou foi descontinuado.
              </p>
              <Button onClick={() => router.push('/pricing')} variant="secondary" size="sm">
                Voltar para planos
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const formatPrice = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const ctaLabel = (() => {
    const price = formatPrice(planDetails.value);
    if (billingMethod === 'PIX') return `Pagar ${price} via PIX`;
    if (billingMethod === 'BOLETO') return `Gerar boleto de ${price}`;
    return `Pagar ${price} no cartão`;
  })();

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <div className="container-page py-8 sm:py-12">
        {/* Top bar */}
        <div className="mb-8 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <span className="text-ink-3 text-sm">/</span>
          <span className="text-eyebrow">Checkout</span>
        </div>

        <div className="mb-8">
          <h1 className="text-display mb-2">Finalizar assinatura</h1>
          <p className="text-ink-2 text-sm">
            Você está a um passo de liberar seu acesso. Cancele quando quiser.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start">
          {/* ====================== ORDER SUMMARY ====================== */}
          <div className="lg:col-span-2 lg:sticky lg:top-20">
            <Card padding="none">
              <div className="px-6 pt-6 pb-5 border-b">
                <span className="text-eyebrow">Resumo do pedido</span>
                <div className="mt-3 flex items-baseline justify-between gap-3">
                  <h2 className="text-xl font-semibold text-ink-1">
                    {planDetails.name}
                  </h2>
                  {planDetails.discount > 0 && (
                    <Badge variant="success">−{planDetails.discount}%</Badge>
                  )}
                </div>
                <p className="text-sm text-ink-3 mt-1.5 leading-relaxed">
                  {planDetails.description}
                </p>
              </div>

              <div className="px-6 py-5 border-b">
                <span className="text-eyebrow">Incluído</span>
                <ul className="mt-3 space-y-2">
                  {planDetails.features.slice(0, 6).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      <span className="text-sm text-ink-2 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                  {planDetails.features.length > 6 && (
                    <li className="text-xs text-ink-3 pl-6">
                      + {planDetails.features.length - 6} outros benefícios
                    </li>
                  )}
                </ul>
              </div>

              <div className="px-6 py-5 border-b space-y-2">
                <div className="flex justify-between items-baseline text-sm">
                  <span className="text-ink-3">Subtotal</span>
                  <span className="text-ink-2 text-mono-tabular">
                    {formatPrice(planDetails.value)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t">
                  <span className="text-sm font-medium text-ink-1">Total hoje</span>
                  <div className="text-right">
                    <span className="text-2xl font-semibold text-ink-1 text-mono-tabular">
                      {formatPrice(planDetails.value)}
                    </span>
                    <p className="text-xs text-ink-3 mt-0.5">Cobrado mensalmente</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 flex items-start gap-3">
                <Shield className="w-4 h-4 text-ink-3 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-ink-1">Garantia de 7 dias</p>
                  <p className="text-xs text-ink-3 mt-0.5 leading-relaxed">
                    Se não ficar satisfeito, devolvemos 100% do seu dinheiro.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* ====================== PAYMENT FORM ====================== */}
          <div className="lg:col-span-3">
            <Card padding="none">
              <div className="px-6 pt-6 pb-5 border-b">
                <span className="text-eyebrow">Forma de pagamento</span>
                <h2 className="text-xl font-semibold text-ink-1 mt-2">
                  Escolha como pagar
                </h2>
                <p className="text-sm text-ink-3 mt-1">
                  Suas informações são processadas com criptografia.
                </p>
              </div>

              {/* Method selector */}
              <div className="px-6 py-5 border-b">
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(METHOD_META) as BillingMethod[]).map((method) => {
                    const meta = METHOD_META[method];
                    const Icon = meta.icon;
                    const active = billingMethod === method;
                    return (
                      <button
                        key={method}
                        onClick={() => setBillingMethod(method)}
                        type="button"
                        className={clsx(
                          'flex flex-col items-center text-center gap-1.5 px-3 py-4 rounded-md border transition-all',
                          active
                            ? 'border-accent bg-accent-soft'
                            : 'border bg-surface hover:bg-surface-2 hover:border-strong'
                        )}
                      >
                        <Icon
                          className={clsx(
                            'w-5 h-5',
                            active ? 'text-accent' : 'text-ink-2'
                          )}
                        />
                        <span
                          className={clsx(
                            'text-sm font-medium',
                            active ? 'text-accent' : 'text-ink-1'
                          )}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-ink-3">{meta.sublabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form */}
              <div className="px-6 py-5 space-y-5">
                <Input
                  label="CPF ou CNPJ"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  autoComplete="off"
                />

                {billingMethod === 'PIX' && (
                  <div className="bg-surface-2 border rounded-md px-4 py-3 flex items-start gap-3">
                    <QrCode className="w-4 h-4 text-ink-3 shrink-0 mt-0.5" />
                    <div className="text-xs text-ink-2 leading-relaxed">
                      Após confirmar, você verá o QR Code para pagar pelo seu banco.
                      A liberação é{' '}
                      <span className="text-ink-1 font-medium">imediata</span>.
                    </div>
                  </div>
                )}

                {billingMethod === 'BOLETO' && (
                  <div className="bg-surface-2 border rounded-md px-4 py-3 flex items-start gap-3">
                    <FileText className="w-4 h-4 text-ink-3 shrink-0 mt-0.5" />
                    <div className="text-xs text-ink-2 leading-relaxed">
                      O boleto leva de 1 a 3 dias úteis para compensar. Seu acesso é
                      liberado automaticamente após o pagamento.
                    </div>
                  </div>
                )}

                {billingMethod === 'CREDIT_CARD' && (
                  <div className="space-y-4 pt-1">
                    <Input
                      label="Nome impresso no cartão"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Como aparece no cartão"
                      autoComplete="cc-name"
                    />
                    <Input
                      label="Número do cartão"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      className="text-mono-tabular"
                      leadingIcon={<CreditCard className="w-4 h-4" />}
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        label="Mês"
                        value={cardExpMonth}
                        onChange={(e) =>
                          setCardExpMonth(e.target.value.replace(/\D/g, '').slice(0, 2))
                        }
                        placeholder="MM"
                        inputMode="numeric"
                        autoComplete="cc-exp-month"
                        className="text-center text-mono-tabular"
                      />
                      <Input
                        label="Ano"
                        value={cardExpYear}
                        onChange={(e) =>
                          setCardExpYear(e.target.value.replace(/\D/g, '').slice(0, 4))
                        }
                        placeholder="AAAA"
                        inputMode="numeric"
                        autoComplete="cc-exp-year"
                        className="text-center text-mono-tabular"
                      />
                      <Input
                        label="CVV"
                        value={cardCcv}
                        onChange={(e) =>
                          setCardCcv(e.target.value.replace(/\D/g, '').slice(0, 4))
                        }
                        placeholder="000"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        className="text-center text-mono-tabular"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="CEP"
                        value={cardPostalCode}
                        onChange={(e) => setCardPostalCode(formatCep(e.target.value))}
                        placeholder="00000-000"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        className="text-mono-tabular"
                      />
                      <Input
                        label="Número do endereço"
                        value={cardAddressNumber}
                        onChange={(e) => setCardAddressNumber(e.target.value)}
                        placeholder="Ex: 123"
                      />
                    </div>
                    <Input
                      label="Telefone"
                      value={cardPhone}
                      onChange={(e) =>
                        setCardPhone(e.target.value.replace(/\D/g, '').slice(0, 11))
                      }
                      placeholder="(11) 99999-9999"
                      inputMode="numeric"
                      autoComplete="tel"
                      className="text-mono-tabular"
                    />
                  </div>
                )}

                {erro && (
                  <div className="bg-danger-soft border border-danger rounded-md px-4 py-3">
                    <p className="text-danger text-sm">{erro}</p>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={carregando}
                  fullWidth
                  size="lg"
                >
                  {carregando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      {ctaLabel}
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-ink-3">
                  Ao confirmar, você concorda com nossos{' '}
                  <a href="/termos" className="underline hover:text-ink-1">
                    Termos
                  </a>{' '}
                  e{' '}
                  <a href="/privacidade" className="underline hover:text-ink-1">
                    Política de Privacidade
                  </a>
                  .
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t bg-surface-2 rounded-b-lg">
                <div className="flex items-center justify-center gap-2 text-xs text-ink-3">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Pagamento processado com segurança via Asaas</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
