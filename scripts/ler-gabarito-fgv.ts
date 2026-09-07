/**
 * Cruza o banco com o gabarito OFICIAL da FGV, lido direto do PDF.
 *
 *   npx tsx scripts/ler-gabarito-fgv.ts
 *
 * Esta é a única verificação de VERACIDADE do projeto. Todo o resto da
 * auditoria confere coerência interna — se o banco é consistente consigo
 * mesmo, o que não impede de estar consistentemente errado. Aqui a fonte é
 * a FGV.
 *
 * SEMPRE O TIPO 1. O mesmo PDF publica os gabaritos dos tipos 1 a 4, e eles
 * são DIFERENTES entre si: os tipos embaralham a ordem das questões e das
 * alternativas. Cruzar com o tipo errado produziria ~25% de acerto e a
 * conclusão de que o banco inteiro está podre. O banco segue o Tipo 1.
 *
 * Os PDFs ficam em _PLANO-CLAUDE/provas-fgv/ e não vão para o repositório.
 * Links oficiais em BAIXAR-AQUI.md.
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../lib/db/prisma';

const PASTA = path.join(process.cwd(), '_PLANO-CLAUDE', 'provas-fgv');

const PROVAS = [
  { arquivo: '44-gabarito.pdf', examId: '2025-02', nome: 'Exame 44' },
  { arquivo: '45-gabarito.pdf', examId: '2025-03', nome: 'Exame 45' },
  { arquivo: '46-gabarito.pdf', examId: '2026-01', nome: 'Exame 46' },
];

async function textoDoPdf(caminho: string): Promise<string> {
  // A fonte dos PDFs da FGV usa codificação própria — ler os streams à mão
  // devolve bytes que não são ASCII. O pdfjs resolve a tabela de fontes.
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const dados = new Uint8Array(fs.readFileSync(caminho));
  const pdf = await getDocument({ data: dados, useSystemFonts: true }).promise;

  let texto = '';
  for (let p = 1; p <= pdf.numPages; p++) {
    const pagina = await pdf.getPage(p);
    const conteudo = await pagina.getTextContent();
    texto += conteudo.items.map((i) => ('str' in i ? i.str : '')).join(' ') + '\n';
  }
  return texto;
}

/**
 * O PDF é uma tabela: uma linha com 20 números, a linha seguinte com as 20
 * letras. Repetido quatro vezes por tipo de prova.
 *
 * Recorta a seção do Tipo 1 e casa número com letra por posição.
 */
function lerTipo1(texto: string): Map<number, string> {
  const limpo = texto.replace(/\s+/g, ' ');

  const inicio = limpo.search(/TIPO\s*1\b/i);
  if (inicio < 0) return new Map();

  const resto = limpo.slice(inicio + 6);
  const fim = resto.search(/TIPO\s*[234]\b/i);
  const secao = fim < 0 ? resto : resto.slice(0, fim);

  const gabarito = new Map<number, string>();
  const tokens = secao.split(' ').filter(Boolean);

  // Percorre juntando blocos: acumula números até aparecer letra, e aí casa
  // um a um na ordem.
  let numeros: number[] = [];
  let letras: string[] = [];

  const fechar = () => {
    for (let i = 0; i < Math.min(numeros.length, letras.length); i++) {
      const n = numeros[i];
      if (n >= 1 && n <= 80 && !gabarito.has(n)) gabarito.set(n, letras[i]);
    }
    numeros = [];
    letras = [];
  };

  for (const bruto of tokens) {
    const t = bruto.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (!t) continue;

    if (/^\d{1,2}$/.test(t)) {
      // Número depois de letras significa que um bloco acabou.
      if (letras.length) fechar();
      numeros.push(parseInt(t, 10));
    } else if (/^[ABCD]$/.test(t)) {
      letras.push(t);
    } else if (/^ANULAD/.test(t)) {
      letras.push('ANULADA');
    }
  }
  fechar();

  return gabarito;
}

async function main() {
  console.log('\nCRUZAMENTO COM O GABARITO OFICIAL DA FGV\n');

  let conferidas = 0;
  let batem = 0;
  const divergencias: string[] = [];

  for (const prova of PROVAS) {
    const caminho = path.join(PASTA, prova.arquivo);
    if (!fs.existsSync(caminho)) {
      console.log(`  ${prova.nome}: ${prova.arquivo} não está na pasta — ver BAIXAR-AQUI.md\n`);
      continue;
    }

    const oficial = lerTipo1(await textoDoPdf(caminho));
    const nossas = await prisma.question.findMany({
      where: { examId: prova.examId, duplicataDe: null, nullified: false },
      select: {
        questionNumber: true,
        alternatives: { where: { isCorrect: true }, select: { label: true } },
      },
    });

    const porNumero = new Map(
      nossas.map((q) => [q.questionNumber, q.alternatives[0]?.label?.toUpperCase()])
    );

    let ok = 0;
    let erro = 0;
    let ausente = 0;

    for (const [numero, letra] of oficial) {
      if (letra === 'ANULADA') continue;
      const nossa = porNumero.get(numero);
      if (!nossa) { ausente++; continue; }

      conferidas++;
      if (nossa === letra) { ok++; batem++; }
      else {
        erro++;
        if (divergencias.length < 20) {
          divergencias.push(`    ${prova.examId} Q${numero}: FGV=${letra}  banco=${nossa}`);
        }
      }
    }

    const pct = ok + erro > 0 ? ((ok / (ok + erro)) * 100).toFixed(1) : '—';
    console.log(`  ${prova.nome}  (${prova.examId})`);
    console.log(`    gabarito oficial (Tipo 1): ${oficial.size} questões`);
    console.log(`    conferem ${ok} · divergem ${erro} · sem par ${ausente}  →  ${pct}%\n`);
  }

  console.log('─'.repeat(64));
  if (conferidas === 0) {
    console.log('  Nenhuma questão pôde ser conferida.\n');
    return;
  }

  const pct = ((batem / conferidas) * 100).toFixed(1);
  console.log(`  ${batem} de ${conferidas} conferem com a FGV  →  ${pct}%`);
  if (divergencias.length) {
    console.log('\n  divergências:');
    divergencias.forEach((d) => console.log(d));
  } else {
    console.log('  Nenhuma divergência.');
  }
  console.log('');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('\nERRO:', e instanceof Error ? e.message : String(e), '\n');
    await prisma.$disconnect();
    process.exit(1);
  });
