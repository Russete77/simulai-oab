# Simulai OAB

Plataforma completa de preparação para o Exame da OAB com IA, simulados adaptativos e análise de desempenho.

## 🚀 Stack Tecnológica

- **Frontend**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: Supabase Auth
- **Validação**: Zod
- **Charts**: Recharts

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Supabase (gratuita)

## 🛠️ Setup do Projeto

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Supabase

1. Criar projeto em [supabase.com](https://supabase.com)
2. Copiar as credenciais do projeto

### 3. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

```env
# Database (Supabase Connection String)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Admin (para importação de dataset)
ADMIN_API_KEY="your-secret-key"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Criar schema do banco de dados

```bash
npm run db:push
```

### 5. Importar dataset do HuggingFace

Importar 5.605 questões reais da OAB (2010-2025):

```bash
npm run import:dataset
```

Ou via API (requer ADMIN_API_KEY):

```bash
curl -X POST http://localhost:3000/api/admin/import \
  -H "Content-Type: application/json" \
  -H "x-admin-key: your-secret-key" \
  -d '{
    "source": "huggingface",
    "dataset": "russ7/oab_exams_2011_2025_combined",
    "batchSize": 100
  }'
```

### 6. Iniciar servidor de desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
simulai-oab/
├── app/
│   ├── api/                    # API Routes
│   │   ├── questions/          # Endpoints de questões
│   │   │   ├── next/           # GET /api/questions/next
│   │   │   └── answer/         # POST /api/questions/answer
│   │   ├── simulations/        # Endpoints de simulados
│   │   │   ├── create/         # POST /api/simulations/create
│   │   │   └── finish/         # POST /api/simulations/finish
│   │   ├── analytics/          # Endpoints de analytics
│   │   │   └── dashboard/      # GET /api/analytics/dashboard
│   │   └── admin/              # Endpoints admin
│   │       └── import/         # POST /api/admin/import
│   └── (pages)/                # Páginas do app (será criado)
├── lib/
│   ├── db/                     # Database client
│   ├── supabase/               # Supabase clients
│   └── validations/            # Schemas Zod
├── types/
│   ├── dataset.ts              # Tipos do HuggingFace
│   └── api.ts                  # Tipos de API
├── prisma/
│   └── schema.prisma           # Schema do banco
└── scripts/
    └── import-dataset.ts       # Script de importação
```

## 🔑 API Endpoints

### Questões

#### GET /api/questions/next
Buscar próxima questão (com filtros opcionais)

```typescript
// Query params
{
  subject?: "ETHICS" | "CONSTITUTIONAL" | ...,
  difficulty?: "EASY" | "MEDIUM" | "HARD" | "VERY_HARD",
  excludeAnswered?: boolean
}
```

#### POST /api/questions/answer
Registrar resposta

```typescript
{
  questionId: string,
  alternativeId: string,
  timeSpent: number,
  confidence?: 1-5
}
```

### Simulados

#### POST /api/simulations/create
Criar novo simulado

```typescript
{
  type: "FULL_EXAM" | "ADAPTIVE" | "QUICK_PRACTICE" | "ERROR_REVIEW" | "BY_SUBJECT",
  subjects?: Subject[],
  targetDifficulty?: Difficulty,
  questionCount?: number
}
```

#### POST /api/simulations/finish
Finalizar simulado e gerar relatório

```typescript
{
  simulationId: string
}
```

### Analytics

#### GET /api/analytics/dashboard
Buscar analytics do usuário

Retorna: estatísticas gerais, performance por matéria, áreas fracas, predição de score, atividade recente

## 🗄️ Schema do Banco de Dados

### Principais Models

- **User**: Usuários do sistema
- **UserProfile**: Perfil e gamificação
- **Question**: Questões do exame
- **Alternative**: Alternativas das questões
- **UserAnswer**: Respostas dos usuários
- **Simulation**: Simulados
- **Achievement**: Conquistas
- **StudyPlan**: Planos de estudo

Ver `prisma/schema.prisma` para detalhes completos.

## 📊 Dataset

**Fonte**: [russ7/oab_exams_2011_2025_combined](https://huggingface.co/datasets/russ7/oab_exams_2011_2025_combined)

- **Período**: 2010-2025 (16 anos)
- **Total**: 5.605 questões reais
- **Formato**: Parquet (convertido para PostgreSQL)

### Estrutura do Dataset

```typescript
{
  id: "2023-01_15",
  question_number: 15,
  exam_id: "2023-01",
  exam_year: "2023",
  question_type: "CONSTITUTIONAL",
  nullified: false,
  question: "Enunciado...",
  choices: {
    label: ["A", "B", "C", "D"],
    text: ["Texto A", "Texto B", "Texto C", "Texto D"]
  },
  answerKey: 2  // Índice da resposta correta (0-3)
}
```

## 🎯 Próximos Passos

Agora que o backend está completo, você pode:

1. **Testar as APIs** com Postman/Insomnia
2. **Importar o dataset** completo
3. **Criar o frontend** (páginas, componentes, UI)
4. **Implementar autenticação** no frontend
5. **Adicionar funcionalidades** de gamificação

## 🔒 Autenticação

O sistema usa Supabase Auth. Para proteger rotas, use:

```typescript
import { requireAuth } from "@/lib/auth";

const user = await requireAuth(); // Lança erro se não autenticado
```

## 📝 Comandos Úteis

```bash
# Desenvolvimento
npm run dev                 # Iniciar dev server
npm run build              # Build para produção
npm run start              # Rodar produção

# Database
npm run db:push            # Sync schema com DB
npm run db:studio          # Abrir Prisma Studio
npm run db:generate        # Gerar Prisma Client

# Import
npm run import:dataset     # Importar questões OAB
```

## 📄 Licença

MIT

## 🤝 Contribuindo

PRs são bem-vindos! Veja o [PRD](./prd.txt) para detalhes do projeto.
