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
  ExternalLink,
  AlertCircle,
  Crown,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

interface Assinatura {
  id: string;
  plan: string;
  status: string;
  value: number;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string;
}

interface Pagamento {
  id: string;
  value: number;
  status: string;
  paymentDate: string | null;
  paymentMethod: string;
  receiptUrl: string | null;
}

export default function AssinaturaPage() {
  const { user, isLoaded } = useUser();

  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [abrindoPortal, setAbrindoPortal] = useState(false);

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
      if (!response.ok) {
        throw new Error('Erro ao carregar assinatura');
      }

      const data = await response.json();
      setAssinatura(data.subscription);
      setPagamentos(data.payments || []);
    } catch (err: any) {
      console.error('Erro:', err);
      setErro(err.message || 'Erro ao carregar dados');
    } finally {
      setCarregando(false);
    }
  };

  const abrirPortalCliente = async () => {
    try {
      setAbrindoPortal(true);

      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Erro ao abrir portal');
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Erro:', err);
      alert('Erro ao abrir portal de gerenciamento');
    } finally {
      setAbrindoPortal(false);
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

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string; icon: any }> = {
      ACTIVE: {
        label: 'Ativa',
        className: 'bg-green-500/10 border-green-500/20 text-green-400',
        icon: CheckCircle2,
      },
      TRIALING: {
        label: 'Em Teste',
        className: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        icon: AlertCircle,
      },
      CANCELED: {
        label: 'Cancelada',
        className: 'bg-red-500/10 border-red-500/20 text-red-400',
        icon: XCircle,
      },
      PAST_DUE: {
        label: 'Vencida',
        className: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
        icon: AlertCircle,
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
    if (plan.startsWith('PREMIUM')) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <Crown className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-purple-400">Premium</span>
        </div>
      );
    }
    if (plan.startsWith('PRO')) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-blue-400">Pro</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-500/10 border border-gray-500/20">
        <span className="text-sm font-semibold text-gray-400">Básico</span>
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Minha Assinatura
          </h1>
          <p className="text-gray-400">
            Gerencie sua assinatura e histórico de pagamentos
          </p>
        </div>

        {erro ? (
          <Card variant="glass">
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-4">{erro}</p>
              <Button onClick={carregarAssinatura}>Tentar Novamente</Button>
            </div>
          </Card>
        ) : !assinatura ? (
          <Card variant="glass">
            <div className="text-center py-12">
              <p className="text-gray-400 mb-6">
                Você ainda não possui uma assinatura ativa.
              </p>
              <Link href="/pricing">
                <Button variant="primary">Ver Planos</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Informações da Assinatura */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Atual */}
              <Card variant="glass">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Status da Assinatura
                    </h2>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(assinatura.status)}
                      {getPlanBadge(assinatura.plan)}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={abrirPortalCliente}
                    disabled={abrindoPortal}
                  >
                    {abrindoPortal ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Abrindo...
                      </>
                    ) : (
                      <>
                        Gerenciar
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Próxima Cobrança</span>
                    </div>
                    <p className="text-xl font-semibold text-white">
                      {formatarData(assinatura.currentPeriodEnd)}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <CreditCard className="w-4 h-4" />
                      <span className="text-sm">Valor Mensal</span>
                    </div>
                    <p className="text-xl font-semibold text-white">
                      {formatarValor(assinatura.value)}
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
                          Sua assinatura será cancelada em {formatarData(assinatura.currentPeriodEnd)}.
                          Você ainda pode usar todos os recursos até lá.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Histórico de Pagamentos */}
              <Card variant="glass">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Histórico de Pagamentos
                </h2>

                {pagamentos.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    Nenhum pagamento registrado ainda
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pagamentos.map((pagamento) => (
                      <div
                        key={pagamento.id}
                        className="flex items-center justify-between p-4 bg-navy-900/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            pagamento.status === 'CONFIRMED'
                              ? 'bg-green-500/10'
                              : 'bg-red-500/10'
                          }`}>
                            {pagamento.status === 'CONFIRMED' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-semibold">
                              {formatarValor(pagamento.value)}
                            </p>
                            <p className="text-sm text-gray-400">
                              {pagamento.paymentDate
                                ? formatarData(pagamento.paymentDate)
                                : 'Pendente'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-400">
                            {pagamento.paymentMethod}
                          </span>
                          {pagamento.receiptUrl && (
                            <a
                              href={pagamento.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Ações Rápidas */}
            <div className="space-y-6">
              <Card variant="glass">
                <h3 className="text-lg font-bold text-white mb-4">
                  Ações Rápidas
                </h3>

                <div className="space-y-3">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={abrirPortalCliente}
                    disabled={abrindoPortal}
                  >
                    {abrindoPortal ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    Gerenciar Pagamento
                  </Button>

                  <Link href="/pricing">
                    <Button variant="outline" className="w-full">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Fazer Upgrade
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card variant="glass">
                <h3 className="text-lg font-bold text-white mb-4">
                  Precisa de Ajuda?
                </h3>

                <p className="text-sm text-gray-400 mb-4">
                  Entre em contato com nosso suporte para qualquer dúvida sobre sua assinatura.
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
