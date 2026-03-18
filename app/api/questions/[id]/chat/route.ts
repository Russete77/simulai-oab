import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { chatAboutQuestion } from "@/lib/ai/explanation-service";
import { prisma } from "@/lib/db/prisma";
import { checkAiChatLimit, incrementAiChatCount } from "@/lib/billing/limits";
import { ChatMessagesSchema, type ChatMessage } from "@/lib/validations/chat";

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

    // Verificar limite diário de chat IA
    const limitCheck = await checkAiChatLimit(user.id);
    if (!limitCheck.allowed) {
      console.log(`⛔ Limite de chat IA atingido para usuário ${user.id}`);
      return NextResponse.json(
        {
          error: "Limite diário de conversas com IA atingido",
          limit: limitCheck.limit,
          current: limitCheck.current,
          resetAt: limitCheck.resetAt,
          planType: user.planType,
          message: `Você atingiu o limite de ${limitCheck.limit} mensagens no chat por dia do plano ${user.planType}. Faça upgrade para Pro ou Premium!`
        },
        { status: 429 }
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

    // Incrementar contador de chat IA
    await incrementAiChatCount(user.id);

    // Salvar conversa no banco (opcional, para histórico)
    try {
      const existingChat = await prisma.userQuestionChat.findFirst({
        where: {
          userId: user.id,
          questionId: id,
        },
      });

      // P3 FIX: Validar mensagens com Zod antes de salvar no banco
      const newMessage: ChatMessage = {
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };
      const newMessages = [...chatHistory, newMessage];
      const validatedMessages = ChatMessagesSchema.safeParse(newMessages);
      const messagesToSave = validatedMessages.success
        ? validatedMessages.data
        : [newMessage]; // Fallback: só a mensagem atual se histórico inválido

      if (existingChat) {
        await prisma.userQuestionChat.update({
          where: { id: existingChat.id },
          data: {
            messages: messagesToSave,
            messageCount: { increment: 1 },
            lastMessage: message,
          },
        });
      } else {
        await prisma.userQuestionChat.create({
          data: {
            userId: user.id,
            questionId: id,
            messages: messagesToSave,
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
