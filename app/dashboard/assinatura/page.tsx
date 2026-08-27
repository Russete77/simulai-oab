'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Card, Button, Badge } from '@/components/ui';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { AssinarButton } from '@/components/billing/assinar-button';

interface Status {
  assinante: boolean;
  status: string;
  gateway?: string;
  valor?: number;
  renovaEm?: string | null;
  cancelaNoFimDoPeriodo?: boolean;
  temPortal?: boolean;
  precoFormatado: string;
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

export default function AssinaturaPage() {
  const { isLoaded } = useUser();
  const [dados, setDados] = useState<Status | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [abrindoPortal, setAbrindoPortal] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);
      const res = await fetch('/api/billing/status');
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

  const abrirPortal = async () => {
    setErro(null);
    setAbrindoPortal(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
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
                      <CheckCircle2 className="w-5 h-5 text-success" />
                      <span className="text-lg font-semibold text-ink-1">
                        Assinatura ativa
                      </span>
                    </div>
                    <p className="text-sm text-ink-2">
                      {dados.precoFormatado} por mês
                    </p>
                  </div>
                  <Badge variant="accent">{ROTULO[dados.status] ?? dados.status}</Badge>
                </div>

                {dados.renovaEm && (
                  <p className="text-sm text-ink-2 mb-6">
                    {dados.cancelaNoFimDoPeriodo ? (
                      <>
                        Cancelamento agendado. Você mantém o acesso até{' '}
                        <strong className="text-ink-1">
                          {formatarData(dados.renovaEm)}
                        </strong>
                        .
                      </>
                    ) : (
                      <>
                        Próxima cobrança em{' '}
                        <strong className="text-ink-1">
                          {formatarData(dados.renovaEm)}
                        </strong>
                        .
                      </>
                    )}
                  </p>
                )}

                {dados.temPortal ? (
                  <>
                    <Button
                      onClick={abrirPortal}
                      disabled={abrindoPortal}
                      variant="secondary"
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
                    <p className="text-xs text-ink-3 text-center mt-3">
                      Trocar o cartão, baixar faturas ou cancelar
                    </p>
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
                  {dados.precoFormatado} por mês, com tudo liberado. Sem
                  fidelidade — cancele em 2 cliques.
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
