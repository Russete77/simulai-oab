# Variáveis de ambiente na Vercel

Time: `russete77s-projects` · Projeto: `simulai-oab` · Domínio: `https://simulaioab.com`

> **Auditoria de 02/09/2026** — 26 variáveis em produção. As **4 da Stripe não
> existem em ambiente nenhum**. Como `assertEnvOrThrow()` roda na fase de build,
> o merge da PR #7 **quebra o build da Vercel** enquanto elas faltarem.
> Nada vai ao ar quebrado — mas o deploy falha.

A fonte da verdade é `lib/env.ts`. O que está marcado **obrigatório** ali é
checado em `assertEnvOrThrow()`, que roda na fase de build de produção: se
faltar uma, **o build da Vercel quebra** — não existe cenário de subir mal
configurado e descobrir depois.

---

## Regra de ouro dos três ambientes

A Vercel tem **Production**, **Preview** e **Development**. A separação que
importa é a da Stripe:

| Ambiente | Chaves Stripe | Por quê |
|---|---|---|
| **Production** | `sk_live_` / `pk_live_` | cobra cartão de verdade |
| **Preview** | `sk_test_` / `pk_test_` | toda branch vira uma URL pública; com chave live, um teste seu cobra alguém |
| **Development** | não precisa — usa o `.env.local` | |

Marcar "todos os ambientes" na chave live é o erro que custa dinheiro.

---

## 1 · As 3 variáveis LIVE que faltam

| Variável | Onde pegar |
|---|---|
| `STRIPE_SECRET_KEY` | Dashboard Stripe → **modo Live** → Developers → API keys → `sk_live_…` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | mesma tela → `pk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | Developers → Webhooks → o endpoint → `whsec_…` |

**`STRIPE_PRICE_ID` não é mais necessária.** Com quatro ciclos de pagamento,
guardar ID viraria oito variáveis em dois ambientes — e trocar um preço de
teste por um de produção não daria erro, só cobrança errada. Os preços são
achados na Stripe por `lookup_key`, que é a mesma em teste e em live. A
variável continua funcionando como atalho do mensal, se estiver definida.

Os quatro preços são criados por script, não à mão:

```bash
npx tsx scripts/stripe-setup.ts --live            # em seco, só mostra
npx tsx scripts/stripe-setup.ts --live --aplicar  # para valer
```

Ele também acerta os eventos do webhook e a configuração do portal. Lê a
chave de `.env.producao.local` (`STRIPE_LIVE_SECRET_KEY=sk_live_…`), que é
gitignored — apague depois de usar.

### O endpoint do webhook

```
https://simulaioab.com/api/webhooks/stripe
```

Eventos a assinar (são os que o código trata — assinar a mais só gera ruído):

```
invoice.paid
invoice.payment_failed
invoice.payment_action_required
invoice.finalization_failed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
charge.refunded
```

O `whsec_` do endpoint **live** é diferente do de teste. Trocar um pelo outro
faz toda assinatura falhar a verificação e o app nunca liberar o acesso pago.

---

## 2 · Obrigatórias que já estão lá ✅

Conferidas em 02/09/2026, todas presentes:

`DATABASE_URL` · `DIRECT_URL` · `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` ·
`CLERK_SECRET_KEY` · `CLERK_WEBHOOK_SECRET` · `OPENAI_API_KEY` ·
`CRON_SECRET` · `NEXT_PUBLIC_APP_URL` · `ADMIN_EMAILS` ·
`NEXT_PUBLIC_VAPID_PUBLIC_KEY` · `VAPID_PRIVATE_KEY` · `ASAAS_API_KEY` ·
`ASAAS_WEBHOOK_TOKEN` · `AI_EXPLANATION_MODEL` · `OPENAI_MONTHLY_BUDGET_USD` ·
`RESEND_API_KEY` · os 4 `NEXT_PUBLIC_CLERK_*_URL`

Duas valem uma conferida de valor, porque são antigas (328 dias) e ninguém
olha para elas faz tempo:

| Variável | Conferir |
|---|---|
| `NEXT_PUBLIC_APP_URL` | tem que ser `https://simulaioab.com`. **É daqui que sai o endereço de volta do checkout e do portal da Stripe.** Errado = a pessoa paga e é devolvida para o lugar errado |
| `ENABLE_FREE_ACCESS_MODE` | se estiver `true` em produção, **o paywall está desligado** e todo mundo usa de graça. Está definida em Production há 302 dias |

`RESEND_FROM_EMAIL` **não é necessária** — o remetente é fixo em
`lib/email/config.ts` (`Simulai OAB <noreply@simulaioab.com>`).

---

## 3 · Faltam de verdade, e falham em silêncio

Não quebram o build. Fazem função sumir sem erro nenhum.

| Variável | O que acontece sem ela |
|---|---|
| `UPSTASH_REDIS_REST_URL` | **rate limiting DESLIGADO em produção.** `lib/rate-limit.ts` falha aberto: as rotas de IA ficam sem teto e uma pessoa sozinha pode torrar a conta da OpenAI |
| `UPSTASH_REDIS_REST_TOKEN` | idem — as duas juntas ou nenhuma |

Aparece no log de boot da Vercel como `[ENV] UPSTASH_… ausentes`. Vale procurar
por `[ENV]` depois do primeiro deploy.

Opcional de verdade: `NEXT_PUBLIC_META_PIXEL_ID` (sem ela o Meta Pixel não
carrega) e `DAILY_AI_EXPLANATIONS_LIMIT` (sem ela o limite é 20/dia).

---

## 4 · Estão na Vercel e não servem para nada

Nenhum arquivo do projeto lê estas quatro. Podem sair:

```
NEXT_PUBLIC_SUPABASE_URL          0 usos
NEXT_PUBLIC_SUPABASE_ANON_KEY     0 usos
SUPABASE_SERVICE_ROLE_KEY         0 usos   ← chave de ADMIN do banco
ADMIN_API_KEY                     0 usos
```

`SUPABASE_SERVICE_ROLE_KEY` ignora RLS e lê/escreve qualquer tabela. Ela está
marcada como **Non-sensitive**, ou seja, o valor é legível no painel e pela API
por qualquer pessoa com acesso ao projeto. Guardar uma chave dessas onde
ninguém a usa é só superfície de vazamento de graça.

```bash
vercel env rm SUPABASE_SERVICE_ROLE_KEY production
```

`FREE_ACCESS_END_DATE` (301 dias) só faz sentido junto com
`ENABLE_FREE_ACCESS_MODE` — se o modo gratuito acabou, as duas podem sair.

### Sobre "Non-sensitive"

Quase tudo lá está como Non-sensitive, incluindo `CLERK_SECRET_KEY`,
`OPENAI_API_KEY` e `DATABASE_URL`. Isso significa que o valor pode ser lido de
volta no painel. As da Stripe que você vai criar agora vale marcar como
**Sensitive** — write-only, ninguém lê depois, nem você.

---

## 6 · Ordem para não tomar susto

1. Rodar o SQL `05-subscription-cancel-at.sql` — **já rodado**
2. Criar produto e preço de R$ 9,99 em **modo Live**
3. Criar o endpoint de webhook live e pegar o `whsec_`
4. Configurar o portal do cliente em modo Live (pt-BR, cancelar no fim do período)
5. Preencher as variáveis na Vercel — **Production**
6. Preencher **Preview** com as chaves de teste
7. Redeploy

O passo 7 não é opcional: `NEXT_PUBLIC_*` é embutida no bundle na hora do
build. Mudar o valor no painel não muda nada até o próximo deploy.

---

## Como preencher

**Painel:** Vercel → projeto → Settings → Environment Variables. Dá para colar
um bloco `NOME=valor` inteiro de uma vez no campo de nome, que ele separa.

**CLI:** precisa `vercel login` primeiro (hoje a CLI está deslogada aqui).

```bash
vercel env add STRIPE_SECRET_KEY production
```

Ele pede o valor no terminal — não vai para o histórico do shell nem para
esta conversa.

Para conferir o que já está lá, sem expor valor nenhum:

```bash
vercel env ls production
```
