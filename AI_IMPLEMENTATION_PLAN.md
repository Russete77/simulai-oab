# 🤖 Plano de Implementação - IA para Explicações

## 1. ARQUITETURA PROPOSTA

### Opções de IA para Considerar:

#### **OPÇÃO A: OpenAI GPT-4 / Claude (Recomendado)** ⭐
**Prós:**
- Qualidade superior nas explicações
- Entende contexto jurídico profundamente
- API simples e confiável
- Streaming de respostas (UX melhor)
- Pode gerar explicações + tirar dúvidas

**Contras:**
- Custo por requisição (~$0.01-0.03 por explicação)
- Latência de 2-5 segundos
- Dependência de serviço externo

**Custo Estimado:**
- 1000 explicações/dia = ~$10-30/dia
- Com cache inteligente: ~$5-15/dia

#### **OPÇÃO B: Llama 3 / Mixtral (Self-hosted)**
**Prós:**
- Custo fixo (infraestrutura)
- Privacidade total
- Sem limites de rate

**Contras:**
- Precisa GPU (~$100-300/mês)
- Manutenção complexa
- Qualidade inferior para contexto jurídico

#### **OPÇÃO C: Hybrid (Melhor Custo-Benefício)** ⭐⭐⭐
**Estratégia:**
1. **Cache Redis** - Armazenar explicações já geradas
2. **GPT-4o-mini** - Gerar novas explicações (mais barato)
3. **Fallback** - Explicação genérica se falhar

**Custo Estimado:**
- 80% hit rate no cache = $2-5/dia
- Escalável e confiável

---

## 2. ARQUITETURA TÉCNICA RECOMENDADA

### Stack:
```typescript
// Backend
- OpenAI API (gpt-4o-mini) ou Anthropic Claude
- Redis para cache de explicações
- Queue (BullMQ) para processar em background
- Rate limiting por usuário

// Frontend
- Streaming de resposta (real-time)
- Loading states elegantes
- Opção de "pedir mais detalhes"
- Chat interface para dúvidas
```

### Fluxo:

```
1. Usuário responde questão
   ↓
2. Frontend solicita explicação
   ↓
3. Backend verifica cache (Redis)
   ↓
4a. SE cache HIT → Retorna imediatamente
4b. SE cache MISS → Chama IA
   ↓
5. IA gera explicação contextualizada
   ↓
6. Salva no cache + retorna (streaming)
   ↓
7. [OPCIONAL] Usuário pode fazer pergunta adicional
```

---

## 3. SCHEMA DO BANCO DE DADOS

### Adicionar ao Prisma:

```prisma
model QuestionExplanation {
  id             String   @id @default(cuid())
  questionId     String   @unique

  // Explicação gerada pela IA
  explanation    String   @db.Text
  detailedAnswer String   @db.Text

  // Referências legais identificadas
  legalReferences Json?

  // Metadados
  generatedBy    String   // "openai", "claude", "manual"
  generatedAt    DateTime @default(now())
  qualityScore   Float?   // 0-1 (baseado em feedback)

  // Relações
  question       Question @relation(fields: [questionId], references: [id])

  @@index([questionId])
}

model UserQuestionChat {
  id          String   @id @default(cuid())
  userId      String
  questionId  String

  // Conversa
  messages    Json     // [{role: "user"|"assistant", content: string}]

  // Metadados
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id])
  question    Question @relation(fields: [questionId], references: [id])

  @@index([userId, questionId])
}
```

---

## 4. IMPLEMENTAÇÃO BACKEND

### 4.1 Serviço de IA

```typescript
// lib/ai/explanation-service.ts

import OpenAI from "openai";
import { redis } from "@/lib/redis";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ExplanationContext {
  question: string;
  alternatives: { label: string; text: string; isCorrect: boolean }[];
  userAnswer: string;
  correctAnswer: string;
  subject: string;
  examYear: number;
}

export async function generateExplanation(
  context: ExplanationContext
): Promise<string> {
  // 1. Verificar cache
  const cacheKey = `explanation:${context.questionId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  // 2. Preparar prompt
  const prompt = buildExplanationPrompt(context);

  // 3. Chamar IA
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Mais barato, boa qualidade
    messages: [
      {
        role: "system",
        content: `Você é um professor especialista em Direito brasileiro,
        focado em preparar candidatos para o Exame da OAB.
        Explique de forma didática, clara e baseada em legislação.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 800,
  });

  const explanation = response.choices[0].message.content;

  // 4. Salvar no cache (30 dias)
  await redis.setex(cacheKey, 30 * 24 * 60 * 60, explanation);

  // 5. Salvar no banco (opcional, para análise)
  await prisma.questionExplanation.create({
    data: {
      questionId: context.questionId,
      explanation,
      generatedBy: "openai",
    },
  });

  return explanation;
}

function buildExplanationPrompt(context: ExplanationContext): string {
  return `
# Questão OAB - ${context.subject}

**Enunciado:**
${context.question}

**Alternativas:**
${context.alternatives.map(alt =>
  `${alt.label}) ${alt.text} ${alt.isCorrect ? '✓ (CORRETA)' : ''}`
).join('\n')}

**Resposta do usuário:** ${context.userAnswer}
**Resposta correta:** ${context.correctAnswer}

---

**Tarefa:**
1. Explique por que a alternativa correta está certa
2. Explique por que as outras alternativas estão erradas
3. Cite a legislação relevante (lei, artigo, parágrafo)
4. Dê uma dica de memorização ou raciocínio
5. Use linguagem didática e acessível

**Formato da resposta:**
- Use markdown
- Seja conciso mas completo
- Priorize o entendimento do conceito
`;
}
```

### 4.2 API Endpoint

```typescript
// app/api/questions/[id]/explain/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { generateExplanation } from "@/lib/ai/explanation-service";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Buscar questão e resposta do usuário
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        alternatives: true,
        answers: {
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Questão não encontrada" },
        { status: 404 }
      );
    }

    const userAnswer = question.answers[0];
    if (!userAnswer) {
      return NextResponse.json(
        { error: "Você precisa responder a questão primeiro" },
        { status: 400 }
      );
    }

    // Gerar explicação
    const explanation = await generateExplanation({
      questionId: question.id,
      question: question.statement,
      alternatives: question.alternatives,
      userAnswer: question.alternatives.find(
        (a) => a.id === userAnswer.alternativeId
      )?.label || "",
      correctAnswer:
        question.alternatives.find((a) => a.isCorrect)?.label || "",
      subject: question.subject,
      examYear: question.examYear,
    });

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Error generating explanation:", error);
    return NextResponse.json(
      { error: "Erro ao gerar explicação" },
      { status: 500 }
    );
  }
}
```

### 4.3 Chat com IA (Dúvidas Adicionais)

```typescript
// app/api/questions/[id]/chat/route.ts

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { message, chatHistory } = await request.json();

    const question = await prisma.question.findUnique({
      where: { id },
      include: { alternatives: true },
    });

    // Construir contexto com histórico
    const messages = [
      {
        role: "system",
        content: `Você é um tutor de Direito especializado em OAB.
        Responda dúvidas sobre a questão de forma didática.`,
      },
      {
        role: "assistant",
        content: `Questão: ${question.statement}\n\nAlternativas:\n${question.alternatives.map(a => `${a.label}) ${a.text}`).join('\n')}`,
      },
      ...chatHistory,
      { role: "user", content: message },
    ];

    // Stream da resposta
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      stream: true,
    });

    // Retornar como Server-Sent Events
    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            controller.enqueue(new TextEncoder().encode(text));
          }
          controller.close();
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Erro no chat" }, { status: 500 });
  }
}
```

---

## 5. IMPLEMENTAÇÃO FRONTEND

### 5.1 Hook para Explicação

```typescript
// hooks/use-explanation.ts

import { useState } from "react";

export function useExplanation(questionId: string) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExplanation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/questions/${questionId}/explain`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Falha ao carregar explicação");

      const data = await response.json();
      setExplanation(data.explanation);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { explanation, loading, error, fetchExplanation };
}
```

### 5.2 Componente de Explicação

```typescript
// components/question-explanation.tsx

import { useState } from "react";
import { useExplanation } from "@/hooks/use-explanation";
import { Card, Button } from "@/components/ui";
import { Sparkles, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface QuestionExplanationProps {
  questionId: string;
  onOpenChat: () => void;
}

export function QuestionExplanation({
  questionId,
  onOpenChat,
}: QuestionExplanationProps) {
  const { explanation, loading, error, fetchExplanation } =
    useExplanation(questionId);
  const [expanded, setExpanded] = useState(false);

  if (!explanation && !loading) {
    return (
      <Card variant="glass" className="mt-6">
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Quer entender melhor?
          </h3>
          <p className="text-navy-400 mb-4">
            Nossa IA vai explicar detalhadamente essa questão
          </p>
          <Button variant="primary" onClick={fetchExplanation}>
            Gerar Explicação com IA
          </Button>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card variant="glass" className="mt-6 p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <p className="text-white">Gerando explicação...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="glass" className="mt-6 p-6 border-red-500/20">
        <p className="text-red-400">Erro ao gerar explicação: {error}</p>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="mt-6">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">
              Explicação Detalhada
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenChat}
            className="flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Tirar Dúvidas
          </Button>
        </div>

        <div
          className={`prose prose-invert prose-blue max-w-none ${
            !expanded && "max-h-48 overflow-hidden relative"
          }`}
        >
          <ReactMarkdown>{explanation}</ReactMarkdown>
          {!expanded && (
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-navy-900 to-transparent" />
          )}
        </div>

        {!expanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(true)}
            className="mt-4 w-full"
          >
            Ver Explicação Completa
          </Button>
        )}
      </div>
    </Card>
  );
}
```

### 5.3 Chat Component (Modal)

```typescript
// components/question-chat.tsx

import { useState, useRef, useEffect } from "react";
import { Card, Button, Input } from "@/components/ui";
import { Send, X } from "lucide-react";

export function QuestionChat({ questionId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`/api/questions/${questionId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          chatHistory: messages,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        aiResponse += chunk;

        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.role === "assistant") {
            return [
              ...prev.slice(0, -1),
              { role: "assistant", content: aiResponse },
            ];
          }
          return [...prev, { role: "assistant", content: aiResponse }];
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card variant="glass" className="w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-navy-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            💬 Tire suas dúvidas
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-navy-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-navy-800 text-white"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-navy-700">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Digite sua dúvida..."
              disabled={loading}
            />
            <Button
              variant="primary"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

---

## 6. CUSTOS E VIABILIDADE

### Modelo Hybrid (Recomendado):

**Custos Mensais Estimados:**
- OpenAI API: $50-150/mês (10k-30k explicações)
- Redis Cache (Upstash): $10/mês
- **TOTAL: ~$60-160/mês**

**Com 1000 usuários ativos:**
- $0.06-0.16 por usuário/mês
- Altamente viável!

### Otimizações:
1. **Cache agressivo** (30+ dias)
2. **Pré-gerar** explicações das top 1000 questões
3. **Rate limiting**: 10 explicações/dia free, ilimitado PRO
4. **Batch processing**: Gerar explicações em background

---

## 7. ROADMAP DE IMPLEMENTAÇÃO

### **Fase 1: Básico** (3-5 dias)
- [ ] Configurar OpenAI API
- [ ] Criar serviço de explicação com cache
- [ ] API endpoint básica
- [ ] Componente de explicação no frontend
- [ ] Testes com 100 questões

### **Fase 2: Chat** (2-3 dias)
- [ ] Implementar endpoint de chat
- [ ] Component de chat modal
- [ ] Streaming de respostas
- [ ] Histórico de conversas

### **Fase 3: Otimizações** (2-3 dias)
- [ ] Pré-gerar explicações populares
- [ ] Analytics de uso
- [ ] A/B testing de prompts
- [ ] Feedback de qualidade

---

## 8. VARIÁVEIS DE AMBIENTE

```env
# .env
OPENAI_API_KEY=sk-...
REDIS_URL=redis://...

# Configurações
AI_EXPLANATION_MODEL=gpt-4o-mini
AI_CACHE_TTL_DAYS=30
AI_RATE_LIMIT_FREE=10
AI_RATE_LIMIT_PRO=unlimited
```

---

## 🎯 CONCLUSÃO

**Recomendação Final:**

✅ **Implementar Hybrid Model com OpenAI GPT-4o-mini**

**Benefícios:**
- Custo acessível (~$100/mês)
- Qualidade excelente para contexto jurídico
- Escalável
- Diferencial competitivo ENORME
- Possibilita chat interativo

**Próximo Passo:**
Implementar Fase 1 (básico) primeiro e validar com usuários beta antes de adicionar chat.

---

Quer que eu comece a implementar? Podemos começar pela Fase 1!
