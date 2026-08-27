# Plano de execução — SIMULAI OAB

**Decisões travadas:** plano único **R$ 9,99/mês**, cobrança recorrente **só cartão**, gateway **Stripe**, app enxugado para o núcleo.

**Núcleo corrigido pelo dado de uso (25/08):** simulados · responder questões · selecionar matérias.
O plano de estudos saiu do núcleo — teve **1 usuário em 30 dias (0,3% dos ativos)**. Simulados entrou — **80,3%**.

**Regra de ouro deste plano:** nada é deletado antes do backup e antes do dado de uso chegar.

---

## Onde estamos

| Frente | Estado |
|---|---|
| Banco | Supabase `jtgoxjpnrlxbvhfbltuc` (sa-east-1), **no limite do free**, em conta separada da conectada aqui |
| Pagamento | Asaas (PIX + boleto + cartão), 2 planos (R$ 19,99 / R$ 89,99) |
| Código | 38.447 linhas · 55 páginas · 54 APIs · 2.020 linhas mortas |
| Testes | 8 falhando de 28 |
| Segurança | Cartão em texto puro no nosso servidor · env sem validação · rate limit fail-open |
| Base | 1.036 cadastrados · 309 ativos/30d · 72 ativos/7d · **410 nunca voltaram** |
| Assinantes | **11 ACTIVE** contra **419 INCOMPLETE** · 12 PAST_DUE |
| Retenção | mediana de **16 questões/30d**, p90 = 20 → padrão de "fez o diagnóstico e sumiu" |
| ⚠️ Risco | **6 chargebacks + 6 estornos contra 8 pagamentos recebidos em 30 dias** |

---

## FASE 0 — Destravar o banco (bloqueia todo o resto)

O banco estar no teto é o único risco **ativo** hoje: se for limite de escrita, o app já pode estar perdendo dado.

**0.1 — Descobrir a causa antes de criar qualquer coisa**
Rodar `_PLANO-CLAUDE/sql/02-diagnostico-banco.sql`. Os blocos 1 a 4 respondem a pergunta certa:

- **Perto de 500 MB** → é espaço. Segue para 0.2.
- **Bem abaixo de 500 MB** → é **egress** (tráfego, 5 GB/mês). **Banco novo não resolve nada** — o problema é volume de queries, e a saída é cache/otimização ou plano pago.

**0.2 — Tentar resolver sem migrar (caminho rápido)**
Os suspeitos são log, não produto:
- `WebhookLog` guarda o JSON inteiro de todo evento do Asaas, desde sempre
- `UserSession` grava uma linha por sessão com IP, cidade e user-agent (e ainda resolve o item de LGPD da auditoria)
- `Notification` acumula uma linha por usuário por notificação

Expurgo com retenção de 30 dias + `VACUUM FULL` nessas três pode devolver espaço suficiente. Some-se a isso a **Fase 2**, que derruba tabelas inteiras.

Se resolver, a migração some do plano.

**0.3 — Se precisar migrar mesmo**
A migração é simples porque **o projeto não usa Supabase Auth nem Storage** — autenticação é Clerk, e as únicas tabelas são as do Prisma no schema `public`. É um Postgres comum:

```bash
pg_dump "$DIRECT_URL_ANTIGO" --schema=public --no-owner --no-privileges -Fc -f simulai.dump
```

```bash
pg_restore -d "$DIRECT_URL_NOVO" --no-owner --no-privileges --no-comments simulai.dump
```

Pontos de atenção:
- Usar a **DIRECT_URL** (porta 5432, `db.xxx.supabase.co`) nos dois lados — o pooler (6543) não serve para dump/restore
- O `pg_dump` local precisa ser ≥ à versão do servidor
- Criar o projeto novo na **mesma região (sa-east-1)** — latência do Vercel pro banco
- Rodar `ANALYZE;` no banco novo depois do restore
- Trocar `DATABASE_URL` e `DIRECT_URL` na Vercel, redeployar, **conferir**, e só então mexer no projeto antigo
- **Não apagar o projeto antigo** até a Fase 5 fechar

**0.4 — Confirmar as duas variáveis de produção**
- `ENABLE_FREE_ACCESS_MODE` — se estiver `true`, não existe paywall hoje e toda leitura de receita está errada
- `UPSTASH_REDIS_REST_URL` / `_TOKEN` — sem elas o rate limit está desligado e as rotas de IA estão abertas

---

## FASE 1 — Higiene (pode rodar em paralelo com a 0)

**1.1** Remover os 21 worktrees zumbis e blindar o vitest
```bash
git worktree list | grep worktrees | awk '{print $1}' | xargs -n1 git worktree remove --force
```
Depois `git worktree prune` e adicionar `exclude: ['**/.claude/**']` na config do vitest.

**1.2** Consertar os 8 testes de `__tests__/webhooks/asaas-webhook.test.ts` — são assertivas desatualizadas (`logger.warn(string, objeto)` vs `logger.warn(string)`), não bug de produção. *Nota: esses testes morrem na Fase 3 junto com o Asaas — só vale consertar o que for virar teste do Stripe.*

**1.3** Religar a validação de ambiente: reescrever `lib/env.ts` sem as variáveis do Supabase que não existem, e importá-lo de fato (hoje ele é código morto).

**1.4** `npm audit fix` para o `socket.io-parser`. O `next@16` fica para depois — é breaking e não se mistura com esta entrega.

**1.5** Deletar as 2.020 linhas mortas listadas na auditoria.

---

## FASE 2 — Corte de features

Dado de uso medido em 25/08/2026 sobre **309 usuários ativos em 30 dias**.

> ### ✅ Executada em 25/08 (código apenas — schema intocado)
>
> | | Antes | Depois |
> |---|---|---|
> | Linhas (app+components+lib+hooks) | 38.447 | **29.702** (−22,7%) |
> | Páginas | 55 | **45** |
> | Rotas de API | 54 | **36** |
> | Crons | 5 | **2** |
>
> **6.786 linhas cortadas nesta fase**, além das 1.928 de código morto da Fase 1. Total da sessão: 61 arquivos deletados, 9.280 remoções.
> Verificado a cada passo: `tsc --noEmit` limpo · 28/28 testes · `npm run build` exit 0 (383 páginas geradas).
>
> **Verificado também em runtime, logado, no navegador:** `/dashboard` (grid sem buraco, sem sino, sem banner) · `/practice` (respondeu questão → "Resposta correta" → gerou explicação de IA, sem botão "Tirar Dúvidas") · `/simulations/[id]/result` ("Questões Erradas (14)" expande, sem resquício de chat) · `/simulations/[id]/report` (botão "Revisar Erros" leva ao `/result` correto) · `/plano-estudos` (zero links mortos) · menu desktop e mobile · 13 rotas públicas em 200. Console e log do servidor limpos em todas.
>
> Não verificado em tela: sidebar do `/admin` (a conta de teste não está em `ADMIN_EMAILS`).
>
> **O schema do Prisma não foi tocado.** Os models `Notification`, `NotificationCampaign`, `NotificationPreference`, `PushSubscription`, `EmailCampaign`, `UserQuestionChat` e `ReviewCard` continuam lá, agora sem código que os use. Derrubar tabela exige backup do banco — passo 1 da seção 2.4.

**2.1 — Confirmados para corte (uso medido, não opinião)**

| Sai | Uso real | O que vai junto |
|---|---|---|
| **Máquina de notificações** | 5 enviadas em 90d, **0 lidas**. Zero campanhas de e-mail | `Notification`, `NotificationCampaign`, `NotificationPreference`, `PushSubscription`, `EmailCampaign` · 3 crons · 6 APIs · páginas de admin. **Maior subsistema do projeto** |
| **Chat com IA** | 0 usuários em 30d · 2 em 90d · último uso 21/jun | `UserQuestionChat`, `/api/questions/[id]/chat`. Corta também o problema de custo de IA no plano de R$ 9,99 |
| **Revisão espaçada (SRS)** | 0 em 30d · 10 em 90d | `ReviewCard`, `/revisao-inteligente`, `/api/review/*` |
| **Conquistas / gamificação** | 1,0% dos ativos | `Achievement`, `UserAchievement`, `/leaderboard`, `/perfil` |
| **Flashcards** | não é feature, é re-skin de `/api/questions/next` | `/flashcards` (384 linhas) |
| **`/api/cron/expire-trials`** | stub deprecado | diretório inteiro |

Com o SRS cortado, as **três páginas de revisão** (`/revisao-inteligente`, `/smart-review`, `/review`) saem juntas — nenhuma tinha uso.

**2.2 — Fica (núcleo, por uso medido)**

| Fica | Uso real |
|---|---|
| **Simulados** | **80,3%** criados · 44,7% concluídos — é o que carrega o produto |
| **Responder questões** | 48,9% · 2.565 respostas em 30d |
| **Selecionar matérias** | CIVIL, CONSTITUCIONAL e ÉTICA lideram; 17 matérias com uso real |

**2.3 — Em observação, não corta ainda**
- **Desafio entre amigos** — 5,5%, mas tem **uma semana de vida** (commits `ef35241`, `27c82ee`, `b13b9c2`). Número baixo por ser novo, não por ser ruim. Reavaliar em 30 dias.
- **Plano de estudos** — 1 usuário em 30 dias. Você pediu como núcleo, o dado diz que não é. Sugestão: em vez de cortar, **repensar** — hoje é uma tela que ninguém encontra, não uma feature ruim. Decisão sua.

⚠️ **A IA de explicações (`/api/questions/[id]/explain`) não está nesta lista.** Diferente do chat, ela tem uso e é o diferencial percebido do produto. Mas precisa de **teto diário por usuário** antes do plano de R$ 9,99 (ver 3.6).

**2.3 — O que NÃO se corta**
As páginas de SEO (`/gabarito`, `/questoes-oab`, `/blog`, `/simulado-oab-online`, `/proxima-prova-oab`, `/como-funciona`, `/materias/[slug]`) são aquisição, não uso. Cortar derruba tráfego orgânico e a entrada do funil.

**2.4 — Ordem segura de remoção**
1. Backup do banco (`pg_dump`) — **antes de qualquer DROP**
2. Remover páginas e rotas de API
3. Remover código e componentes
4. **Só então** remover models do Prisma e rodar a migration
5. Rodar `tsc --noEmit` a cada etapa

Bônus: cada tabela que sai devolve espaço, o que ajuda a Fase 0.

---

## FASE 3 — Stripe, plano único mensal

**3.0 — Pré-requisito que trava a fase inteira: entender os chargebacks**

Nos últimos 30 dias houve **6 chargebacks e 6 estornos contra 8 pagamentos recebidos**. Esse é provavelmente o problema real com o Asaas — e a Stripe **é mais rígida**, não mais tolerante.

Migrar sem resolver isso significa fazer toda a obra e ter a conta encerrada depois. A Stripe ainda cobra R$ 55 por contestação recebida (mais R$ 55 para contestar, devolvidos se você ganhar).

Antes de abrir conta, o Bloco 3 de `sql/03-desambiguar.sql` mostra valor, forma de pagamento e cliente de cada contestação. As causas mais comuns num produto assim:
- cobrança recorrente que o cliente não reconhece na fatura (nome do descritor)
- dificuldade de cancelar → o cliente aciona o banco em vez de pedir cancelamento
- primeira cobrança em valor diferente do anunciado

As duas primeiras o **Customer Portal da Stripe resolve sozinho** (cancelamento self-service em pt-BR). A terceira depende de deixar o preço explícito no checkout.

**3.1 — Configuração no painel**
- Conta Stripe **Brasil** (liquidação em BRL, conta bancária no mesmo CNPJ)
- 1 Product · 1 Price: **R$ 9,99 / mês, recorrente, BRL**
- Formas de pagamento: **só cartão**. Deixar boleto e PIX desligados
- Customer Portal ligado, em **pt-BR**, com cancelamento e troca de cartão
- **Smart Retries + atualizador de cartão (CAU) + network tokens** — em recorrência mensal de cartão, é o que segura o churn involuntário
- Ligar "enviar link hospedado para o cliente confirmar pagamento quando necessário"

**3.2 — Schema**
`Customer.stripeCustomerId` e `Subscription.stripeSubscriptionId`. O campo `gateway` já existe e permite Asaas e Stripe convivendo durante a transição.

**3.3 — Checkout**
Substituir `app/checkout/[priceId]/page.tsx` inteiro (504 linhas, e é ele que carrega o passivo de PCI) por uma Checkout Session:
```
mode=subscription · line_items[0][price]=price_xxx · payment_method_types[]=card
```
Some junto: coleta de cartão, coleta de CPF, coleta de endereço, `/pagamento/[subscriptionId]`, QR Code de PIX e toda a espera de compensação.

**3.4 — Webhook `/api/webhooks/stripe`**
O desenho do webhook do Asaas é bom e se reaproveita quase inteiro (loga antes de processar, idempotência por `eventId`, sempre 200). Muda a verificação: `stripe.webhooks.constructEvent` sobre o **corpo cru** (`await req.text()` no App Router).

| Evento | Ação |
|---|---|
| `checkout.session.completed` | vincula Customer/Subscription ao userId |
| `invoice.paid` | **libera o acesso** |
| `invoice.payment_failed` | avisa e deixa o Smart Retries agir |
| `customer.subscription.updated` | acompanha `active`/`past_due`/`canceled` |
| `customer.subscription.deleted` | revoga acesso |
| `invoice.finalization_failed` | crítico: fatura não finalizada não cobra, e a assinatura segue ativa de graça |

⚠️ Se a Stripe não receber `2xx` no `invoice.created`, ela **adia a finalização de todas as faturas por até 72h**. O padrão atual de sempre retornar 200 está certo e continua.

**3.5 — Simplificar a lógica de plano**
Com plano único, `PLANS`, `PLAN_LIMITS` e os tiers `BASIC`/`PRO`/`PREMIUM` deixam de fazer sentido. `gate.ts` vira uma pergunta só: *tem assinatura ativa?*

**3.6 — Teto de IA por usuário (não negociável a R$ 9,99)**
Hoje o PRO tem `dailyAiExplanations: Infinity` e `dailyAiChats: Infinity`. O `cost-guard.ts` só tem teto **global** — um usuário abusando queima o orçamento de todos. Precisa de limite diário por usuário antes de abrir o plano barato.

**3.7 — Portal**
`/api/billing/portal` deixa de ser rota caseira e passa a criar uma `billingPortal.session`.

**3.8 — Ferramental**
Antes de escrever código, vale rodar:
```bash
npm install -g @stripe/cli@latest
```
```bash
stripe agent setup
```
Instala o MCP da Stripe e as skills oficiais mantidas por eles, sempre atualizadas.

---

## FASE 4 — Assinantes atuais

Com **cartão-only na Stripe**, todo assinante ativo do Asaas precisa recadastrar. Não tem migração automática: quem paga por PIX ou boleto não tem cartão salvo, e importar cartão do Asaas (processo PAN import da Stripe) depende de o Asaas exportar — o que não vale o esforço para esta base.

A boa notícia é que a conversa é fácil: **R$ 9,99 é mais barato que os dois planos atuais.**

1. Honrar o período já pago de todo mundo (webhook do Asaas continua vivo, só recebendo)
2. E-mail: *"seu plano caiu para R$ 9,99/mês — recadastre para continuar"*
3. Manter os dois gateways convivendo enquanto durar o último ciclo pago
4. Cancelar as assinaturas no Asaas só depois que o último ciclo vencer
5. Desligar `reconcile-asaas` do `vercel.json` e remover `lib/asaas/` ao final

---

## FASE 5 — Verificação antes de fechar

- `tsc --noEmit` limpo
- Suíte verde (e rodando em 1 cópia do projeto, não 22)
- Fluxo real testado em sandbox: assinar → `invoice.paid` → acesso liberado → cancelar no portal → acesso revogado
- Cartão de teste `4242…` e cartão recusado `4000000000009995`
- Webhook conferido no Workbench da Stripe (sem entrega falhando)
- Confirmar que o banco novo responde e que o antigo pode ser desligado
- Só então: apagar projeto Supabase antigo e remover `lib/asaas/`

---

## Ordem recomendada

```
FASE 0 (banco)  ──┐
                  ├──> FASE 2 (corte) ──> FASE 3 (Stripe) ──> FASE 4 ──> FASE 5
FASE 1 (higiene) ─┘
```

Fases 0 e 1 são independentes e podem andar juntas. A Fase 2 antes da 3 evita escrever código Stripe para telas que vão morrer. A Fase 4 só começa quando a 3 estiver em produção e testada.

---

## O que preciso de você para começar

1. Resultado do **Bloco 4** de `01-uso-real-features.sql` → destrava a Fase 2
2. Resultado dos **Blocos 1 a 4** de `02-diagnostico-banco.sql` → decide se migra ou só limpa
3. `ENABLE_FREE_ACCESS_MODE` e `UPSTASH_*` em produção
4. Se a conta Stripe Brasil já existe ou precisa ser aberta (a verificação leva alguns dias)
