'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui';
import {
  Loader2,
  CheckCircle2,
  Copy,
  Clock,
  QrCode,
  FileText,
  RefreshCw,
} from 'lucide-react';

interface PaymentData {
  pixQrCode?: {
    encodedImage: string;
    payload: string;
    expirationDate: string;
  };
  bankSlipUrl?: string;
  billingType: string;
  value: number;
  plan: string;
  status: string;
}

export default function PagamentoPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const subscriptionId = params.subscriptionId as string;

  const [data, setData] = useState<PaymentData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiadoState] = useState(false);
  const [verificando, setVerificando] = useState(false);

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      const res = await fetch(`/api/billing/pagamento/${subscriptionId}`);
      if (!res.ok) throw new Error('Erro ao carregar dados do pagamento');
      const json = await res.json();

      if (json.status === 'CONFIRMED' || json.status === 'RECEIVED') {
        router.push('/dashboard?assinatura=ativa');
        return;
      }

      setData(json);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setCarregando(false);
    }
  }, [subscriptionId, router]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push('/register');
      return;
    }
    carregarDados();
  }, [isLoaded, isSignedIn, carregarDados, router]);

  // Auto-refresh a cada 15s para verificar pagamento PIX
  useEffect(() => {
    if (!data || data.billingType !== 'PIX') return;
    const interval = setInterval(carregarDados, 15000);
    return () => clearInterval(interval);
  }, [data, carregarDados]);

  const copiarPix = async () => {
    if (!data?.pixQrCode?.payload) return;
    await navigator.clipboard.writeText(data.pixQrCode.payload);
    setCopiadoState(true);
    setTimeout(() => setCopiadoState(false), 3000);
  };

  const verificarPagamento = async () => {
    setVerificando(true);
    await carregarDados();
    setVerificando(false);
  };

  if (!isLoaded || carregando) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-bg">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card variant="glass">
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{erro}</p>
              <button
                onClick={() => router.push('/pricing')}
                className="text-accent hover:text-accent"
              >
                Voltar para planos
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card variant="glass">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-ink-1 mb-2">
              {data?.billingType === 'PIX' ? 'Pagamento via PIX' : 'Pagamento via Boleto'}
            </h1>
            <p className="text-gray-400">
              {data?.plan} &mdash; {data?.value ? formatCurrency(data.value) : ''}
            </p>
          </div>

          {/* PIX */}
          {data?.billingType === 'PIX' && data.pixQrCode && (
            <div className="space-y-6">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-2xl">
                  <img
                    src={`data:image/png;base64,${data.pixQrCode.encodedImage}`}
                    alt="QR Code PIX"
                    className="w-64 h-64"
                  />
                </div>
              </div>

              {/* Copia e Cola */}
              <div>
                <p className="text-sm text-gray-400 mb-2 text-center">
                  Ou copie o código PIX:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={data.pixQrCode.payload}
                    className="flex-1 bg-surface-2 border rounded-xl px-4 py-3 text-ink-1 text-sm font-mono truncate"
                  />
                  <button
                    onClick={copiarPix}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl transition-colors whitespace-nowrap"
                  >
                    {copiado ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-400">
                      Aguardando pagamento
                    </p>
                    <p className="text-xs text-gray-400">
                      O PIX é confirmado em segundos. Esta página atualiza automaticamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BOLETO */}
          {data?.billingType === 'BOLETO' && data.bankSlipUrl && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <a
                  href={data.bankSlipUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl transition-colors text-lg font-semibold"
                >
                  <FileText className="w-6 h-6" />
                  Abrir Boleto
                </a>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-400">
                      Aguardando pagamento
                    </p>
                    <p className="text-xs text-gray-400">
                      Boletos podem levar até 3 dias úteis para compensar. Sua assinatura
                      será ativada automaticamente após a confirmação.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verificar pagamento manualmente */}
          <div className="mt-8 text-center">
            <button
              onClick={verificarPagamento}
              disabled={verificando}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-ink-1 transition-colors text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${verificando ? 'animate-spin' : ''}`} />
              {verificando ? 'Verificando...' : 'Verificar pagamento'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
