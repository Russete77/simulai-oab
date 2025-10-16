import OpenAI from "openai";
import { prisma } from "@/lib/db/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.AI_EXPLANATION_MODEL || "gpt-4o-mini";

interface Alternative {
  label: string;
  text: string;
  isCorrect: boolean;
}

interface ExplanationContext {
  questionId: string;
  question: string;
  alternatives: Alternative[];
  userAnswer?: string;
  correctAnswer: string;
  subject: string;
  examYear: number;
}

export async function generateExplanation(
  context: ExplanationContext
  , style: 'professor' | 'concise' | 'chat' = 'professor'
): Promise<string> {
  try {
    // 1. Verificar se já existe no banco (se a tabela existir)
    let existing = null;
    try {
      existing = await prisma.questionExplanation.findUnique({
        where: { questionId: context.questionId },
      });

      if (existing) {
        // Incrementar contador de uso
        await prisma.questionExplanation.update({
          where: { id: existing.id },
          data: { usageCount: { increment: 1 } },
        });
        return existing.explanation;
      }
    } catch (dbError) {
      // Se a tabela não existir ainda, continuar sem cache
      console.log("⚠️  Tabela de explicações não encontrada, gerando sem cache");
    }

    // 2. Preparar prompt e system message baseado no estilo
    const prompt = buildExplanationPrompt(context, style);
    const systemMessage = getSystemPromptForStyle(style, context.subject);

    console.log("🤖 Gerando explicação com IA (estilo:", style, ")...");

    // 3. Chamar OpenAI
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: style === 'concise' ? 0.5 : 0.7,
      max_tokens: style === 'concise' ? 400 : 800,
    });

    const explanation = response.choices[0].message.content || "";

    // 4. Salvar no banco (se a tabela existir)
    try {
      await prisma.questionExplanation.create({
        data: {
          questionId: context.questionId,
          explanation,
          generatedBy: "openai",
          model: MODEL,
          usageCount: 1,
        },
      });
      console.log("✅ Explicação gerada e salva com sucesso!");
    } catch (dbError) {
      console.log("⚠️  Não foi possível salvar no cache, mas explicação gerada com sucesso");
    }

    return explanation;
  } catch (error) {
    console.error("❌ Erro ao gerar explicação:", error);
    throw new Error("Erro ao gerar explicação com IA");
  }
}

function buildExplanationPrompt(context: ExplanationContext, style: 'professor' | 'concise' | 'chat' = 'professor'): string {
  const userAnswerInfo = context.userAnswer
    ? `\n**Resposta do usuário:** ${context.userAnswer} ${
        context.userAnswer !== context.correctAnswer ? "❌ (INCORRETA)" : "✓ (CORRETA)"
      }`
    : "";

  return `# Questão do Exame da OAB - ${context.subject}
**Ano:** ${context.examYear}

## Enunciado
${context.question}

## Alternativas
${context.alternatives
  .map(
    (alt) =>
      `**${alt.label})** ${alt.text} ${alt.isCorrect ? "✓ **(CORRETA)**" : ""}`
  )
  .join("\n\n")}
${userAnswerInfo}

---

**Por favor, explique:**
1. Por que a alternativa **${context.correctAnswer}** é a correta
2. Por que as outras alternativas estão incorretas
3. Cite a legislação aplicável (lei, artigo, etc)
4. Dê uma dica para memorizar ou entender o conceito

Use Markdown para formatar sua resposta.`;
}

function getSystemPromptForStyle(style: 'professor' | 'concise' | 'chat', subject?: string) {
  const base = `Você é um professor especialista em ${subject || 'Direito brasileiro'} preparando candidatos para a OAB.`;
  if (style === 'concise') {
    return `${base}\nForneça explicações CONCISAS e DIRETAS:\n1) Por que a alternativa correta está certa (1-2 frases + base legal)\n2) Por que as outras estão erradas\n3) Base legal\n4) Dica prática.\nUse Markdown limpo. Máximo 400 palavras.`;
  }
  if (style === 'chat') {
    return `${base}\nResponda como um assistente conversacional: seja claro, amigável e prático. Use exemplos quando útil. Formate em Markdown se apropriado.`;
  }
  // professor (default)
  return `${base}\nExplique como um professor didático: comece com visão geral do tema, apresente a resposta correta com justificativa detalhada, discuta alternativas incorretas com exemplos práticos e finalize com um resumo e dica de memorização. Use linguagem acessível e motivadora. Formate em Markdown.`;
}


// Função para chat interativo
export async function chatAboutQuestion(
  questionId: string,
  userId: string,
  message: string,
  chatHistory: { role: string; content: string }[],
  style: 'professor' | 'concise' | 'chat' = 'chat'
): Promise<ReadableStream> {
  try {
    // Buscar contexto da questão
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { alternatives: true },
    });

    if (!question) {
      throw new Error("Questão não encontrada");
    }

    // Construir mensagens
    const system = getSystemPromptForStyle(style, String(question.subject));

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `${system}\n\nVocê está ajudando um estudante com dúvidas sobre uma questão específica.\n\nContexto da questão:\n**Matéria:** ${question.subject}\n**Ano:** ${question.examYear}\n**Enunciado:** ${question.statement}\n**Alternativas:**\n${question.alternatives.map((a) => `${a.label}) ${a.text}`).join("\n")}\n**Correta:** ${question.alternatives.find((a) => a.isCorrect)?.label}\n\nResponda de forma didática, clara e objetiva. Use exemplos práticos quando possível.`,
      },
      ...chatHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      {
        role: "user",
        content: message,
      },
    ];

    // Chamar OpenAI com streaming
    const stream = await openai.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.8,
      max_tokens: 800,
      stream: true,
    });

    // Criar ReadableStream
    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            let text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              // Minimal cleaning requested: remove bold markers (**) and heading markers (##) at line starts
              try {
                // remove all occurrences of double asterisks
                text = text.replace(/\*\*/g, "");
                // remove leading hashes at the start of lines (e.g. '## ', '### ')
                text = text.replace(/(^|\n)#{1,6}\s*/g, "$1");
              } catch (e) {
                // if regex fails for some reason, fallback to original chunk
              }
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
  } catch (error) {
    console.error("❌ Erro no chat:", error);
    throw error;
  }
}

