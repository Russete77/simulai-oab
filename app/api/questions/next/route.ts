import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requirePaidUser, handlePaymentRequired } from "@/lib/auth";
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
 * Escolhe UM ano usando distribuição ponderada por ano (mesma lógica de
 * antes, só que a partir de contagens por ano em vez de carregar toda
 * questão candidata pra memória — cada questão de um ano tem o mesmo peso,
 * então o peso do "balde" do ano é getYearWeight(ano) * quantidade no ano).
 */
function selectWeightedYear(
  yearCounts: Array<{ examYear: number; count: number }>
): number {
  const weighted = yearCounts.map((y) => ({
    year: y.examYear,
    weight: getYearWeight(y.examYear) * y.count,
  }));

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const w of weighted) {
    random -= w.weight;
    if (random <= 0) {
      return w.year;
    }
  }

  // Fallback (não deveria chegar aqui)
  return weighted[weighted.length - 1].year;
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [API] Buscando próxima questão...");
    const user = await requirePaidUser();
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
      ...(params.subject && { subject: params.subject as any }),
      ...(params.difficulty && { difficulty: params.difficulty as any }),
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

    // Contagem por ano (agregado — não carrega as questões inteiras pra
    // memória, evita full scan de até 5.875 linhas a cada requisição)
    const yearGroups = await prisma.question.groupBy({
      by: ["examYear"],
      where,
      _count: true,
    });

    if (yearGroups.length === 0) {
      console.log("❌ [API] Nenhuma questão disponível");
      return NextResponse.json(
        { error: "Nenhuma questão disponível com os critérios fornecidos" },
        { status: 404 }
      );
    }

    const yearCounts = yearGroups.map((g) => ({ examYear: g.examYear, count: g._count }));
    console.log("📊 [API] Total de questões encontradas:", yearCounts.reduce((s, y) => s + y.count, 0));

    // SELEÇÃO PONDERADA POR ANO (prioriza questões recentes)
    const selectedYear = selectWeightedYear(yearCounts);
    const countInYear = yearCounts.find((y) => y.examYear === selectedYear)!.count;
    const randomOffset = Math.floor(Math.random() * countInYear);

    console.log("🎯 [API] Ano selecionado (ponderado):", {
      ano: selectedYear,
      peso: getYearWeight(selectedYear),
      offset: randomOffset,
    });

    // Buscar UMA questão aleatória dentro do ano escolhido, já com alternativas
    const question = await prisma.question.findFirst({
      where: { ...where, examYear: selectedYear },
      skip: randomOffset,
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
    const paymentResp = handlePaymentRequired(error);
    if (paymentResp) return paymentResp;

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
