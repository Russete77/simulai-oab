/**
 * A regra que decide entre presença e acumulado.
 *
 * Existe porque um contador puro de presença marcaria zero em 93% do tempo
 * com o uso real de hoje, e "1 pessoa online" seria a própria pessoa que
 * está olhando. O corte protege a página de anunciar vazio, e sobe sozinho
 * para presença quando a base crescer.
 */

import { describe, it, expect } from 'vitest';
import { modoDoPulso, MINIMO_PARA_PRESENCA } from '@/lib/atividade/pulso';

describe('modoDoPulso', () => {
  it('ninguém agora: fala do dia, nunca "0 online"', () => {
    expect(modoDoPulso(0)).toBe('periodo');
  });

  it('uma pessoa: é quem está olhando — não vira "1 online"', () => {
    expect(modoDoPulso(1)).toBe('periodo');
  });

  it('duas: com você sendo uma delas, ainda parece deserto', () => {
    expect(modoDoPulso(2)).toBe('periodo');
  });

  it('a partir de três, mostra presença', () => {
    expect(modoDoPulso(3)).toBe('presenca');
    expect(modoDoPulso(12)).toBe('presenca');
    expect(modoDoPulso(400)).toBe('presenca');
  });

  it('o corte é 3 — abaixo dele nada vira presença', () => {
    for (let n = 0; n < MINIMO_PARA_PRESENCA; n++) {
      expect(modoDoPulso(n), `${n} não podia virar presença`).toBe('periodo');
    }
  });
});
