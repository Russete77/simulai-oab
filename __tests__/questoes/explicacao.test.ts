/**
 * O leitor da explicação nunca pode lançar.
 *
 * São 5.857 explicações geradas por IA ao longo do tempo, por modelos
 * diferentes, guardadas como string. As páginas de questão são públicas e
 * estáticas — um erro de parse derrubaria justamente a página que o Google
 * estivesse rastreando.
 */

import { describe, it, expect } from 'vitest';
import {
  lerExplicacao,
  temConteudo,
  explicacaoEmTexto,
} from '@/lib/questoes/explicacao';

const COMPLETA = JSON.stringify({
  resumo: 'Recursos com efeito suspensivo em casos específicos.',
  correta: {
    motivo: 'A alternativa A está correta porque decisões não unânimes permitem recurso.',
    baseLegal: 'Art. 34, inciso XX, da Lei nº 8.906/94',
  },
  incorretas: [
    { alternativa: 'B', motivo: 'Decisões sobre eleições não têm efeito suspensivo.' },
    { alternativa: 'C', motivo: 'Suspensões preventivas não admitem.' },
  ],
  dica: 'Lembre-se do artigo 34.',
  pegadinhas: 'Confundir seccional com federal.',
});

describe('formato normal', () => {
  it('lê todos os campos', () => {
    const e = lerExplicacao(COMPLETA)!;
    expect(e.textoPuro).toBe(false);
    expect(e.resumo).toContain('efeito suspensivo');
    expect(e.motivoCorreta).toContain('alternativa A');
    expect(e.baseLegal).toBe('Art. 34, inciso XX, da Lei nº 8.906/94');
    expect(e.incorretas).toHaveLength(2);
    expect(e.incorretas[0]).toEqual({
      alternativa: 'B',
      motivo: 'Decisões sobre eleições não têm efeito suspensivo.',
    });
    expect(e.dica).toBe('Lembre-se do artigo 34.');
  });

  it('pegadinhas vira lista, venha como texto ou como lista', () => {
    expect(lerExplicacao(COMPLETA)!.pegadinhas).toEqual([
      'Confundir seccional com federal.',
    ]);
    const comLista = JSON.stringify({
      resumo: 'x',
      pegadinhas: ['uma', 'outra'],
    });
    expect(lerExplicacao(comLista)!.pegadinhas).toEqual(['uma', 'outra']);
  });
});

describe('entrada estranha não derruba a página', () => {
  it('vazio ou ausente devolve null', () => {
    for (const v of [null, undefined, '', '   ']) {
      expect(lerExplicacao(v)).toBeNull();
    }
  });

  it('texto puro vira o resumo', () => {
    const e = lerExplicacao('A resposta é B porque a lei diz isso.')!;
    expect(e.textoPuro).toBe(true);
    expect(e.resumo).toBe('A resposta é B porque a lei diz isso.');
    expect(e.incorretas).toEqual([]);
  });

  it('JSON quebrado no meio vira texto puro em vez de erro', () => {
    const e = lerExplicacao('{"resumo": "cortou aqui')!;
    expect(e.textoPuro).toBe(true);
  });

  it('JSON válido mas inútil cai para o texto cru', () => {
    const e = lerExplicacao('{"foo":"bar"}')!;
    expect(e.textoPuro).toBe(true);
    expect(e.resumo).toBe('{"foo":"bar"}');
  });

  it('campos com tipo errado são descartados, não quebram', () => {
    const e = lerExplicacao(
      JSON.stringify({
        resumo: 'vale',
        correta: 'deveria ser objeto',
        incorretas: 'deveria ser lista',
        dica: 42,
      })
    )!;
    expect(e.resumo).toBe('vale');
    expect(e.motivoCorreta).toBeUndefined();
    expect(e.incorretas).toEqual([]);
    expect(e.dica).toBeUndefined();
  });

  it('itens incompletos dentro de incorretas somem sem levar os bons', () => {
    const e = lerExplicacao(
      JSON.stringify({
        resumo: 'x',
        incorretas: [
          { alternativa: 'B', motivo: 'bom' },
          { alternativa: 'C' },
          null,
          'texto solto',
          { motivo: 'sem alternativa' },
        ],
      })
    )!;
    expect(e.incorretas).toEqual([{ alternativa: 'B', motivo: 'bom' }]);
  });

  it('uma lista no lugar de objeto não vira explicação estruturada', () => {
    expect(lerExplicacao('[1,2,3]')!.textoPuro).toBe(true);
  });
});

describe('temConteudo', () => {
  it('null não tem conteúdo', () => {
    expect(temConteudo(null)).toBe(false);
  });

  it('só um campo já basta', () => {
    expect(temConteudo(lerExplicacao(JSON.stringify({ dica: 'só a dica' })))).toBe(true);
  });
});

describe('explicacaoEmTexto', () => {
  it('junta os campos numa linha só, para o dado estruturado', () => {
    const t = explicacaoEmTexto(lerExplicacao(COMPLETA));
    expect(t).toContain('alternativa A');
    expect(t).toContain('efeito suspensivo'); // o resumo entra
    expect(t).not.toContain('\n');
  });

  it('NÃO leva a base legal para o dado estruturado', () => {
    // As citações são geradas por IA e não são confiáveis. Já estão
    // escondidas na tela; se vazassem por aqui, o Google as leria como
    // afirmação nossa sobre a lei.
    const t = explicacaoEmTexto(lerExplicacao(COMPLETA));
    expect(t).not.toContain('8.906');
    expect(t).not.toContain('Art.');
  });

  it('null vira string vazia', () => {
    expect(explicacaoEmTexto(null)).toBe('');
  });
});
