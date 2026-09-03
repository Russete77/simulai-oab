/**
 * A regra de "esta assinatura vai acabar".
 *
 * Estes testes existem por causa de um bug real: o portal da Stripe agenda o
 * cancelamento gravando a DATA (`cancel_at`) e deixando o BOOLEANO
 * (`cancel_at_period_end`) em `false`. O app lia só o booleano, então quem
 * cancelava voltava para a tela de assinatura e lia "próxima cobrança em 27
 * de setembro" — e o botão "Cancelar assinatura" continuava à mostra, agora
 * devolvendo erro, porque a Stripe recusa cancelar o que já está agendado.
 */

import { describe, it, expect } from 'vitest';
import {
  temFimMarcado,
  fimDoAcesso,
  podeReativar,
  type EstadoAssinatura,
} from '@/lib/stripe/assinatura';

const FIM_DO_PERIODO = new Date('2026-09-27T17:23:11.000Z');

function assinatura(over: Partial<EstadoAssinatura> = {}): EstadoAssinatura {
  return {
    status: 'ACTIVE',
    cancelAtPeriodEnd: false,
    cancelAt: null,
    currentPeriodEnd: FIM_DO_PERIODO,
    ...over,
  };
}

describe('temFimMarcado', () => {
  it('assinatura renovando normalmente não tem fim marcado', () => {
    expect(temFimMarcado(assinatura())).toBe(false);
  });

  it('pega o cancelamento feito pelo PORTAL, que só grava a data', () => {
    // Estado real devolvido pela Stripe depois de cancelar pelo portal:
    // cancel_at preenchido, cancel_at_period_end em false.
    expect(
      temFimMarcado(
        assinatura({ cancelAt: FIM_DO_PERIODO, cancelAtPeriodEnd: false })
      )
    ).toBe(true);
  });

  it('pega o cancelamento feito pela API, que liga o booleano', () => {
    expect(temFimMarcado(assinatura({ cancelAtPeriodEnd: true }))).toBe(true);
  });
});

describe('fimDoAcesso', () => {
  it('sem cancelamento, vale o fim do período', () => {
    expect(fimDoAcesso(assinatura())).toEqual(FIM_DO_PERIODO);
  });

  it('cancelAt tem prioridade: dá para marcar uma data no meio do ciclo', () => {
    const antes = new Date('2026-09-10T00:00:00.000Z');
    expect(fimDoAcesso(assinatura({ cancelAt: antes }))).toEqual(antes);
  });
});

describe('podeReativar', () => {
  it('dá para desfazer enquanto a assinatura está de pé', () => {
    expect(podeReativar(assinatura({ cancelAt: FIM_DO_PERIODO }))).toBe(true);
    expect(
      podeReativar(assinatura({ status: 'TRIALING', cancelAtPeriodEnd: true }))
    ).toBe(true);
  });

  it('não oferece reativar quando não há cancelamento marcado', () => {
    expect(podeReativar(assinatura())).toBe(false);
  });

  it('assinatura já encerrada não reativa — só assinando de novo', () => {
    // A doc é explícita: "Não é possível reativar uma assinatura cancelada".
    expect(
      podeReativar(
        assinatura({ status: 'CANCELED', cancelAt: FIM_DO_PERIODO })
      )
    ).toBe(false);
  });
});
