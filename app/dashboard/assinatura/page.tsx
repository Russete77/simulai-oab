'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Header } from '@/components/layout/header';
import { Card, Button } from '@/components/ui';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Calendar,
  CreditCard,
  AlertCircle,
  Crown,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

interface AssinaturaData {
  hasSubscription: boolean;
  planType: string;
  status: string;
  plan: string;
  value: number;
  cycle: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  subscriptionId: string;
}

export default function AssinaturaPage() {
  const { isLoaded } = useUser();

  const [assinatura, setAssinatura] = useState<AssinaturaData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      carregarAssinatura();
    }
  }, [isLoaded]);

  const carregarAssinatura = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const response = await fetch('/api/billing/status');
      if (!response.ok) throw new Error('Erro ao carregar assinatura');

      const data = await response.json();
      setAssinatura(data);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setCarregando(false);
    }
  };

  const cancelarAssinatura = async () => {
    try {
      setCancelando(true);

      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao cancelar');
      }

      setShowConfirmCancel(false);
      await carregarAssinatura();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao cancelar assinatura');
    } finally {
      setCancelando(false);
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const getCycleName = (cycle: string) => {
    // Todos os planos são mensais agora
    return 'Mensal';
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string; icon: any }> = {
      ACTIVE: {
        label: 'Ativa',
        className: 'bg-green-500/10 border-green-500/20 text-green-500',
        icon: CheckCircle2,
      },
      PAST_DUE: {
        label: 'Pagamento Atrasado',
        className: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
        icon: AlertCircle,
      },
      CANCELED: {
        label: 'Cancelada',
        className: 'bg-red-500/10 border-red-500/20 text-red-500',
        icon: XCircle,
      },
    };

    const badge = badges[status] || badges.ACTIVE;
    const Icon = badge.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${badge.className}`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-semibold">{badge.label}</span>
      </div>
    );
  };

  const getPlanBadge = (plan: string) => {
    if (plan?.startsWith('PRO') || plan?.startsWith('PREMIUM')) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <Crown className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-purple-400">Pro</span>
        </div>
      );
    }
    if (plan?.startsWith('BASIC')) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-blue-400">Essencial</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-500/10 border border-gray-500/20">
        <span className="text-sm font-semibold text-gray-400">Gratuito</span>
      </div>
    );
  };

  if (!isLoaded || carregando) {
    return (
      <div className="min-h-screen bg-navy-950">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Carregando informações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Minha Assinatura
          </h1>
          <p className="text-gray-400">
            Gerencie sua assinatura e forma de pagamento
          </p>
        </div>

        {erro ? (
          <Card variant="glass">
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-500 mb-4">{erro}</p>
              <Button onClick={carregarAssinatura}>Tentar Novamente</Button>
            </div>
          </Card>
        ) : !assinatura?.hasSubscription ? (
          <Card variant="glass">
            <div className="text-center py-12">
              <p className="text-gray-400 mb-2">
                Seu plano atual: <span className="text-white font-semibold">{assinatura?.planType || 'FREE'}</span>
              </p>
              <p className="text-gray-400 mb-6">
                Faça upgrade para acessar mais questões, simulados e recursos com IA.
              </p>
              <Link href="/pricing">
                <Button variant="primary">Ver Planos</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Status */}
              <Card variant="glass">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Status da Assinatura
                    </h2>
                    <div className="flex items-center gap-3 flex-wrap">
                      {getStatusBadge(assinatura.status)}
                      {getPlanBadge(assinatura.plan)}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Próxima Cobrança</span>
                    </div>
                    <p className="text-xl font-semibold text-white">
                      {assinatura.currentPeriodEnd
                        ? formatarData(assinatura.currentPeriodEnd)
                        : '—'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <CreditCard className="w-4 h-4" />
                      <span className="text-sm">Valor</span>
                    </div>
                    <p className="text-xl font-semibold text-white">
                      {formatarValor(assinatura.value)}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <span className="text-sm">Ciclo</span>
                    </div>
                    <p className="text-xl font-semibold text-white">
                      {getCycleName(assinatura.cycle)}
                    </p>
                  </div>
                </div>

                {assinatura.cancelAtPeriodEnd && (
                  <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-yellow-400 font-semibold mb-1">
                          Assinatura será cancelada
                        </p>
                        <p className="text-sm text-gray-400">
                          Sua assinatura será cancelada em{' '}
                          {assinatura.currentPeriodEnd
                            ? formatarData(assinatura.currentPeriodEnd)
                            : 'breve'}
                          . Você mantém acesso até lá.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Ações */}
            <div className="space-y-6">
              <Card variant="glass">
                <h3 className="text-lg font-bold text-white mb-4">Ações</h3>
                <div className="space-y-3">
                  <Link href="/pricing">
                    <Button variant="primary" className="w-full">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Fazer Upgrade
                    </Button>
                  </Link>

                  {assinatura.status === 'ACTIVE' && !assinatura.cancelAtPeriodEnd && (
                    <>
                      {!showConfirmCancel ? (
                        <Button
                          variant="outline"
                          className="w-full text-red-500 border-red-500/20 hover:bg-red-500/10"
                          onClick={() => setShowConfirmCancel(true)}
                        >
                          Cancelar Assinatura
                        </Button>
                      ) : (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-3">
                          <p className="text-sm text-red-500">
                            Tem certeza? Você perderá acesso aos recursos premium ao fim do período.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1 text-red-500 border-red-500/20"
                              onClick={cancelarAssinatura}
                              disabled={cancelando}
                            >
                              {cancelando ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Confirmar'
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => setShowConfirmCancel(false)}
                            >
                              Voltar
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>

              <Card variant="glass">
                <h3 className="text-lg font-bold text-white mb-4">
                  Precisa de Ajuda?
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Entre em contato com nosso suporte para qualquer dúvida.
                </p>
                <a href="mailto:suporte@simulaioab.com">
                  <Button variant="outline" className="w-full">
                    Contatar Suporte
                  </Button>
                </a>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
