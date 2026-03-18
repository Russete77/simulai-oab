import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkQuestions() {
  // Total de questões
  const total = await prisma.question.count();
  console.log(`\n📊 Total de questões no banco: ${total}\n`);

  // Por ano
  const byYear = await prisma.question.groupBy({
    by: ['examYear'],
    _count: true,
    orderBy: {
      examYear: 'asc',
    },
  });

  console.log('📅 Distribuição por ano:');
  byYear.forEach((year) => {
    console.log(`  ${year.examYear}: ${year._count} questões`);
  });

  // Por matéria
  const bySubject = await prisma.question.groupBy({
    by: ['subject'],
    _count: true,
    orderBy: {
      _count: {
        subject: 'desc',
      },
    },
  });

  console.log('\n📚 Distribuição por matéria:');
  bySubject.forEach((subject) => {
    console.log(`  ${subject.subject}: ${subject._count} questões`);
  });

  await prisma.$disconnect();
}

checkQuestions().catch(console.error);
