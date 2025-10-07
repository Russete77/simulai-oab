import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth";
import { GetNextQuestionSchema } from "@/lib/validations/question";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [API] Buscando próxima questão...");
    const user = await requireAuth();
    console.log("✅ [API] Usuário autenticado:", user.id);
    const searchParams = request.nextUrl.searchParams;

    // Validar query params
    const params = GetNextQuestionSchema.parse({
      subject: searchParams.get("subject") || undefined,
      difficulty: searchParams.get("difficulty") || undefined,
      excludeAnswered: searchParams.get("excludeAnswered") === "true",
    });

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

    // Buscar questão aleatória usando agregação
    const count = await prisma.question.count({ where });
    console.log("📊 [API] Total de questões encontradas:", count);

    if (count === 0) {
      console.log("❌ [API] Nenhuma questão disponível");
      return NextResponse.json(
        { error: "Nenhuma questão disponível com os critérios fornecidos" },
        { status: 404 }
      );
    }

    // Usar uma abordagem mais aleatória: buscar IDs e selecionar um aleatório
    const randomIndex = Math.floor(Math.random() * count);

    const question = await prisma.question.findFirst({
      where,
      skip: randomIndex,
      include: {
        alternatives: {
          orderBy: { label: "asc" },
        },
      },
      orderBy: {
        id: 'asc', // Ordenar para garantir consistência na seleção
      },
    });

    if (!question) {
      console.log("❌ [API] Questão não encontrada após busca");
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
