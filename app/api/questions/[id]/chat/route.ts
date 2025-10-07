import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { chatAboutQuestion } from "@/lib/ai/explanation-service";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const { message, chatHistory = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Mensagem inválida" },
        { status: 400 }
      );
    }

    console.log(`💬 Chat sobre questão ${id}...`);

    // Verificar se a questão existe
    const question = await prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Questão não encontrada" },
        { status: 404 }
      );
    }

    // Gerar resposta com streaming
    const stream = await chatAboutQuestion(
      id,
      user.id,
      message,
      chatHistory
    );

    // Salvar conversa no banco (opcional, para histórico)
    try {
      const existingChat = await prisma.userQuestionChat.findFirst({
        where: {
          userId: user.id,
          questionId: id,
        },
      });

      const newMessages = [
        ...chatHistory,
        { role: "user", content: message, timestamp: new Date().toISOString() },
      ];

      if (existingChat) {
        await prisma.userQuestionChat.update({
          where: { id: existingChat.id },
          data: {
            messages: newMessages,
            messageCount: { increment: 1 },
            lastMessage: message,
          },
        });
      } else {
        await prisma.userQuestionChat.create({
          data: {
            userId: user.id,
            questionId: id,
            messages: newMessages,
            messageCount: 1,
            lastMessage: message,
          },
        });
      }
    } catch (dbError) {
      console.warn("⚠️ Erro ao salvar chat no banco:", dbError);
      // Não bloquear a resposta por erro no banco
    }

    // Retornar stream
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("❌ Erro no chat:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao processar chat",
      },
      { status: 500 }
    );
  }
}
