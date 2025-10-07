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

    // 2. Preparar prompt
    const prompt = buildExplanationPrompt(context);

    console.log("🤖 Gerando explicação com IA...");

    // 3. Chamar OpenAI
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `Você é um professor especialista em Direito brasileiro preparando candidatos para a OAB.

Forneça explicações CONCISAS e DIRETAS:

1. **Resposta Correta** - Por que está certa (1-2 frases + base legal)
2. **Alternativas Incorretas** - Por que estão erradas (breve)
3. **Base Legal** - Lei/artigo específico
4. **Dica Prática** - Macete de memorização

FORMATO:
- Use markdown limpo
- Negrito apenas em termos-chave
- Máximo 400 palavras
- Priorize clareza sobre detalhes`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.6,
      max_tokens: 600,
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

function buildExplanationPrompt(context: ExplanationContext): string {
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

// Função para chat interativo
export async function chatAboutQuestion(
  questionId: string,
  userId: string,
  message: string,
  chatHistory: { role: string; content: string }[]
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
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `Você é um tutor especializado em Direito e preparação para OAB.

Você está ajudando um estudante com dúvidas sobre uma questão específica.

Contexto da questão:
**Matéria:** ${question.subject}
**Ano:** ${question.examYear}
**Enunciado:** ${question.statement}
**Alternativas:**
${question.alternatives.map((a) => `${a.label}) ${a.text}`).join("\n")}
**Correta:** ${question.alternatives.find((a) => a.isCorrect)?.label}

Responda de forma didática, clara e objetiva. Use exemplos práticos quando possível.`,
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
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
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
