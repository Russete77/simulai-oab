/**
 * Diagnóstico: questões com alternativas duplicadas no enunciado
 *
 * Detecta questões onde o campo `statement` contém texto das alternativas
 * (ex: "A)" ou "A." seguido do texto da alternativa repetido no final)
 *
 * Uso: npx tsx scripts/diagnose-dirty-statements.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Buscando questões com alternativas no enunciado...\n');

  // Buscar todas as questões com suas alternativas
  const questions = await prisma.question.findMany({
    where: { nullified: false },
    select: {
      id: true,
      examId: true,
      questionNumber: true,
      subject: true,
      statement: true,
      alternatives: {
        select: { label: true, text: true },
        orderBy: { label: 'asc' },
      },
    },
    orderBy: [{ examYear: 'desc' }, { questionNumber: 'asc' }],
  });

  console.log(`Total de questões: ${questions.length}\n`);

  // Padrões que indicam alternativas no enunciado
  const patterns = [
    /\n[A-D]\)/,           // A) B) C) D) com quebra de linha
    /\n\([A-D]\)/,         // (A) (B) (C) (D) com quebra de linha
    /[A-D]\)[A-Z][a-z]/,   // A)Texto colado
    /\([A-D]\)\s*[A-Z]/,   // (A) Texto
  ];

  let dirtyCount = 0;
  const dirtyQuestions: Array<{
    id: string;
    examId: string;
    questionNumber: number;
    subject: string;
    altAText: string;
    statementEnding: string;
  }> = [];

  for (const q of questions) {
    const statement = q.statement;
    const altA = q.alternatives.find(a => a.label === 'A');

    if (!altA) continue;

    // Checa se o texto da alternativa A aparece no statement
    // (normalizar espaços para comparação)
    const normalizedStatement = statement.replace(/\s+/g, ' ').trim();
    const normalizedAltA = altA.text.replace(/\s+/g, ' ').trim().substring(0, 60);

    const hasDuplicate =
      normalizedStatement.includes(normalizedAltA) ||
      patterns.some(p => p.test(statement));

    if (hasDuplicate) {
      dirtyCount++;
      dirtyQuestions.push({
        id: q.id,
        examId: q.examId,
        questionNumber: q.questionNumber,
        subject: q.subject,
        altAText: normalizedAltA,
        statementEnding: normalizedStatement.slice(-120),
      });
    }
  }

  console.log(`\n📊 RESULTADO:`);
  console.log(`   Questões limpas: ${questions.length - dirtyCount}`);
  console.log(`   Questões com alternativas no enunciado: ${dirtyCount}`);
  console.log(`   Percentual: ${((dirtyCount / questions.length) * 100).toFixed(1)}%\n`);

  // Mostrar exemplos
  if (dirtyQuestions.length > 0) {
    console.log(`\n📝 EXEMPLOS (primeiros 10):\n`);
    for (const q of dirtyQuestions.slice(0, 10)) {
      console.log(`  [${q.examId} Q${q.questionNumber}] ${q.subject}`);
      console.log(`  ID: ${q.id}`);
      console.log(`  Final do statement: ...${q.statementEnding}`);
      console.log(`  Alt A: ${q.altAText}...`);
      console.log('');
    }

    // Agrupar por exame
    const byExam = new Map<string, number>();
    for (const q of dirtyQuestions) {
      byExam.set(q.examId, (byExam.get(q.examId) || 0) + 1);
    }

    console.log(`\n📈 POR EXAME:`);
    for (const [exam, count] of [...byExam.entries()].sort()) {
      console.log(`   ${exam}: ${count} questões`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
