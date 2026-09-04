/**
 * Lê a explicação da questão guardada em QuestionExplanation.
 *
 * O campo é uma STRING que normalmente contém JSON gerado por IA:
 *
 *   { resumo, correta: { motivo, baseLegal }, incorretas: [...], dica, pegadinhas }
 *
 * "Normalmente" é a palavra importante. São 5.857 registros gerados ao longo
 * do tempo por modelos diferentes: parte pode ser texto puro, parte pode ter
 * campo faltando, e `pegadinhas` aparece ora como texto, ora como lista.
 *
 * Nada aqui lança. Uma explicação malformada vira uma página com menos
 * conteúdo — nunca uma página quebrada. São 5.875 páginas públicas e
 * estáticas: um erro de parse derrubaria a que o Google estivesse rastreando.
 */

export interface MotivoAlternativa {
  alternativa: string;
  motivo: string;
}

export interface Explicacao {
  resumo?: string;
  motivoCorreta?: string;
  baseLegal?: string;
  incorretas: MotivoAlternativa[];
  dica?: string;
  pegadinhas: string[];
  /** Nada foi entendido além de texto solto — renderiza só o resumo. */
  textoPuro: boolean;
}

function texto(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const limpo = v.trim();
  return limpo.length > 0 ? limpo : undefined;
}

/** `pegadinhas` vem ora como string, ora como lista. Normaliza para lista. */
function lista(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(texto).filter((s): s is string => Boolean(s));
  const s = texto(v);
  return s ? [s] : [];
}

function incorretas(v: unknown): MotivoAlternativa[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const o = item as Record<string, unknown>;
      const alternativa = texto(o.alternativa);
      const motivo = texto(o.motivo);
      return alternativa && motivo ? { alternativa, motivo } : null;
    })
    .filter((x): x is MotivoAlternativa => x !== null);
}

export function lerExplicacao(bruto: string | null | undefined): Explicacao | null {
  const cru = texto(bruto);
  if (!cru) return null;

  let objeto: unknown;
  try {
    objeto = JSON.parse(cru);
  } catch {
    // Não era JSON: trata como o texto da explicação mesmo.
    return { resumo: cru, incorretas: [], pegadinhas: [], textoPuro: true };
  }

  if (!objeto || typeof objeto !== 'object' || Array.isArray(objeto)) {
    return { resumo: cru, incorretas: [], pegadinhas: [], textoPuro: true };
  }

  const o = objeto as Record<string, unknown>;
  const correta =
    o.correta && typeof o.correta === 'object' && !Array.isArray(o.correta)
      ? (o.correta as Record<string, unknown>)
      : {};

  const lida: Explicacao = {
    resumo: texto(o.resumo),
    motivoCorreta: texto(correta.motivo),
    baseLegal: texto(correta.baseLegal),
    incorretas: incorretas(o.incorretas),
    dica: texto(o.dica),
    pegadinhas: lista(o.pegadinhas),
    textoPuro: false,
  };

  // JSON válido mas sem nada aproveitável: melhor mostrar o texto cru do que
  // uma seção vazia.
  if (!temConteudo(lida)) {
    return { resumo: cru, incorretas: [], pegadinhas: [], textoPuro: true };
  }

  return lida;
}

export function temConteudo(e: Explicacao | null): e is Explicacao {
  if (!e) return false;
  return Boolean(
    e.resumo ||
      e.motivoCorreta ||
      e.baseLegal ||
      e.dica ||
      e.incorretas.length > 0 ||
      e.pegadinhas.length > 0
  );
}

/**
 * Versão em texto corrido, para a `answerExplanation` do dado estruturado e
 * para a meta description. Sem marcação, sem quebra de linha.
 */
export function explicacaoEmTexto(e: Explicacao | null): string {
  if (!e) return '';
  return [e.motivoCorreta, e.baseLegal, e.resumo]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
