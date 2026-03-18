import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth";
import { GetNextQuestionSchema } from "@/lib/validations/question";
import { Prisma } from "@prisma/client";

/**
 * Calcula peso de um ano baseado em quão recente ele é
 * MESMA LÓGICA DOS SIMULADOS
 * 
 * Anos mais recentes = maior peso = maior chance de seleção
 */
function getYearWeight(year: number): number {
  const currentYear = new Date().getFullYear();

  if (year >= currentYear - 2) return 10.0; // Últimos 2 anos: PRIORIDADE MÁXIMA
  if (year >= 2020) return 5.0;  // 2020-2023: Alta prioridade
  if (year >= 2017) return 2.0;  // 2017-2019: Média prioridade
  if (year >= 2014) return 1.0;  // 2014-2016: Baixa prioridade
  if (year >= 2011) return 0.3;  // 2011-2013: Muito baixa
  return 0.1;                     // Antes 2011: MÍNIMA
}

/**
 * Seleciona UMA questão usando distribuição PONDERADA por ano
 * Questões mais recentes têm maior probabilidade de serem selecionadas
 */
function selectWeightedQuestion(
  questions: Array<{ id: string; examYear: number }>
): { id: string; examYear: number } {
  if (questions.length === 0) {
    throw new Error("Nenhuma questão disponível");
  }

  if (questions.length === 1) {
    return questions[0];
  }

  // Calcular peso de cada questão
  const weightedQuestions = questions.map(q => ({
    question: q,
    weight: getYearWeight(q.examYear),
  }));

  // Calcular peso total
  const totalWeight = weightedQuestions.reduce((sum, wq) => sum + wq.weight, 0);

  // Selecionar questão baseado em probabilidade ponderada
  let random = Math.random() * totalWeight;
  
  for (const wq of weightedQuestions) {
    random -= wq.weight;
    if (random <= 0) {
      return wq.question;
    }
  }

  // Fallback (não deveria chegar aqui)
  return weightedQuestions[weightedQuestions.length - 1].question;
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [API] Buscando próxima questão...");
    const user = await requireAuth();
    console.log("✅ [API] Usuário autenticado:", user.id);

    const searchParams = request.nextUrl.searchParams;
    const questionId = searchParams.get("questionId");

    // Se questionId for fornecido, buscar questão específica
    if (questionId) {
      console.log("🎯 [API] Buscando questão específica:", questionId);

      const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: {
          alternatives: {
            orderBy: { label: "asc" },
          },
        },
      });

      if (!question || question.nullified) {
        console.log("❌ [API] Questão não encontrada ou anulada:", questionId);
        return NextResponse.json(
          { error: "Questão não encontrada" },
          { status: 404 }
        );
      }

      console.log("✅ [API] Questão específica encontrada:", question.id);

      // Remover a resposta correta das alternativas
      const alternatives = question.alternatives.map(({ isCorrect, ...alt }) => alt);

      return NextResponse.json({
        ...question,
        alternatives,
      });
    }

    // Validar query params
    const parsed = GetNextQuestionSchema.safeParse({
      subject: searchParams.get("subject") || undefined,
      difficulty: searchParams.get("difficulty") || undefined,
      excludeAnswered: searchParams.get("excludeAnswered") === "true",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Parâmetros inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const params = parsed.data;

    // Construir where clause
    const where: Prisma.QuestionWhereInput = {
      nullified: false,
      ...(params.subject && { subject: params.subject }),
      ...(params.difficulty && { difficulty: params.difficulty }),
    };

    // Excluir questões já respondidas
    if (params.excludeAnswered) {
      const answeredQuestions = await prisma.userAnswer.findMany({
        where: { userId: user.id },
        select: { questionId: true },
      });

      where.id = {
        notIn: answeredQuestions.map((a) => a.questionId),
      };
    }

    // Buscar TODAS as questões disponíveis (apenas ID e ano para performance)
    const availableQuestions = await prisma.question.findMany({
      where,
      select: {
        id: true,
        examYear: true,
      },
    });

    console.log("📊 [API] Total de questões encontradas:", availableQuestions.length);

    if (availableQuestions.length === 0) {
      console.log("❌ [API] Nenhuma questão disponível");
      return NextResponse.json(
        { error: "Nenhuma questão disponível com os critérios fornecidos" },
        { status: 404 }
      );
    }

    // SELEÇÃO PONDERADA POR ANO (prioriza questões recentes)
    const selectedQuestion = selectWeightedQuestion(availableQuestions);

    console.log("🎯 [API] Questão selecionada (ano prioritário):", {
      id: selectedQuestion.id,
      ano: selectedQuestion.examYear,
      peso: getYearWeight(selectedQuestion.examYear)
    });

    // Buscar questão completa com alternativas
    const question = await prisma.question.findUnique({
      where: { id: selectedQuestion.id },
      include: {
        alternatives: {
          orderBy: { label: "asc" },
        },
      },
    });

    if (!question) {
      console.log("❌ [API] Questão não encontrada após seleção");
      return NextResponse.json(
        { error: "Questão não encontrada" },
        { status: 404 }
      );
    }

    console.log("✅ [API] Questão encontrada:", question.id);

    // Remover a resposta correta das alternativas
    const alternatives = question.alternatives.map(({ isCorrect, ...alt }) => alt);

    return NextResponse.json({
      ...question,
      alternatives,
    });
  } catch (error) {
    console.error("❌ [API] Erro ao buscar questão:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erro ao buscar próxima questão" },
      { status: 500 }
    );
  }
}
