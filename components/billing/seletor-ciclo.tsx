'use client';

import { Check } from 'lucide-react';
import {
  CICLOS,
  PLANO,
  economiaCentavos,
  formatarBRL,
  porMesCentavos,
  type CicloChave,
} from '@/lib/stripe/plan';

interface Props {
  valor: CicloChave;
  aoMudar: (chave: CicloChave) => void;
  /** Some com a linha de economia quando o espaço é apertado. */
  compacto?: boolean;
}

/**
 * Escolha do ciclo de pagamento.
 *
 * O número em destaque é o preço POR MÊS, não o total — é o que deixa o
 * desconto visível. Alguém comparando "R$ 9,99" com "R$ 101,90" não enxerga
 * que o segundo é mais barato; comparando "R$ 9,99/mês" com "R$ 8,49/mês",
 * enxerga. O total vem logo abaixo, porque é o valor que sai do cartão e
 * esconder isso seria pegadinha.
 *
 * Lista vertical em vez de abas: são quatro opções com três informações
 * cada, e em tela de celular isso não cabe lado a lado sem truncar.
 */
export function SeletorCiclo({ valor, aoMudar, compacto }: Props) {
  return (
    <div role="radiogroup" aria-label="Ciclo de pagamento" className="space-y-2">
      {CICLOS.map((c) => {
        const escolhido = c.chave === valor;
        const economia = economiaCentavos(c);

        return (
          <button
            key={c.chave}
            type="button"
            role="radio"
            aria-checked={escolhido}
            onClick={() => aoMudar(c.chave)}
            className={[
              'w-full text-left rounded-lg border p-3.5 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
              escolhido
                ? 'border-accent bg-accent-soft'
                : 'border-[color:var(--border)] hover:bg-surface-2',
            ].join(' ')}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  aria-hidden
                  className={[
                    'w-4 h-4 rounded-full border shrink-0 flex items-center justify-center',
                    escolhido ? 'border-accent bg-accent' : 'border-[color:var(--border)]',
                  ].join(' ')}
                >
                  {escolhido && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />}
                </span>

                <span className="font-medium text-ink-1 truncate">{c.rotulo}</span>

                {c.descontoPercent > 0 && (
                  <span className="shrink-0 text-[11px] font-semibold px-1.5 py-0.5 rounded bg-success-soft text-success border border-success/30">
                    −{c.descontoPercent}%
                  </span>
                )}
              </div>

              <span className="shrink-0 text-right">
                <span className="font-semibold text-ink-1 text-mono-tabular">
                  {formatarBRL(porMesCentavos(c))}
                </span>
                <span className="text-xs text-ink-3">/mês</span>
              </span>
            </div>

            {!compacto && (
              <p className="text-xs text-ink-3 mt-1.5" style={{ paddingLeft: '1.625rem' }}>
                {formatarBRL(c.totalCentavos)} {c.rotuloCobranca}
                {economia > 0 && ` · economize ${formatarBRL(economia)}`}
              </p>
            )}
          </button>
        );
      })}

      <p className="text-xs text-ink-3 pt-1">
        Mesmo acesso em todos: {PLANO.beneficios.length} recursos, sem versão
        limitada. Cancele quando quiser.
      </p>
    </div>
  );
}
