'use client';

import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import { META_DIARIA } from '@/lib/dashboard/continuar';

interface SessionProgressProps {
  /** Uma entrada por questão respondida nesta sessão: true = acertou. */
  respostas: boolean[];
}

/**
 * Barra de progresso da sessão.
 *
 * Praticar era um fluxo infinito — responde, próxima, responde, próxima —
 * sem nenhum ponto em que a pessoa pudesse dizer "terminei". A mediana de
 * uso é 16 questões por MÊS, com p90 de 20: quase todo mundo faz uma sessão
 * e some. Um alvo visível de {META_DIARIA} dá um fim à sessão, e um fim é o
 * que faz alguém voltar amanhã.
 */
export function SessionProgress({ respostas }: SessionProgressProps) {
  const feitas = respostas.length;
  const acertos = respostas.filter(Boolean).length;
  const completou = feitas >= META_DIARIA;
  const atual = Math.min(feitas + 1, META_DIARIA);

  return (
    <div className="mb-6 pb-5 border-b">
      <div className="flex items-baseline justify-between gap-4 mb-2.5">
        <div className="flex items-baseline gap-2">
          {completou ? (
            <span className="inline-flex items-center gap-1.5 text-base font-semibold text-success">
              <Check className="w-4 h-4" />
              Meta de hoje cumprida
            </span>
          ) : (
            <>
              <span className="text-base font-semibold text-ink-1">
                Questão <span className="text-mono-tabular">{atual}</span>
              </span>
              <span className="text-sm text-ink-3 text-mono-tabular">
                de {META_DIARIA} · meta de hoje
              </span>
            </>
          )}
        </div>
        {feitas > 0 && (
          <span className="text-sm font-medium text-ink-2 text-mono-tabular">
            {acertos} {acertos === 1 ? 'acerto' : 'acertos'}
          </span>
        )}
      </div>

      <div
        className="flex gap-[3px]"
        role="progressbar"
        aria-valuenow={feitas}
        aria-valuemin={0}
        aria-valuemax={META_DIARIA}
        aria-label={`${feitas} de ${META_DIARIA} questões da meta de hoje`}
      >
        {Array.from({ length: META_DIARIA }, (_, i) => {
          const respondida = i < feitas;
          const acertou = respondida && respostas[i];
          const emCurso = i === feitas && !completou;

          return (
            <div
              key={i}
              className={clsx(
                'flex-1 h-[5px] rounded-full transition-colors',
                respondida
                  ? acertou
                    ? 'bg-success'
                    : 'bg-danger'
                  : emCurso
                    ? 'bg-accent'
                    : 'bg-surface-2'
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
