'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, Users } from 'lucide-react';
import type { Pulso } from '@/lib/atividade/pulso';

const INTERVALO_MS = 30_000;

function numero(n: number) {
  return n.toLocaleString('pt-BR');
}

/**
 * Quanta gente está estudando, atualizado sozinho.
 *
 * Duas caras, escolhidas pelo servidor (ver lib/atividade/pulso.ts):
 *
 *   presenca  "7 pessoas resolvendo questões agora"
 *   periodo   "155 questões respondidas nas últimas 24h · 10 pessoas"
 *
 * A segunda existe porque a primeira marcaria zero em 93% do tempo hoje. O
 * corte é no servidor, não aqui, para o HTML já sair pronto e indexável.
 *
 * O texto NUNCA é "0 pessoas": quando não há ninguém agora, o bloco fala do
 * dia, que sempre tem número. Se nem o dia tiver, ele some — página de
 * ranking anunciando vazio é pior que página sem o bloco.
 */
export function PulsoAtividade({ inicial }: { inicial: Pulso | null }) {
  const [pulso, setPulso] = useState<Pulso | null>(inicial);

  const buscar = useCallback(async () => {
    try {
      const r = await fetch('/api/atividade');
      if (!r.ok) return; // mantém o que já está na tela
      setPulso(await r.json());
    } catch {
      // Sem rede: o número velho é melhor que um buraco no layout.
    }
  }, []);

  useEffect(() => {
    // Aba escondida não pergunta nada. Sem isso, cada aba esquecida aberta
    // vira consulta ao banco a cada 30s pelo resto do dia.
    let timer: ReturnType<typeof setInterval> | null = null;

    const iniciar = () => {
      if (timer) return;
      timer = setInterval(buscar, INTERVALO_MS);
    };
    const parar = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };

    const aoTrocarVisibilidade = () => {
      if (document.visibilityState === 'visible') {
        buscar(); // volta para a aba e vê o número atual, não o de antes
        iniciar();
      } else {
        parar();
      }
    };

    if (document.visibilityState === 'visible') iniciar();
    document.addEventListener('visibilitychange', aoTrocarVisibilidade);

    return () => {
      parar();
      document.removeEventListener('visibilitychange', aoTrocarVisibilidade);
    };
  }, [buscar]);

  // Nada para contar: some. Ranking anunciando vazio é pior que sem o bloco.
  if (!pulso || (pulso.modo === 'periodo' && pulso.respostas24h === 0)) return null;

  const presenca = pulso.modo === 'presenca';

  return (
    <div
      // aria-live polite: quem usa leitor de tela ouve a mudança quando ela
      // acontece, sem ser interrompido no meio de outra leitura.
      aria-live="polite"
      className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg border bg-surface-2"
    >
      {presenca ? (
        <span aria-hidden className="relative flex w-2 h-2 shrink-0">
          <span className="absolute inline-flex w-full h-full rounded-full bg-success opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex w-2 h-2 rounded-full bg-success" />
        </span>
      ) : (
        <Activity className="w-4 h-4 text-accent shrink-0" aria-hidden />
      )}

      <p className="text-sm text-ink-2 text-center">
        {presenca ? (
          <>
            <strong className="font-semibold text-ink-1 text-mono-tabular">
              {numero(pulso.agora)}
            </strong>{' '}
            {pulso.agora === 1 ? 'pessoa resolvendo' : 'pessoas resolvendo'} questões
            agora
          </>
        ) : (
          <>
            <strong className="font-semibold text-ink-1 text-mono-tabular">
              {numero(pulso.respostas24h)}
            </strong>{' '}
            {pulso.respostas24h === 1 ? 'questão respondida' : 'questões respondidas'} nas
            últimas 24h
            {pulso.pessoas24h > 0 && (
              <span className="text-ink-3">
                {' · '}
                <Users className="inline w-3.5 h-3.5 -mt-0.5" aria-hidden />{' '}
                {numero(pulso.pessoas24h)}{' '}
                {pulso.pessoas24h === 1 ? 'pessoa' : 'pessoas'}
              </span>
            )}
          </>
        )}
      </p>
    </div>
  );
}
