'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Card, Button, Badge } from '@/components/ui';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Info,
  CalendarX,
  RotateCcw,
} from 'lucide-react';
import { AssinarButton } from '@/components/billing/assinar-button';

interface Status {
  assinante: boolean;
  status: string;
  gateway?: string;
  valor?: number;
  renovaEm?: string | null;
  /** Tem data de fim marcada: nao vai renovar. */
  cancelaNoFimDoPeriodo?: boolean;
  /** Ate quando o acesso vale. */
  acessoAte?: string | null;
  podeReativar?: boolean;
  temPortal?: boolean;
  precoFormatado: string;
  /** "todo mês", "a cada 6 meses", "uma vez por ano". */
  cicloCobranca?: string;
  cicloRotulo?: string;
}

const ROTULO: Record<string, string> = {
  ACTIVE: 'Ativa',
  TRIALING: 'Em teste',
  PAST_DUE: 'Pagamento pendente',
  CANCELED: 'Cancelada',
  UNPAID: 'Não paga',
  INCOMPLETE: 'Aguardando pagamento',
  INCOMPLETE_EXPIRED: 'Expirada',
  PAUSED: 'Pausada',
  sem_assinatura: 'Sem assinatura',
};

function formatarData(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function AssinaturaClient() {
  const { isLoaded } = useUser();
  const params = useSearchParams();
  const voltouDeCancelamento = params.get('assinatura') === 'cancelada';
  const [dados, setDados] = useState<Status | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [abrindoPortal, setAbrindoPortal] = useState(false);
  const [reativando, setReativando] = useState(false);
  const [reativou, setReativou] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);
      // `sincronizar=1`: e para ca que o portal da Stripe devolve a pessoa,
      // e o webhook que conta o que ela fez la chega depois do redirect.
      const res = await fetch('/api/billing/status?sincronizar=1');
      if (!res.ok) throw new Error('Não foi possível carregar sua assinatura.');
      setDados(await res.json());
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) carregar();
  }, [isLoaded, carregar]);

  const reativar = async () => {
    setErro(null);
    setReativando(true);
    try {
      const res = await fetch('/api/billing/reativar', { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Nao foi possivel reativar.');
      setReativou(true);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Nao foi possivel reativar.');
    } finally {
      setReativando(false);
    }
  };

  const abrirPortal = async (acao?: 'cancelar') => {
    setErro(null);
    setAbrindoPortal(true);
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao, voltarPara: '/dashboard/assinatura' }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || 'Erro ao abrir o portal');
      window.location.href = json.url;
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao abrir o portal');
      setAbrindoPortal(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <main id="main-content" role="main" className="container-page py-10 max-w-2xl">
        <header className="mb-8">
          <p className="text-eyebrow mb-2">Conta</p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-1">
            Assinatura
          </h1>
        </header>

        {reativou && (
          <div className="mb-5 flex items-start gap-2.5 p-4 rounded-lg border border-success/30 bg-success-soft">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <p className="text-sm text-ink-1 leading-relaxed">
              Assinatura reativada. Ela volta a renovar normalmente — nada foi
              cobrado agora.
            </p>
          </div>
        )}

        {voltouDeCancelamento && !reativou && !carregando && (
          <div className="mb-5 flex items-start gap-2.5 p-4 rounded-lg border bg-surface-2">
            <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p className="text-sm text-ink-2 leading-relaxed">
              Cancelamento registrado. Nada muda agora: veja abaixo até quando
              seu acesso vale.
            </p>
          </div>
        )}

        {carregando && (
          <Card>
            <div className="flex items-center gap-3 text-ink-2 py-6 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
              Carregando...
            </div>
          </Card>
        )}

        {!carregando && erro && (
          <Card>
            <div className="flex items-start gap-3 py-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-ink-1 font-medium mb-1">{erro}</p>
                <Button variant="ghost" size="sm" onClick={carregar}>
                  Tentar de novo
                </Button>
              </div>
            </div>
          </Card>
        )}

        {!carregando && !erro && dados && (
          <>
            {dados.assinante ? (
              <Card>
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      {dados.cancelaNoFimDoPeriodo ? (
                        <CalendarX className="w-5 h-5 text-warning" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      )}
                      <span className="text-lg font-semibold text-ink-1">
                        {dados.cancelaNoFimDoPeriodo
                          ? 'Cancelamento agendado'
                          : 'Assinatura ativa'}
                      </span>
                    </div>
                    <p className="text-sm text-ink-2">
                      {dados.precoFormatado} {dados.cicloCobranca ?? 'todo mês'}
                    </p>
                  </div>
                  <Badge variant={dados.cancelaNoFimDoPeriodo ? 'warning' : 'accent'}>
                    {dados.cancelaNoFimDoPeriodo
                      ? 'Não renova'
                      : (ROTULO[dados.status] ?? dados.status)}
                  </Badge>
                </div>

                {dados.cancelaNoFimDoPeriodo
                  ? dados.acessoAte && (
                      <p className="text-sm text-ink-2 mb-6 leading-relaxed">
                        Você continua com acesso completo até{' '}
                        <strong className="text-ink-1">
                          {formatarData(dados.acessoAte)}
                        </strong>
                        . Nessa data a assinatura acaba e o cartão não é
                        cobrado de novo.
                      </p>
                    )
                  : dados.renovaEm && (
                      <p className="text-sm text-ink-2 mb-6">
                        Próxima cobrança em{' '}
                        <strong className="text-ink-1">
                          {formatarData(dados.renovaEm)}
                        </strong>
                        .
                      </p>
                    )}

                {dados.temPortal ? (
                  <>
                    {/* Reativar vem primeiro e em destaque quando há um
                        cancelamento marcado: é a ação que a pessoa procura,
                        e o portal da Stripe não tem link direto para ela. */}
                    {dados.podeReativar && (
                      <>
                        <Button
                          onClick={reativar}
                          disabled={reativando || abrindoPortal}
                          fullWidth
                        >
                          <span className="flex items-center justify-center gap-2">
                            {reativando ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Reativando...
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-4 h-4" />
                                Reativar assinatura
                              </>
                            )}
                          </span>
                        </Button>
                        <p className="text-xs text-ink-3 text-center mt-3 mb-5">
                          Volta a renovar todo mês. Nada é cobrado agora.
                        </p>
                      </>
                    )}

                    <Button
                      onClick={() => abrirPortal()}
                      disabled={abrindoPortal || reativando}
                      variant={dados.podeReativar ? 'ghost' : 'secondary'}
                      fullWidth
                    >
                      {abrindoPortal ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Abrindo...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Gerenciar assinatura
                          <ExternalLink className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                    {!dados.podeReativar && (
                      <p className="text-xs text-ink-3 text-center mt-3">
                        Trocar o cartão ou baixar faturas
                      </p>
                    )}

                    {/* Cancelar só aparece quando há o que cancelar. Pedir o
                        fluxo de cancelamento para uma assinatura já agendada
                        faz a Stripe responder "already set to be canceled at
                        period end", e o botão devolvia erro 500. */}
                    {!dados.cancelaNoFimDoPeriodo && (
                      <p className="text-center mt-4">
                        <button
                          onClick={() => abrirPortal('cancelar')}
                          disabled={abrindoPortal}
                          className="text-sm text-ink-3 hover:text-ink-1 underline underline-offset-2 transition-colors disabled:opacity-50"
                        >
                          Cancelar assinatura
                        </button>
                      </p>
                    )}
                  </>
                ) : (
                  <div className="rounded-md border bg-surface-2 p-4">
                    <p className="text-sm text-ink-2">
                      Sua assinatura é de uma cobrança antiga e ainda não passou
                      para o novo sistema. Para trocar o cartão ou cancelar, fale
                      com o suporte — a gente resolve no mesmo dia.
                    </p>
                  </div>
                )}
              </Card>
            ) : (
              <Card>
                <p className="text-lg font-semibold text-ink-1 mb-1.5">
                  Você ainda não é assinante
                </p>
                <p className="text-sm text-ink-2 mb-6">
                  A partir de {dados.precoFormatado} por mês, com tudo
                  liberado. Sem fidelidade — cancele em 2 cliques.
                </p>
                <AssinarButton fullWidth />
                <p className="text-center mt-4">
                  <Link href="/pricing" className="text-sm text-ink-2 hover:text-ink-1">
                    Ver o que está incluído
                  </Link>
                </p>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
