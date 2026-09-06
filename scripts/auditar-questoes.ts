/**
 * Auditoria do banco de questões.
 *
 * Só leitura — não escreve nada. Roda quantas vezes quiser.
 *
 *   npx tsx scripts/auditar-questoes.ts
 *
 * Cobre a "camada 1" de _PLANO-CLAUDE/AUDITORIA-BANCO-QUESTOES.md: tudo que
 * dá para verificar sem consultar fonte externa. Correção jurídica e
 * conferência contra o PDF da FGV são outra camada.
 */

import 'dotenv/config';
import { prisma } from '../lib/db/prisma';
import { lerExplicacao } from '../lib/questoes/explicacao';

const problemas: { area: string; gravidade: 'alta' | 'media' | 'baixa'; quantos: number; nota: string }[] = [];

function registrar(area: string, gravidade: 'alta' | 'media' | 'baixa', quantos: number, nota: string) {
  problemas.push({ area, gravidade, quantos, nota });
}

function titulo(t: string) {
  console.log(`\n${'─'.repeat(64)}\n${t}\n${'─'.repeat(64)}`);
}

/**
 * Maior número de artigo que existe em cada código. Serve para pegar citação
 * impossível — "Art. 3.000 do CC" não existe, o Código Civil vai até 2.046.
 * Não valida se o artigo é o CERTO, só se ele existe.
 */
const LIMITE_DE_ARTIGO: { nome: string; padrao: RegExp; max: number }[] = [
  { nome: 'CF/88', padrao: /\b(cf\/88|cf88|constitui[çc][ãa]o federal|\bcf\b)/i, max: 250 },
  { nome: 'Código Civil', padrao: /\b(c[óo]digo civil|\bcc\b|cc\/2002)/i, max: 2046 },
  { nome: 'CPC', padrao: /\b(cpc|c[óo]digo de processo civil)/i, max: 1072 },
  { nome: 'Código Penal', padrao: /\b(c[óo]digo penal|\bcp\b)/i, max: 361 },
  { nome: 'CPP', padrao: /\b(cpp|c[óo]digo de processo penal)/i, max: 811 },
  { nome: 'CLT', padrao: /\bclt\b/i, max: 922 },
  { nome: 'CTN', padrao: /\bctn\b/i, max: 218 },
  { nome: 'Estatuto da OAB', padrao: /\b(8\.?906|estatuto da oab)/i, max: 87 },
  { nome: 'CDC', padrao: /\b(cdc|8\.?078)/i, max: 119 },
  { nome: 'ECA', padrao: /\b(eca|8\.?069)/i, max: 267 },
];

function artigoImpossivel(citacao: string): string | null {
  const numero = citacao.match(/art\.?\s*(\d{1,3}(?:[.,]\d{3})*)/i)?.[1];
  if (!numero) return null;
  const n = parseInt(numero.replace(/[.,]/g, ''), 10);
  if (!Number.isFinite(n)) return null;

  for (const codigo of LIMITE_DE_ARTIGO) {
    if (codigo.padrao.test(citacao) && n > codigo.max) {
      return `${citacao} — ${codigo.nome} vai até ${codigo.max}`;
    }
  }
  return null;
}

/**
 * A questão pede a alternativa ERRADA?
 *
 * Sem isto o cruzamento explicação × gabarito acusa falso positivo: numa
 * questão "assinale a INCORRETA", a explicação dizer "a alternativa A está
 * incorreta" é acerto, não divergência.
 */
function pedeAIncorreta(enunciado: string): boolean {
  const t = enunciado.toLowerCase();
  // A FGV escreve isso de muitas formas. Uma versão anterior desta função só
  // conhecia "alternativa" e acusou 6 divergências que eram todas falso
  // positivo: os enunciados diziam "afirmativa INCORRETA", "opção INCORRETA"
  // e "à exceção de uma".
  const substantivo = '(alternativa|afirmativa|op[çc][ãa]o|assertiva|item|senten[çc]a|proposi[çc][ãa]o)';
  return (
    new RegExp(`assinale\\s+(a|o)\\s+(${substantivo}\\s+)?(incorreta?|falsa?|errada?|inver[íi]dica)`).test(t)
    || new RegExp(`${substantivo}\\s+(incorreta?|falsa?|errada?)`).test(t)
    || /n[ãa]o\s+(é|e|se|pode|deve|se\s+pode)\s+/.test(t)
    || /\b[ée]\s+vedad[oa]\b/.test(t)
    || /\bexce[çc][ãa]o\b/.test(t)
    || /\bexcet[oa]\b/.test(t)
    || /\bincorret[oa]\b/.test(t)
  );
}

async function main() {
  const inicio = Date.now();
  console.log('\nAUDITORIA DO BANCO DE QUESTÕES');

  // Anuladas ficam de fora de tudo. Questão anulada pela FGV não tem
  // alternativa nem gabarito — é assim que deve ser, e contá-las como
  // "quebradas" produziu um alarme falso de 18 questões.
  const todas = await prisma.question.findMany({
    include: { alternatives: { orderBy: { label: 'asc' } }, aiExplanation: true },
  });
  const anuladas = todas.filter((q) => q.nullified);
  const questoes = todas.filter((q) => !q.nullified);
  const total = questoes.length;
  console.log(`${total} questões válidas  (+${anuladas.length} anuladas pela FGV, fora da auditoria)\n`);

  // ---------------------------------------------------------------- estrutura
  titulo('1 · ESTRUTURA');

  const semCorreta = questoes.filter((q) => q.alternatives.filter((a) => a.isCorrect).length === 0);
  const multiCorreta = questoes.filter((q) => q.alternatives.filter((a) => a.isCorrect).length > 1);
  const semQuatro = questoes.filter((q) => q.alternatives.length !== 4);
  const rotuloEstranho = questoes.filter((q) =>
    q.alternatives.some((a) => !['A', 'B', 'C', 'D'].includes(a.label.trim().toUpperCase()))
  );
  const enunciadoCurto = questoes.filter((q) => q.statement.trim().length < 40);
  const altVazia = questoes.filter((q) => q.alternatives.some((a) => a.text.trim().length < 2));
  const altRepetida = questoes.filter((q) => {
    const textos = q.alternatives.map((a) => a.text.trim().toLowerCase());
    return new Set(textos).size !== textos.length;
  });

  const linha = (rot: string, n: number) =>
    console.log(`  ${n === 0 ? 'ok  ' : 'ACHE'} ${String(n).padStart(5)}  ${rot}`);

  linha('sem alternativa correta', semCorreta.length);
  linha('com mais de uma correta', multiCorreta.length);
  linha('sem exatamente 4 alternativas', semQuatro.length);
  linha('com rótulo fora de A–D', rotuloEstranho.length);
  linha('enunciado com menos de 40 caracteres', enunciadoCurto.length);
  linha('alternativa praticamente vazia', altVazia.length);
  linha('alternativas repetidas dentro da questão', altRepetida.length);

  if (semCorreta.length) registrar('sem gabarito', 'alta', semCorreta.length, 'questão sem resposta certa');
  if (multiCorreta.length) registrar('gabarito duplo', 'alta', multiCorreta.length, 'mais de uma correta');
  if (semQuatro.length) registrar('alternativas faltando', 'alta', semQuatro.length, 'não são 4');
  if (altRepetida.length) registrar('alternativa repetida', 'media', altRepetida.length, 'duas iguais na mesma questão');

  for (const q of [...semCorreta, ...multiCorreta, ...semQuatro].slice(0, 5)) {
    console.log(`       ${q.examId} Q${q.questionNumber}  /questoes/${q.id}`);
  }

  // -------------------------------------------------------------- metadados
  titulo('2 · METADADOS');

  const faseInvalida = questoes.filter((q) => ![1, 2].includes(q.examPhase));
  const numeroAlto = questoes.filter((q) => q.questionNumber > 80);
  const semSuccessRate = questoes.filter((q) => q.successRate === null);
  const anoEstranho = questoes.filter((q) => q.examYear < 2010 || q.examYear > new Date().getFullYear() + 1);

  linha('examPhase fora de {1,2}', faseInvalida.length);
  linha('questionNumber acima de 80', numeroAlto.length);
  linha('examYear fora de faixa', anoEstranho.length);
  linha('successRate nunca calculado', semSuccessRate.length);

  const fases = new Map<number, number>();
  for (const q of faseInvalida) fases.set(q.examPhase, (fases.get(q.examPhase) ?? 0) + 1);
  if (fases.size) {
    console.log('       valores encontrados:', [...fases.entries()].map(([f, n]) => `${f}(${n}x)`).join(' '));
  }
  if (faseInvalida.length) registrar('examPhase inválida', 'media', faseInvalida.length, 'fase só existe 1 e 2');
  if (numeroAlto.length) registrar('questionNumber > 80', 'media', numeroAlto.length, 'prova tem 80 questões');

  // -------------------------------------------------------------- duplicação
  titulo('3 · DUPLICAÇÃO');

  const porEnunciado = new Map<string, typeof questoes>();
  for (const q of questoes) {
    const chave = q.statement.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!porEnunciado.has(chave)) porEnunciado.set(chave, []);
    porEnunciado.get(chave)!.push(q);
  }
  const grupos = [...porEnunciado.values()].filter((g) => g.length > 1);
  const excedentes = grupos.reduce((s, g) => s + g.length - 1, 0);
  const unicas = porEnunciado.size;

  console.log(`  ${grupos.length} grupos de enunciado repetido`);
  console.log(`  ${excedentes} cópias excedentes`);
  console.log(`  ${unicas} questões únicas de verdade  (anunciamos ${total})`);
  if (excedentes) {
    registrar('duplicação', 'alta', excedentes, `banco real tem ${unicas}, não ${total}`);
  }

  // ------------------------------------------------------------- explicações
  titulo('4 · EXPLICAÇÃO × GABARITO');

  let concorda = 0;
  let discorda = 0;
  let naoAfirma = 0;
  let semExplicacao = 0;
  const divergentes: string[] = [];

  for (const q of questoes) {
    if (!q.aiExplanation) { semExplicacao++; continue; }
    const certa = q.alternatives.find((a) => a.isCorrect)?.label?.toUpperCase();
    const texto = q.aiExplanation.explanation;
    const citada = texto.match(/alternativa\s+([A-D])\s+est[áa]\s+(correta|incorreta)/i);
    if (!certa || !citada) { naoAfirma++; continue; }

    const letra = citada[1].toUpperCase();
    const afirmaCorreta = /correta/i.test(citada[2]) && !/incorreta/i.test(citada[2]);
    // Numa questão que pede a errada, a explicação apontar a letra do
    // gabarito como "incorreta" é acerto — é o que a questão pede.
    const bate = afirmaCorreta ? letra === certa : pedeAIncorreta(q.statement) && letra === certa;

    if (bate) concorda++;
    else {
      discorda++;
      if (divergentes.length < 8) {
        divergentes.push(`       ${q.examId} Q${q.questionNumber}: gabarito=${certa}, explicação diz ${letra} ${afirmaCorreta ? 'correta' : 'incorreta'}  /questoes/${q.id}`);
      }
    }
  }

  console.log(`  ok   ${String(concorda).padStart(5)}  explicação concorda com o gabarito`);
  console.log(`  ${discorda ? 'ACHE' : 'ok  '} ${String(discorda).padStart(5)}  DIVERGEM`);
  console.log(`       ${String(naoAfirma).padStart(5)}  explicação não afirma a letra (formato diferente, não é erro)`);
  console.log(`       ${String(semExplicacao).padStart(5)}  sem explicação`);
  divergentes.forEach((d) => console.log(d));
  if (discorda) registrar('explicação divergente', 'alta', discorda, 'aponta letra diferente do gabarito');

  // ---------------------------------------------------------------- citações
  titulo('5 · CITAÇÕES DE LEI');

  const citacoes = new Map<string, number>();
  const impossiveis: string[] = [];
  let comCitacao = 0;

  for (const q of questoes) {
    const e = lerExplicacao(q.aiExplanation?.explanation);
    if (!e?.baseLegal) continue;
    comCitacao++;
    const c = e.baseLegal.replace(/\s+/g, ' ').trim();
    citacoes.set(c, (citacoes.get(c) ?? 0) + 1);
    const erro = artigoImpossivel(c);
    if (erro && impossiveis.length < 10) impossiveis.push(`       ${q.examId} Q${q.questionNumber}: ${erro}`);
  }

  const curinga = [...citacoes.entries()]
    .filter(([k]) => /art\.?\s*5[ºo°]?\b/i.test(k) && /cf|constitui/i.test(k))
    .reduce((s, [, n]) => s + n, 0);

  console.log(`       ${comCitacao} explicações com citação, ${citacoes.size} distintas`);
  console.log(`  ${curinga ? 'ACHE' : 'ok  '} ${String(curinga).padStart(5)}  citam "Art. 5º da CF" (o curinga de quando o modelo não sabe)`);
  console.log(`  ${impossiveis.length ? 'ACHE' : 'ok  '} ${String(impossiveis.length).padStart(5)}  artigo que não existe no código citado`);
  impossiveis.forEach((i) => console.log(i));
  if (curinga) registrar('citação genérica', 'alta', curinga, 'Art. 5º CF como curinga — escondidas do site em 05/09');

  // ---------------------------------------------------------------- veredito
  titulo('VEREDITO');

  if (problemas.length === 0) {
    console.log('  Nada encontrado.');
  } else {
    for (const g of ['alta', 'media', 'baixa'] as const) {
      const doGrupo = problemas.filter((p) => p.gravidade === g);
      if (!doGrupo.length) continue;
      console.log(`\n  ${g.toUpperCase()}`);
      for (const p of doGrupo) {
        console.log(`    ${String(p.quantos).padStart(5)}  ${p.area.padEnd(26)} ${p.nota}`);
      }
    }
  }
  console.log(`\n  ${((Date.now() - inicio) / 1000).toFixed(1)}s\n`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('\nERRO:', e instanceof Error ? e.message : String(e), '\n');
  await prisma.$disconnect();
  process.exit(1);
});
