import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * Calcula um seed determinístico baseado na data de hoje
 * Sempre retorna o mesmo valor para o mesmo dia
 */
function getDailyQuestionSeed(): number {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }

  return Math.abs(hash);
}

export async function GET() {
  try {
    console.log('🔍 [API] Buscando questão do dia...');

    // Contar total de questões não anuladas
    const totalQuestions = await prisma.question.count({
      where: { nullified: false },
    });

    if (totalQuestions === 0) {
      console.log('❌ [API] Nenhuma questão disponível');
      return NextResponse.json(
        { error: 'Nenhuma questão disponível' },
        { status: 404 }
      );
    }

    // Calcular índice determinístico
    const seed = getDailyQuestionSeed();
    const questionIndex = seed % totalQuestions;

    console.log(`📊 [API] Total de questões: ${totalQuestions}, Índice: ${questionIndex}`);

    // Buscar a questão no índice calculado usando OFFSET e LIMIT
    const question = await prisma.question.findFirst({
      where: { nullified: false },
      include: {
        alternatives: {
          orderBy: { label: 'asc' },
        },
      },
      skip: questionIndex,
      take: 1,
    });

    if (!question) {
      console.log('❌ [API] Questão não encontrada');
      return NextResponse.json(
        { error: 'Questão não encontrada' },
        { status: 404 }
      );
    }

    console.log(`✅ [API] Questão do dia encontrada: ${question.id}`);

    // Remover a resposta correta das alternativas para não revelar
    const alternatives = question.alternatives.map(({ isCorrect, ...alt }) => alt);

    // Retornar a questão com metadados adicionais
    return NextResponse.json({
      ...question,
      alternatives,
      todayDate: new Date().toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('❌ [API] Erro ao buscar questão do dia:', error);

    return NextResponse.json(
      { error: 'Erro ao buscar questão do dia' },
      { status: 500 }
    );
  }
}
