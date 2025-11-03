# ✅ CORREÇÃO: Questões Recomendadas Abrindo Aleatórias

**Data:** 02/11/2025
**Tempo:** 15min
**Status:** ✅ CORRIGIDO

---

## 🐛 PROBLEMA REPORTADO

**Feedback do usuário:**
> "to fazendo o teste e no review tem as questões recomendadas certo? quando clico em qualquer uma questão recomendada sempre aparece outra aleatória que não é a questão que foi recomendada pra mim"

**Comportamento esperado:** Clicar em questão recomendada → abrir AQUELA questão específica

**Comportamento atual:** Clicar em questão recomendada → abrir questão aleatória

---

## 🔍 CAUSA RAIZ

### 1. Link correto no Smart Review
O link em `/smart-review` estava **correto**:
```typescript
<Link href={`/practice?questionId=${question.id}`}>
  <Button>Responder</Button>
</Link>
```

### 2. Problema na página Practice
A página `/practice` **ignorava** o parâmetro `questionId` da URL:

```typescript
// ANTES (ERRADO) - linha 39 de practice-client.tsx
const loadNextQuestion = async () => {
  const response = await fetch('/api/questions/next?excludeAnswered=false');
  // SEMPRE buscava aleatória, nunca verificava questionId na URL
};
```

### 3. API não aceitava questionId
A API `/api/questions/next` não tinha suporte para buscar questão específica por ID.

---

## ✅ SOLUÇÃO IMPLEMENTADA

### 1. Modificada API `/api/questions/next`
**Arquivo:** `app/api/questions/next/route.ts`

**Mudança:** Adicionado suporte ao parâmetro `questionId` (linhas 31-63):

```typescript
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
    return NextResponse.json(
      { error: "Questão não encontrada" },
      { status: 404 }
    );
  }

  // Remover a resposta correta das alternativas
  const alternatives = question.alternatives.map(({ isCorrect, ...alt }) => alt);

  return NextResponse.json({
    ...question,
    alternatives,
  });
}

// Caso contrário, buscar questão aleatória (lógica existente)
```

---

### 2. Modificado Cliente de Prática
**Arquivo:** `app/practice/practice-client.tsx`

**Mudanças:**

#### A) Importado `useSearchParams` e `useRouter` (linhas 3-4):
```typescript
import { useSearchParams, useRouter } from 'next/navigation';
```

#### B) Leitura do `questionId` da URL (linhas 15-16, 39-66):
```typescript
export default function PracticeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // ...

  const loadNextQuestion = async (skipUrlClean = false) => {
    setLoading(true);

    // Verificar se há questionId na URL
    const questionId = searchParams.get('questionId');
    const url = questionId && !skipUrlClean
      ? `/api/questions/next?questionId=${questionId}`  // Busca específica
      : '/api/questions/next?excludeAnswered=false';    // Busca aleatória

    console.log('🔍 Buscando questão:', url);
    const response = await fetch(url);
    const data = await response.json();
    setQuestion(data);

    // Limpar questionId da URL após carregar questão específica
    if (questionId && !skipUrlClean) {
      router.replace('/practice', { scroll: false });
    }
  };
```

#### C) Atualizado botões para não reusar URL (linhas 199, 217):
```typescript
// Pular Questão → busca aleatória
<Button onClick={() => loadNextQuestion(true)}>
  Pular Questão
</Button>

// Próxima Questão → busca aleatória
<Button onClick={() => loadNextQuestion(true)}>
  Próxima Questão
</Button>
```

---

## 🧪 COMO TESTAR

### Teste 1: Questão Recomendada Específica

1. Acessar `/smart-review`
2. Ver lista de questões recomendadas
3. **Observar:** URL da questão tem formato `/practice?questionId=cm1abc123...`
4. Clicar em **"Responder"** em qualquer questão
5. **Esperado:**
   - Abre EXATAMENTE aquela questão (verificar enunciado)
   - Console mostra: `🎯 [API] Buscando questão específica: cm1abc123...`
   - URL muda para `/practice` (sem questionId) após carregar

---

### Teste 2: Próxima Questão Aleatória

1. Após abrir questão recomendada
2. Responder a questão
3. Clicar em **"Próxima Questão"**
4. **Esperado:**
   - Carrega questão ALEATÓRIA (diferente)
   - Console mostra: `🔍 Buscando questão: /api/questions/next?excludeAnswered=false`

---

### Teste 3: Pular Questão

1. Na questão recomendada (sem responder)
2. Clicar em **"Pular Questão"**
3. **Esperado:**
   - Carrega questão ALEATÓRIA
   - Não fica preso na mesma questão

---

## 📊 FLUXO CORRETO

```
Smart Review Page
  ↓
[Clicar em "Responder" na Questão #5]
  ↓
URL: /practice?questionId=cm1abc123
  ↓
PracticeClient lê searchParams
  ↓
Busca: /api/questions/next?questionId=cm1abc123
  ↓
API retorna questão específica #5
  ↓
URL limpa para: /practice
  ↓
[Usuário responde]
  ↓
[Clicar em "Próxima Questão"]
  ↓
Busca: /api/questions/next?excludeAnswered=false
  ↓
API retorna questão aleatória
```

---

## 🎯 RESULTADO

✅ **Questões recomendadas agora abrem EXATAMENTE a questão clicada**
✅ **URL é limpa automaticamente após carregar**
✅ **"Próxima Questão" busca aleatória (não repete)**
✅ **"Pular Questão" busca aleatória**

---

## 📝 ARQUIVOS MODIFICADOS

1. **`app/api/questions/next/route.ts`** (linhas 31-63)
   - Adicionado suporte a `questionId` via query param
   - Retorna questão específica se ID fornecido

2. **`app/practice/practice-client.tsx`** (linhas 3-4, 15-16, 39-72, 199, 217)
   - Importado `useSearchParams` e `useRouter`
   - Leitura do `questionId` da URL
   - Limpeza da URL após carregar questão específica
   - Parâmetro `skipUrlClean` para controlar quando buscar aleatória

---

## 🚀 STATUS

**IMPLEMENTADO E PRONTO PARA TESTES!**

Agora você pode testar clicando nas questões recomendadas e confirmar que abre a questão correta.

---

**Data de conclusão:** 02/11/2025
**Bugs corrigidos na Semana 2:** 7 (LoadingSpinner, Chat JSON, Limites 0, Porcentagens, UserQuestionChat, Questões Recomendadas + 1 anterior)
