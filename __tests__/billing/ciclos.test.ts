/**
 * Os quatro ciclos de pagamento.
 *
 * Os valores em `plan.ts` são literais — ninguém quer arredondamento de
 * centavo decidindo preço em tempo de execução. Estes testes existem para
 * garantir que os literais batem com a regra que a gente combinou: 5% no
 * trimestre, 10% no semestre, 15% no ano, sobre R$ 9,99/mês.
 */

import { describe, it, expect } from 'vitest';
import {
  CICLOS,
  PLANO,
  ciclo,
  economiaCentavos,
  ehCicloChave,
  formatarBRL,
  porMesCentavos,
} from '@/lib/stripe/plan';
import { cicloDePreco } from '@/lib/stripe/precos';

describe('valores dos ciclos', () => {
  it('cada total é o preço-base vezes os meses, menos o desconto', () => {
    for (const c of CICLOS) {
      const cheio = PLANO.baseCentavos * c.meses;
      const esperado = Math.round(cheio * (1 - c.descontoPercent / 100));
      expect(c.totalCentavos, `${c.rotulo} fora da conta`).toBe(esperado);
    }
  });

  it('bate com os números que foram prometidos ao usuário', () => {
    const porChave = Object.fromEntries(CICLOS.map((c) => [c.chave, c]));
    expect(formatarBRL(porChave.mensal.totalCentavos)).toBe('R$ 9,99');
    expect(formatarBRL(porChave.trimestral.totalCentavos)).toBe('R$ 28,47');
    expect(formatarBRL(porChave.semestral.totalCentavos)).toBe('R$ 53,95');
    expect(formatarBRL(porChave.anual.totalCentavos)).toBe('R$ 101,90');
  });

  it('quanto mais longo o ciclo, menor o preço por mês', () => {
    const porMes = CICLOS.map(porMesCentavos);
    for (let i = 1; i < porMes.length; i++) {
      expect(porMes[i], `${CICLOS[i].rotulo} não é mais barato por mês`).toBeLessThan(
        porMes[i - 1]
      );
    }
  });

  it('o anual economiza R$ 17,98 no ano', () => {
    const anual = ciclo('anual');
    expect(formatarBRL(economiaCentavos(anual))).toBe('R$ 17,98');
    expect(formatarBRL(porMesCentavos(anual))).toBe('R$ 8,49');
  });

  it('o mensal não tem desconto nem economia', () => {
    expect(economiaCentavos(ciclo('mensal'))).toBe(0);
  });

  it('cada ciclo tem lookup_key e cicloBanco próprios', () => {
    expect(new Set(CICLOS.map((c) => c.lookupKey)).size).toBe(CICLOS.length);
    expect(new Set(CICLOS.map((c) => c.cicloBanco)).size).toBe(CICLOS.length);
  });

  it('valores distintos — a tela de confirmação identifica o ciclo pelo valor pago', () => {
    expect(new Set(CICLOS.map((c) => c.totalCentavos)).size).toBe(CICLOS.length);
  });
});

describe('ciclo() nunca lança', () => {
  it('entrada estranha do cliente vira mensal em vez de erro 500', () => {
    for (const lixo of [undefined, null, '', 'vitalicio', 42, {}, []]) {
      expect(ciclo(lixo).chave).toBe('mensal');
    }
  });

  it('ehCicloChave separa o que é válido', () => {
    expect(ehCicloChave('anual')).toBe(true);
    expect(ehCicloChave('ANUAL')).toBe(false);
    expect(ehCicloChave('vitalicio')).toBe(false);
  });
});

describe('cicloDePreco', () => {
  it('reconhece pela lookup_key', () => {
    const preco = { lookup_key: 'simulai_anual', recurring: null } as never;
    expect(cicloDePreco(preco)?.chave).toBe('anual');
  });

  it('sem lookup_key, cai no formato da recorrência', () => {
    const preco = {
      lookup_key: null,
      recurring: { interval: 'month', interval_count: 6 },
    } as never;
    expect(cicloDePreco(preco)?.chave).toBe('semestral');
  });

  it('preço avulso não vira ciclo', () => {
    expect(cicloDePreco({ lookup_key: null, recurring: null } as never)).toBeNull();
    expect(cicloDePreco(null)).toBeNull();
  });
});
