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

    // 3. Chamar OpenAI com configurações otimizadas
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
      temperature: 0.3, // Mais determinístico e rápido
      max_tokens: 500, // Reduzido para respostas mais concisas
      response_format: { type: "json_object" }, // Força retorno em JSON
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
    ? `\nResposta do usuário: ${context.userAnswer} ${
        context.userAnswer !== context.correctAnswer ? "(INCORRETA)" : "(CORRETA)"
      }`
    : "";

  const incorrectAlternatives = context.alternatives
    .filter(alt => !alt.isCorrect)
    .map(alt => `${alt.label}) ${alt.text}`)
    .join('\n');

  const correctAlt = context.alternatives.find(alt => alt.isCorrect);

  return `Questão de ${context.subject} - Exame OAB ${context.examYear}

ENUNCIADO:
${context.question}

ALTERNATIVA CORRETA: ${context.correctAnswer}) ${correctAlt?.text}

ALTERNATIVAS INCORRETAS:
${incorrectAlternatives}
${userAnswerInfo}

INSTRUÇÕES:
Retorne um JSON válido com esta estrutura EXATA (sem markdown, sem blocos de código, APENAS o JSON):
{
  "resumo": "1 frase objetiva sobre o tema principal",
  "correta": {
    "motivo": "Por que a alternativa ${context.correctAnswer} está correta (máximo 2 frases)",
    "baseLegal": "Artigo/Lei específica (ex: Art. 5º, CF/88)"
  },
  "incorretas": [
    {"alternativa": "A", "motivo": "Motivo breve (1 frase)"},
    {"alternativa": "B", "motivo": "Motivo breve (1 frase)"}
  ],
  "dica": "Macete ou analogia simples para memorizar (1 frase curta)",
  "pegadinhas": ["Cuidado com X", "Não confundir Y com Z"]
}

IMPORTANTE:
- Seja CONCISO e DIRETO
- Use linguagem simples
- Máximo 2 frases por campo
- Retorne APENAS o JSON, sem \`\`\`json ou qualquer outra formatação`;
}

function getSystemPromptForStyle(style: 'professor' | 'concise' | 'chat', subject?: string) {
  // Para CHAT: retorna prompt conversacional (texto natural)
  if (style === 'chat') {
    return `Você é um professor especialista em ${subject || 'Direito brasileiro'} preparando candidatos para a OAB.

Sua tarefa é responder dúvidas de forma DIDÁTICA, CONVERSACIONAL e OBJETIVA.

DIRETRIZES:
- Responda em TEXTO NATURAL (não em JSON)
- Seja CLARO e DIDÁTICO como um professor explicando para um aluno
- Use ANALOGIAS e EXEMPLOS quando ajudar a entender
- Seja CONCISO: vá direto ao ponto, evite rodeios
- Use linguagem SIMPLES, evite jargão jurídico desnecessário
- Quando relevante, cite ARTIGOS DE LEI específicos
- Se o aluno errou algo, corrija de forma gentil e educativa

FORMATO DA RESPOSTA:
- Use parágrafos curtos (2-3 linhas)
- Use tópicos quando listar informações
- Destaque pontos importantes com ênfase natural
- Seja amigável e encorajador

Exemplo de BOA resposta:
"A alternativa C está incorreta porque confunde competência originária com recursal. O STF só julga originariamente nos casos do Art. 102, I da CF/88, e este não se encaixa.

O correto seria a alternativa B, pois trata de competência do STJ (Art. 105, I). A pegadinha aqui é trocar STF por STJ.

Dica: STF = Constituição | STJ = Leis Federais"`;
  }

  // Para EXPLICAÇÕES: retorna prompt para JSON estruturado
  return `Você é um professor especialista em ${subject || 'Direito brasileiro'} preparando candidatos para a OAB.

Sua tarefa é explicar questões de forma DIDÁTICA e OBJETIVA, retornando um JSON estruturado.

DIRETRIZES:
- Seja CONCISO: máximo 2 frases por campo
- Use linguagem SIMPLES e CLARA
- Foque no ESSENCIAL para o aluno entender e memorizar
- Evite jargão jurídico desnecessário
- Crie dicas PRÁTICAS de memorização
- Identifique pegadinhas COMUNS que o examinador usa

IMPORTANTE: Retorne APENAS JSON válido, sem formatação markdown ou blocos de código.`;
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
        content: `${system}

⚠️ IMPORTANTE: Você DEVE responder APENAS sobre a questão fornecida abaixo.

Contexto da questão:
**Matéria:** ${question.subject}
**Ano:** ${question.examYear}
**Enunciado:** ${question.statement}
**Alternativas:**
${question.alternatives.map((a) => `${a.label}) ${a.text}`).join("\n")}
**Correta:** ${question.alternatives.find((a) => a.isCorrect)?.label}

🚫 REGRAS OBRIGATÓRIAS:
1. Se a pergunta do usuário NÃO estiver relacionada à questão OAB acima, responda APENAS:
   "Desculpe, posso ajudar apenas com dúvidas sobre esta questão específica da OAB. Por favor, faça uma pergunta relacionada ao conteúdo jurídico desta questão."

2. NÃO responda sobre:
   - Assuntos gerais não relacionados à questão
   - Programação, tecnologia, receitas, ou outros temas
   - Questões pessoais ou de outros exames
   - Qualquer tema fora do escopo jurídico desta questão específica

3. APENAS responda se a pergunta for sobre:
   - Conceitos jurídicos desta questão
   - Legislação aplicável à questão
   - Explicação das alternativas
   - Exemplos práticos relacionados ao tema jurídico da questão
   - Dúvidas sobre a matéria específica (${question.subject})

Responda de forma didática, clara e objetiva quando a pergunta for válida.`,
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

