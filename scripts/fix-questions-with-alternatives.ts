import { prisma } from '../lib/db/prisma';

/**
 * Remove alternativas do enunciado das questões
 *
 * Algumas questões do dataset vieram com as alternativas incluídas
 * no campo "statement". Este script identifica e corrige.
 */

async function fixQuestionsWithAlternatives() {
  console.log('🔍 Buscando questões com alternativas no enunciado...\n');

  // Buscar questões que provavelmente têm alternativas no statement
  const questions = await prisma.question.findMany({
    where: {
      statement: {
        contains: 'A)',
      },
    },
    select: {
      id: true,
      examYear: true,
      questionNumber: true,
      statement: true,
    },
  });

  console.log(`Encontradas ${questions.length} questões para analisar\n`);

  let fixed = 0;
  let skipped = 0;

  for (const q of questions) {
    // Checar se realmente tem padrão de alternativas (A) ... B) ... C) ... D))
    const hasPattern = q.statement.includes('A)') &&
                       q.statement.includes('B)') &&
                       q.statement.includes('C)') &&
                       q.statement.includes('D)');

    if (!hasPattern) {
      skipped++;
      continue;
    }

    // Tentar extrair apenas o enunciado (antes do "A)")
    const match = q.statement.match(/^(.*?)\s+A\)/s);

    if (!match) {
      console.log(`⚠️  Não consegui extrair enunciado de ${q.examYear}-${q.questionNumber}`);
      skipped++;
      continue;
    }

    const cleanStatement = match[1].trim();

    // Validar que o enunciado limpo não ficou muito curto
    if (cleanStatement.length < 50) {
      console.log(`⚠️  Enunciado muito curto para ${q.examYear}-${q.questionNumber}, pulando`);
      skipped++;
      continue;
    }

    // Atualizar no banco
    try {
      await prisma.question.update({
        where: { id: q.id },
        data: { statement: cleanStatement },
      });

      console.log(`✅ Corrigido: ${q.examYear}-${q.questionNumber}`);
      console.log(`   Antes: ${q.statement.substring(0, 100)}...`);
      console.log(`   Depois: ${cleanStatement.substring(0, 100)}...\n`);

      fixed++;
    } catch (error) {
      console.error(`❌ Erro ao corrigir ${q.examYear}-${q.questionNumber}:`, error);
    }
  }

  console.log(`\n✅ Processo concluído!`);
  console.log(`   Corrigidas: ${fixed}`);
  console.log(`   Puladas: ${skipped}`);
  console.log(`   Total analisadas: ${questions.length}`);

  await prisma.$disconnect();
}

fixQuestionsWithAlternatives();
