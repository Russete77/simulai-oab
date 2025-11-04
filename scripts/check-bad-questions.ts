import { prisma } from '../lib/db/prisma';

async function checkBadQuestions() {
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
    take: 10,
  });

  console.log('\nEncontradas', questions.length, 'questões com "A)" no enunciado:\n');

  for (const q of questions) {
    const preview = q.statement.substring(0, 300);
    console.log('---');
    console.log('ID:', q.id);
    console.log('Prova:', q.examYear, '- Questão', q.questionNumber);
    console.log('Preview:', preview, '...');
    
    const hasPattern = q.statement.includes('A)') && q.statement.includes('B)');
    console.log('Tem alternativas no statement:', hasPattern);
  }

  const total = await prisma.question.count({
    where: {
      OR: [
        { statement: { contains: 'A)' } },
        { statement: { contains: 'B)' } },
      ],
    },
  });

  console.log('\n\nTotal de questões com problema potencial:', total);

  await prisma.$disconnect();
}

checkBadQuestions();
