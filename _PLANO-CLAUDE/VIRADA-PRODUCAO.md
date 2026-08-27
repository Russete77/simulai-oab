# Virada para produção — Stripe

Ordem importa. Cada bloco tem uma verificação: **não avance sem ela**.

Estado da conta (verificado em 27/08 via API): `acct_1SOLSLIKAG9XC426` · BR · BRL ·
`charges_enabled: true` · `payouts_enabled: true` · zero pendências ·
`card_payments: active`. **A conta está apta a cobrar de verdade.**

O banco de produção **já tem** as colunas `stripeCustomerId` e
`stripeSubscriptionId` — rodei o SQL 04 no seu banco real. Esse passo está feito.

---

## 1. No painel, com o MODO DE TESTE DESLIGADO

⚠️ Tudo abaixo é **por modo**. O que você configurou em teste não existe em
produção. Confira que o botão "Modo de teste" está **desligado** antes de cada
item.

### 1.1 Nome do negócio
**Configurações → Detalhes do negócio → Nome público**: trocar `Smu` por
**Simulai OAB**.

É o que o aluno vê no checkout e na fatura do cartão. Nome não reconhecido é
causa clássica de contestação — e você teve 6 este mês.
*(O descritor da fatura já está `SIMULAI OAB`.)*

### 1.2 Produto e preço
**Produtos → Criar produto**: `Simulai OAB`, **Recorrente**, **9,99**, **BRL**,
**Mensal**, taxa fixa.

Copie o `price_...`. **O de teste não funciona em produção** — usar o antigo
devolve "No such price".

### 1.3 Formas de pagamento
**Configurações → Formas de pagamento**: deixar **só cartão** ligado.
Boleto e Pix desligados.

O código já força `payment_method_types: ['card']`, mas desligar no painel
evita alguém religar sem querer. Boleto a R$ 9,99 custaria R$ 3,45 por
cobrança e não aceita estorno.

### 1.4 Portal do cliente
**Configurações → Portal do cliente**: ligar · idioma **pt-BR** · logo e cores.
Permitir: **cancelar assinatura**, **atualizar forma de pagamento**,
**ver e baixar faturas**.

Sem isto o botão "Gerenciar assinatura" abre erro, e o cancelamento
self-service — que é o antídoto pra contestação — não existe.

### 1.5 Recuperação de receita
**Configurações → Assinaturas e e-mails**:
- **Smart Retries**: ligado
- **Atualizador automático de cartão (CAU)**: ligado
- **Network tokens**: ligado

Em recorrência mensal de cartão, é o que segura o churn involuntário — gente
que perde acesso por cartão vencido, sem nunca ter decidido cancelar.

**Verificação do bloco 1:** volte em Produtos e confirme que o preço de R$ 9,99
aparece **com o modo de teste desligado**.

---

## 2. Webhook de produção

**Desenvolvedores → Webhooks → Adicionar endpoint**

URL: `https://www.simulaioab.com/api/webhooks/stripe`

Eventos (exatamente estes seis — são os que o código trata):
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

Copie o `whsec_...`. **É outro** — o do seu `.env.local` veio do `stripe listen`
e vale só pro localhost.

**Verificação:** clique em "Enviar evento de teste" com `invoice.paid` e
confirme resposta **200**. Se der 400, o segredo está trocado.

---

## 3. Variáveis na Vercel

**Settings → Environment Variables**, ambiente **Production**:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...        (o do endpoint, não o do listen)
STRIPE_PRICE_ID=price_...              (o criado em modo LIVE)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

Se faltar qualquer uma, **o build quebra de propósito** e o erro diz qual.
Isso é proteção, não problema: nada mal configurado chega em produção.

---

## 4. Deploy

Suba e leia o log do build. Ele vai imprimir avisos de configuração
meio-feita — preste atenção em dois:

- `UPSTASH_REDIS_REST_URL/TOKEN ausentes` → rate limit desligado, rotas de IA
  sem teto
- `ENABLE_FREE_ACCESS_MODE=true` → **paywall desligado**, ninguém precisa pagar

O segundo é crítico: se estiver ligado, seu checkout novo funciona e ninguém
usa, porque o acesso já é livre.

---

## 5. Primeira cobrança real — faça você, com seu cartão

Não confie no teste. Assine de verdade, com R$ 9,99 no seu próprio cartão:

1. `/pricing` → Assinar → o formulário abre **dentro do app**
2. Pagar → deve cair em `/assinar/confirmacao` com "Pronto. Agora é estudar."
3. **Workbench → Webhooks**: `invoice.paid` com **200**
4. `/dashboard/assinatura` mostra ativa e a data da próxima cobrança
5. Rodar no banco:

```sql
SELECT s.status, s.gateway, p.status AS pagamento, p.value, p."paymentMethod"
FROM "Subscription" s
LEFT JOIN "Payment" p ON p."subscriptionId" = s.id
WHERE s.gateway = 'stripe'
ORDER BY s."createdAt" DESC LIMIT 3;
```

Tem que vir `ACTIVE` **e** um `Payment` `RECEIVED` de 9.99. Se a assinatura
ativar **sem** pagamento, pare tudo — é o bug que o Asaas tinha.

6. Abrir o portal, cancelar, confirmar que o acesso vai até o fim do período
7. Reembolsar a si mesmo pelo painel e confirmar que o `Payment` vira `REFUNDED`

---

## 6. Primeira semana — o que olhar

- **Workbench → Webhooks**: qualquer entrega falhando. A Stripe repete por 3
  dias; depois desiste e o acesso não é liberado.
- **3D Secure.** Emissor brasileiro pede autenticação com frequência, e em
  teste isso quase não aparece. Assinatura presa em `INCOMPLETE` com
  `invoice.payment_action_required` no log = cliente não concluiu a
  autenticação. É esperado; o que não pode é passar despercebido.
- **Contestações.** As 6 do Asaas eram de **um único cliente**
  (`cus_000178512116`, sempre R$ 89,99). Se aparecer o mesmo padrão aqui, é
  a mesma pessoa — bloqueie no Radar. A Stripe cobra R$ 55 por contestação.
- **Recusas.** Cartão de teste nunca é recusado por risco. Alguma recusa
  legítima vai acontecer.

---

## 7. Assinantes do Asaas

Só depois que a Stripe estiver rodando. Hoje: **11 ativos, 12 past_due**.

1. O webhook do Asaas continua vivo — o período já pago é honrado
2. E-mail: "seu plano caiu para R$ 9,99/mês, recadastre" — é mais barato que
   os dois planos antigos, a conversa é fácil
3. Cancelar no Asaas só quando o último ciclo pago vencer
4. Aí sim: tirar `reconcile-asaas` do `vercel.json` e remover `lib/asaas/`

---

## Se der errado

**Reverter é reverter o deploy.** Nada no banco é destrutivo: as colunas da
Stripe são nuláveis e as assinaturas do Asaas seguem intactas com
`gateway='asaas'`.

O que **não** dá pra desfazer sozinho é cobrança já feita — reembolse pelo
painel.

---

## Ainda em aberto

- **Nota fiscal.** A Stripe não emite. Se o Asaas emitia, precisa de serviço
  à parte (eNotas, NFE.io, Focus NFe).
- **Renovação e falha de cobrança** nunca foram exercitadas — nem em teste.
  Dá pra forçar em sandbox antes de subir, se quiser.
- **Tabelas órfãs** no schema (`Notification`, `PushSubscription`,
  `UserQuestionChat`, `ReviewCard`, `EmailCampaign`). Derrubar exige backup.
