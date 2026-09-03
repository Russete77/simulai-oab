# Auditoria SIMULAI OAB — 25/08/2026

Branch `onda-7-fala-como-gente` · commit `ef35241`

## Números do projeto

| | |
|---|---|
| Código | 38.447 linhas (TS/TSX) · 264 arquivos |
| Páginas | 55 |
| Rotas de API | 54 |
| Models no banco | 26 models + 13 enums (909 linhas de schema) |
| TypeScript | ✅ limpo (`tsc --noEmit` passa) |
| Testes | 3 arquivos · 28 testes · ~~8 falhando~~ → **28/28 verde** |
| Vulnerabilidades | ~~10 high~~ → **5** em produção (todas via `next`, exigem o upgrade breaking) |

---

## Estado da Fase 1 (executada em 25/08)

| Item | Antes | Depois |
|---|---|---|
| Worktrees zumbis | 21 · `npm test` varria 22 cópias e reportava "616 testes / 176 falhas" | **19 removidas** + `exclude: ['**/.claude/**']` no vitest. Suíte reporta 28 testes reais |
| Testes | 8 falhando | **28/28 passando** |
| Validação de env | rodava mas só logava · exigia 2 variáveis inexistentes | quebra o **build** se faltar obrigatória · nunca lança em runtime · avisa sobre config meio-feita |
| Código morto | 2.020 linhas estimadas | **1.928 removidas** (a diferença é o `env.ts`, que estava vivo — ver item 2) |
| Vulnerabilidades | 10 high em produção | **5** · `socket.io-parser` resolvido · os 2 críticos restantes são `vitest`/`@vitest/coverage-v8`, só dev |

Duas worktrees não puderam ser removidas do disco (`Device or resource busy`) — `happy-cerf-a9f7b6` e `unruffled-benz-42f348`. Já saíram do registro do git e o `exclude` do vitest as ignora, então não atrapalham mais. Podem ser apagadas manualmente quando nenhum processo estiver segurando os arquivos.

---

## P0 — Resolver antes de qualquer coisa

### 1. Dados de cartão em texto puro no nosso servidor
`app/checkout/[priceId]/page.tsx:115-119` coleta número, CCV, validade e titular e envia por `POST` para `app/api/billing/subscribe/route.ts`, que repassa ao Asaas.

Isso coloca o projeto em **PCI DSS SAQ D** — o nível mais pesado de conformidade — e é a maior exposição jurídica do produto hoje. Em caso de incidente, a responsabilidade é nossa.

**Resolve sozinho na migração pro Stripe Checkout.** É o argumento mais forte a favor da migração.

### 2. A validação de ambiente roda, mas não protege nada — ✅ CORRIGIDO

> **Correção do relatório original.** A primeira versão deste item afirmava que `lib/env.ts` era código morto. **Estava errado** — ele é importado por `instrumentation.ts`, arquivo da raiz que ficou fora da busca inicial. O problema real era outro, descrito abaixo.

`instrumentation.ts` roda uma vez por instância de servidor e importa `lib/env.ts`. Mas depois do commit `97c59c0` ("validacao de env nunca mais derruba o site inteiro") a validação passou a **apenas logar no console** e seguir. Em produção isso vira uma linha de log que ninguém lê.

O motivo daquele commit era legítimo: se `instrumentation.ts` lança, a instância inteira fica inutilizável — **toda rota**, não só a que usa a variável faltante. Foi o que derrubou a produção.

Agravante: o schema exigia `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`, que **não são usadas em lugar nenhum do código**. Ou seja, a validação provavelmente falhava em todo boot, e esse ruído mascarava qualquer erro real.

**Correção aplicada** — validação em duas camadas:
- **Build:** `assertEnvOrThrow()` é chamado pelo `next.config.ts` apenas em `PHASE_PRODUCTION_BUILD`. Falta variável obrigatória → o build quebra e nada mal configurado chega em produção.
- **Runtime:** continua sem lançar nunca. Ganhou `checkRuntimeWarnings()`, que avisa no boot sobre configuração meio-feita que falha em silêncio: rate limit desligado, paywall desligado, e-mail sem chave.
- Variáveis fantasma do Supabase removidas; `UPSTASH_*`, `RESEND_FROM_EMAIL`, `OPENAI_MONTHLY_BUDGET_USD` e as de acesso gratuito passaram a ser reconhecidas.

### 3. 8 testes falhando
`__tests__/webhooks/asaas-webhook.test.ts` — assertivas esperam `logger.warn(string, objeto)` mas o código chama `logger.warn(string)`. São testes desatualizados em relação ao código, não bugs de produção. Mas com 28 testes no total, uma suíte vermelha significa que ninguém roda teste aqui.

### 4. 21 git worktrees zumbis dentro do repo
```
.claude/worktrees/agent-a0492e4e50deb88d3
.claude/worktrees/agent-a20a7caeed9338d06
... (21 no total, todas em ef35241)
```
Efeito concreto: `npm test` varre **22 cópias** do projeto. A suíte reporta "616 testes, 176 falhando" quando na verdade são 28 testes e 8 falhas — o mesmo conjunto multiplicado por 22. Além de lentidão e disco, é ruído que esconde o estado real.

Correção: `git worktree remove` em cada uma (ou `git worktree prune` nas já órfãs) + `exclude` no vitest.

### 5. 10 vulnerabilidades high
- `sharp` < 0.35.0 → CVEs do libvips (CVE-2026-33327/33328/35590/35591), via `next`
- `socket.io-parser` 4.0.0–4.2.6 → exaustão de memória
- `postcss`, via `next`

A correção completa exige `next@16.3.2` (breaking). O `socket.io-parser` corrige com `npm audit fix` simples.

---

## P1 — Custa dinheiro ou atrapalha o corte

### 6. 2.020 linhas de código morto
Verificado arquivo por arquivo, com busca em todo o repositório:

| Arquivo | Linhas |
|---|---|
| `lib/services/simulation-service.ts` | 543 |
| `lib/services/question-service.ts` | 471 |
| `lib/services/leaderboard-service.ts` | 294 |
| `lib/gamification/stats.ts` | 196 |
| `components/achievements/achievement-modal.tsx` | 99 |
| `lib/constants/gamification.ts` | 99 |
| `lib/env.ts` | 92 |
| `components/ui/toast.tsx` | 88 |
| `components/billing/paywall-overlay.tsx` | 106 |
| `components/billing/free-notice-banner.tsx` | 32 |
| **Total** | **2.020** |

Detalhe irônico: a lógica de gate/paywall mais elaborada do projeto está justamente nos `services` mortos.

### 7. Três features de "revisão" competindo entre si

| Página | API que consome |
|---|---|
| `/revisao-inteligente` | `/api/review/smart`, `/api/review/srs` |
| `/smart-review` | `/api/questions/recommended` |
| `/review` | `/api/review/wrong-questions` |

Três caminhos, três APIs, mesmo objetivo. Isso divide o uso e faz qualquer métrica de "revisão" parecer baixa. **Uma sobrevive.**

### 8. `/flashcards` não é flashcard
`app/flashcards/flashcards-client.tsx` (312 linhas) faz uma única chamada: `/api/questions/next`. Não usa `ReviewCard`, não tem repetição espaçada, não guarda estado. É a lista de questões com outra roupa. 384 linhas para uma feature que já existe em `/practice`.

### 9. IA ilimitada é insustentável a R$ 9,99
`lib/billing/limits.ts`: plano PRO tem `dailyAiExplanations: Infinity` e `dailyAiChats: Infinity`. Modelo `gpt-4o-mini`.

Com plano único barato, sem teto por usuário isso é exposição aberta. Existe `lib/ai/cost-guard.ts` com `OPENAI_MONTHLY_BUDGET_USD`, mas é um teto **global** — um único usuário abusando consome o orçamento de todos.

### 10. Rate limit em 3 de 54 rotas, e com fail-open
Aplicado só em `questions/[id]/explain`, `questions/answer`, `simulations/create`.

E `lib/rate-limit.ts` **desliga sozinho** se `UPSTASH_REDIS_REST_URL`/`TOKEN` não estiverem configurados — em produção loga um warning e segue sem limite nenhum. Combinado com o item 2 (sem validação de env), ninguém garante que o rate limit está ligado em produção agora.

### 11. `UserSession.ipAddress` sem retenção definida
Grava IP, país, cidade e user-agent por sessão, sem TTL nem política de expurgo. É dado pessoal sob LGPD acumulando indefinidamente.

### 12. 48 `console.log` em código de produção
Incluindo `app/api/questions/[id]/chat/route.ts` e `app/api/webhooks/clerk/route.ts`. Existe um `lib/logger.ts` estruturado que deveria ser usado.

---

## P2 — Anotado, não urgente

- **Middleware redireciona API para `/login`.** `middleware.ts` faz `NextResponse.redirect` para toda rota não-pública sem sessão, inclusive `/api/*`. O front recebe um HTML de login com status 200 em vez de 401 — erro difícil de debugar no cliente.
- **`/api/cron/expire-trials`** é um stub deprecado ainda registrado. Remover o diretório.
- **`vercel.json`** tem cron para `reconcile-asaas` — quebra na migração.
- **`app/blog/[slug]/page.tsx:156`** usa `dangerouslySetInnerHTML` com `post.content`. O conteúdo vem de `content/blog` (nosso, versionado), então o risco é baixo — mas o padrão não deve encostar em nada que venha de usuário.
- **`/api/profile/[userId]`** não checa quem pergunta. Só expõe nome, pontos e conquistas (sem e-mail), e o middleware exige sessão, mas permite enumerar usuários.

---

## O que está bem feito

Vale registrar, porque muda o esforço de migração:

- **Autenticação de cron é fail-close e consistente.** Todos os 5 crons ativos exigem `Bearer ${CRON_SECRET}` e rejeitam se o segredo não estiver configurado.
- **Autorização de admin é sessão Clerk + `ADMIN_EMAILS`**, não API key estática. `admin/import` valida antes de ler o body.
- **Webhook do Asaas está bem construído:** loga antes de processar, idempotência por `eventId`, sempre retorna 200. Esse desenho serve igual pro Stripe — é reaproveitável quase inteiro.
- **TypeScript limpo** em 38 mil linhas.
- **Índices do Prisma são bem pensados** — inclusive compostos para as queries pesadas.

---

## Simplificação — mapa das features

O corte precisa sair de dado, não de impressão. O SQL em `_PLANO-CLAUDE/sql/01-uso-real-features.sql` mede exatamente isso.

**Núcleo que você definiu (fica):**
- Responder questões — `/practice`, `/questoes/[id]`, `UserAnswer`
- Selecionar matérias — `/materias/[slug]`, enum `Subject`
- Plano de estudos — `/plano-estudos`, `StudyPlan`

**Decisão pendente (o SQL responde):**
- Simulados — `/simulations`, `Simulation` · é o nome do produto, mas você não citou no núcleo
- Revisão espaçada — `ReviewCard` · das três páginas de revisão, no máximo uma sobrevive
- IA (explicação e chat) — define o custo do plano de R$ 9,99

**Candidatos fortes a corte:**
- `/flashcards` — não é feature, é re-skin (item 8)
- Desafio entre amigos — `FriendChallenge`, 3 páginas + API · **recém-construído** (commits `ef35241`, `27c82ee`, `b13b9c2`), então o SQL vai mostrar pouco uso por ser novo, não por ser ruim
- Gamificação — `Achievement`, `UserAchievement`, `/leaderboard`, `/perfil`
- Máquina de notificações — `Notification`, `NotificationCampaign`, `NotificationPreference`, `PushSubscription`, `EmailCampaign`, 3 crons, 6 rotas de API, páginas de admin. É o maior subsistema do projeto por linha de código.

**Não confundir com feature:** as páginas de SEO (`/gabarito`, `/questoes-oab`, `/blog`, `/simulado-oab-online`, `/proxima-prova-oab`, `/como-funciona`) são aquisição, não uso. Cortá-las derruba tráfego orgânico. Elas ficam.

---

## Precisa da sua confirmação

1. **`ENABLE_FREE_ACCESS_MODE` está ligado em produção agora?** Se estiver, `gate.ts` libera acesso PREMIUM pra base inteira e nenhum paywall existe. Não tenho acesso ao painel da Vercel pra verificar.
2. **`UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` estão configurados em produção?** Sem eles, rate limit está desligado (item 10).
3. **O plano de R$ 9,99 é R$ 9,99/mês cobrado uma vez por ano (R$ 119,88), ou R$ 9,99 uma vez por ano?**
