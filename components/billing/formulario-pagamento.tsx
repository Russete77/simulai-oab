'use client';

import { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui';
import { Loader2, Lock, CreditCard } from 'lucide-react';
import { paymentElementOptions } from '@/lib/stripe/appearance';

interface FormularioPagamentoProps {
  clientSecret: string;
  onSucesso?: () => void;
  onErro?: (erro: string) => void;
}

/**
 * Formulário de pagamento com Stripe Payment Element
 * Componente customizado para checkout embedded
 */
export function FormularioPagamento({
  clientSecret,
  onSucesso,
  onErro,
}: FormularioPagamentoProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [processando, setProcessando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') console.log('[FORMULARIO_PAGAMENTO] Estado:', {
      hasStripe: !!stripe,
      hasElements: !!elements,
      clientSecret: clientSecret?.substring(0, 20) + '...',
    });

    if (!stripe || !elements) {
      if (process.env.NODE_ENV === 'development') console.log('[FORMULARIO_PAGAMENTO] Aguardando Stripe carregar...');
      return;
    }

    // Payment Element está pronto
    if (process.env.NODE_ENV === 'development') console.log('[FORMULARIO_PAGAMENTO] Stripe pronto!');
    setPronto(true);
  }, [stripe, elements, clientSecret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessando(true);
    setMensagemErro(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?pagamento=sucesso`,
        },
      });

      if (error) {
        // Erros de pagamento (cartão recusado, etc)
        const mensagem = error.message || 'Erro ao processar pagamento';
        setMensagemErro(mensagem);
        onErro?.(mensagem);
      } else {
        // Pagamento confirmado - será redirecionado
        onSucesso?.();
      }
    } catch (err: any) {
      const mensagem = err.message || 'Erro inesperado ao processar pagamento';
      setMensagemErro(mensagem);
      onErro?.(mensagem);
    } finally {
      setProcessando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="bg-navy-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Informações de Pagamento
            </h3>
            <p className="text-sm text-gray-400">
              Seus dados estão seguros e criptografados
            </p>
          </div>
        </div>

        <PaymentElement
          options={paymentElementOptions}
        />
      </div>

      {/* Mensagem de erro */}
      {mensagemErro && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-400 text-sm">{mensagemErro}</p>
        </div>
      )}

      {/* Botão de pagamento */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!pronto || processando || !stripe || !elements}
      >
        {processando ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processando pagamento...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5 mr-2" />
            Confirmar Pagamento
          </>
        )}
      </Button>

      {/* Informações de segurança */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
        <Lock className="w-4 h-4" />
        <span>Pagamento seguro processado pelo Stripe</span>
      </div>
    </form>
  );
}
