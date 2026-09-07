/**
 * Marca as questões duplicadas, apontando cada cópia para a que fica.
 *
 *   npx tsx scripts/marcar-duplicatas.ts             # seco, não escreve
 *   npx tsx scripts/marcar-duplicatas.ts --aplicar
 *   npx tsx scripts/marcar-duplicatas.ts --desfazer  # limpa tudo
 *
 * POR QUE MARCAR E NÃO APAGAR
 *
 * 1.458 respostas de usuário vivem nas cópias, e `UserAnswer` tem
 * `onDelete: Cascade` tanto para `Question` quanto para `Alternative`.
 * Apagar a questão duplicada levaria as respostas junto, em silêncio —
 * quebrando ranking, histórico e desempenho por matéria de gente real.
 *
 * Marcando: nada se perde, a página da cópia redireciona 301 para a que
 * fica, ela some das listagens e do sitemap, e desfazer é um UPDATE.
 *
 * QUEM FICA
 *
 * A de menor `questionNumber` — é a numeração real da prova. As cópias
 * vieram com número deslocado (+80, +100) da segunda importação.
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../lib/db/prisma';

const APLICAR = process.argv.includes('--aplicar');
const DESFAZER = process.argv.includes('--desfazer');

const PASTA_BACKUP = path.join(process.cwd(), '_PLANO-CLAUDE', 'backups');

async function desfazer() {
  const antes = await prisma.question.count({ where: { duplicataDe: { not: null } } });
  console.log(`\n  ${antes} questões marcadas como duplicata`);
  if (!APLICAR) {
    console.log('  (seco) rode com --aplicar para limpar\n');
    return;
  }
  const r = await prisma.question.updateMany({
    where: { duplicataDe: { not: null } },
    data: { duplicataDe: null },
  });
  console.log(`  ${r.count} desmarcadas\n`);
}

async function main() {
  if (DESFAZER) return desfazer();

  console.log('\n  lendo o banco...');
  const questoes = await prisma.question.findMany({
    where: { nullified: false },
    select: { id: true, statement: true, examId: true, questionNumber: true, duplicataDe: true },
    orderBy: { questionNumber: 'asc' },
  });

  // Agrupa por enunciado normalizado. Espaço e caixa variam entre as duas
  // importações da mesma prova.
  const grupos = new Map<string, typeof questoes>();
  for (const q of questoes) {
    const chave = q.statement.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(q);
  }

  const duplicados = [...grupos.values()].filter((g) => g.length > 1);
  const pares: { copia: string; fica: string; exame: string; numCopia: number; numFica: number }[] = [];

  for (const grupo of duplicados) {
    // `orderBy` já trouxe ordenado, então o primeiro é o de menor número.
    const [fica, ...copias] = grupo;
    for (const c of copias) {
      pares.push({
        copia: c.id,
        fica: fica.id,
        exame: c.examId,
        numCopia: c.questionNumber,
        numFica: fica.questionNumber,
      });
    }
  }

  const jaMarcadas = questoes.filter((q) => q.duplicataDe).length;

  console.log(`  ${questoes.length} questões válidas`);
  console.log(`  ${grupos.size} enunciados distintos`);
  console.log(`  ${duplicados.length} grupos com repetição`);
  console.log(`  ${pares.length} cópias a marcar${jaMarcadas ? ` (${jaMarcadas} já marcadas)` : ''}`);

  // Quantas respostas de usuário estão nas cópias — o número que justifica
  // marcar em vez de apagar.
  const idsCopias = pares.map((p) => p.copia);
  const respostasNasCopias = await prisma.userAnswer.count({
    where: { questionId: { in: idsCopias } },
  });
  const totalRespostas = await prisma.userAnswer.count();
  console.log(`  ${respostasNasCopias} respostas de usuário vivem nessas cópias (de ${totalRespostas})`);
  console.log('  elas NÃO são tocadas — por isso marcamos em vez de apagar');

  console.log('\n  amostra:');
  for (const p of pares.slice(0, 5)) {
    console.log(`    ${p.exame}  Q${String(p.numCopia).padStart(3)} → Q${p.numFica}`);
  }

  if (!APLICAR) {
    console.log('\n  Nada foi escrito. Para valer: npx tsx scripts/marcar-duplicatas.ts --aplicar\n');
    return;
  }

  // Backup antes de escrever. Só ids — nada se perde de verdade aqui, mas
  // dá para reverter exatamente este conjunto.
  fs.mkdirSync(PASTA_BACKUP, { recursive: true });
  const arquivo = path.join(PASTA_BACKUP, `duplicatas-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(arquivo, JSON.stringify(pares, null, 1));
  console.log(`\n  backup: ${path.relative(process.cwd(), arquivo)}  (${pares.length} pares)`);

  // Em lotes: 2.250 updates individuais numa conexão só demora demais.
  let feitos = 0;
  const LOTE = 200;
  for (let i = 0; i < pares.length; i += LOTE) {
    const fatia = pares.slice(i, i + LOTE);
    await prisma.$transaction(
      fatia.map((p) =>
        prisma.question.update({ where: { id: p.copia }, data: { duplicataDe: p.fica } })
      )
    );
    feitos += fatia.length;
    process.stdout.write(`\r  marcando... ${feitos}/${pares.length}`);
  }
  console.log('');

  // Conferência: nada de resposta pode ter sumido.
  const depois = await prisma.userAnswer.count();
  const marcadas = await prisma.question.count({ where: { duplicataDe: { not: null } } });
  const visiveis = await prisma.question.count({ where: { nullified: false, duplicataDe: null } });

  console.log(`\n  marcadas ............ ${marcadas}`);
  console.log(`  questões visíveis ... ${visiveis}`);
  console.log(
    `  respostas ........... ${depois} ${depois === totalRespostas ? '(inalterado, certo)' : '<-- MUDOU, INVESTIGAR'}`
  );
  console.log('');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('\n  ERRO:', e instanceof Error ? e.message : String(e), '\n');
    await prisma.$disconnect();
    process.exit(1);
  });
