# Análise: migrar de Asaas para Stripe — SIMULAI OAB

**Data:** 25/08/2026
**Fonte:** documentação oficial Stripe (docs.stripe.com), consultada em 25/08/2026
**API version atual:** `2026-07-29.dahlia`

---

## 1. Nosso caso de uso (o que existe hoje)

| Item | Situação atual |
|---|---|
| Stack | Next.js App Router + Clerk + Prisma/Postgres + Vercel |
| Planos | Essencial R$ 19,99/mês · Pro R$ 89,99/mês — **só mensal**, sem trial |
| Formas de pagamento | PIX, Boleto, Cartão de crédito |
| Recorrência | `POST /v3/subscriptions` com `cycle: MONTHLY` (Asaas gera a cobrança todo mês) |
| Checkout | Página própria (`app/checkout/[priceId]`) que coleta **número do cartão, CCV e validade em texto puro** e envia pro nosso backend |
| Ativação | Webhook `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED` → `Subscription.status = ACTIVE` → `gate.ts` libera |
| Cancelamento | Rota própria (`/api/billing/portal`), porque o Asaas não tem portal self-service |
| Reconciliação | Cron `/api/cron/reconcile-asaas` |

Arquivos envolvidos: `lib/asaas/*` (812 linhas), `lib/billing/*`, `app/api/billing/*`, `app/api/webhooks/asaas/route.ts`, `app/checkout/[priceId]/page.tsx`, models `Customer` / `Subscription` / `Payment` no Prisma.

---

## 2. O achado que decide tudo: **PIX recorrente não existe na Stripe para conta brasileira**

Da página oficial do PIX na Stripe, seção "Localizações de empresa":

> "As contas Stripe no Brasil podem aceitar pagamentos únicos via Pix com liquidação de fundos em BRL. **O Pix Automático não está disponível no Brasil.** (Apenas por convite)"

E a tabela de suporte confirma: PIX — localização da empresa "**BR (Invite only), US**".

Traduzindo para o nosso caso:

- **PIX recorrente (Pix Automático)** só funciona em contas Stripe **fora do Brasil** (US, UE, UK, AU, SG…). Aí entra IOF de 3,5% cobrado do cliente, liquidação em moeda estrangeira, câmbio ~2% e exigência de entidade jurídica no exterior. Inviável.
- Para uma conta Stripe brasileira, PIX é **avulso apenas** — e ainda por cima **por convite**, não por autoatendimento.
- Nota de rodapé oficial no Checkout: *"Para o Checkout no modo de assinatura, use o Pix Automático."* Ou seja: **PIX simplesmente não entra no Checkout em modo assinatura no Brasil.**

Hoje o PIX é o caminho mais barato e de maior conversão no plano de R$ 19,99. Na Stripe BR, esse caminho deixa de existir para recorrência.

---

## 3. O que a Stripe realmente entrega numa conta BR

| Recurso | Cartão | Boleto | PIX |
|---|---|---|---|
| Disponível em conta BR | ✅ | ✅ | ⚠️ só por convite |
| Assinatura recorrente | ✅ | ✅ | ❌ (Pix Automático não existe no BR) |
| Stripe Checkout (modo assinatura) | ✅ | ✅ | ❌ |
| Payment Element | ✅ | ✅ | ✅ (avulso) |
| Customer Portal | ✅ | ✅ | ✅ |
| Reembolso | ✅ | ❌ **total e parcial não suportados** | ✅ (até 90 dias) |
| Contestação/chargeback | ✅ | ❌ (não há chargeback) | ⚠️ limitado, indefensável |
| Confirmação | imediata | até 1 dia útil | segundos |
| Liquidação | padrão | T+2 | padrão |
| Limites | — | R$ 5,00 a R$ 49.999,99 | R$ 0,50 a R$ 3.000 |

### Boleto em assinatura — como funciona na prática

- Habilitar em Configurações → Formas de pagamento, e ligar **"Enviar um link hospedado pela Stripe para os clientes confirmarem os pagamentos quando necessário"** em Configurações de assinaturas.
- `mode=subscription` + `payment_method_options[boleto][expires_after_days]=3`.
- **A Stripe envia por e-mail um boleto novo ao cliente a cada ciclo de assinatura.** Documentado: *"A Stripe envia ao cliente um boleto gerado previamente ao endereço de e-mail em cada ciclo de assinatura."*
- Exige **nome completo, endereço e ID fiscal (CPF)** — `boleto[tax_id]`, `billing_details[address]` com `country=BR`.
- Dois modos de cobrança: `charge_automatically` (cliente já escolheu boleto como padrão, recebe boleto por e-mail todo mês) ou `send_invoice` (cliente reinforma os dados a cada fatura).
- CPF de teste: `000.000.000-00`.

---

## 4. Custo real por transação (preços oficiais Stripe Brasil)

| Tarifa | Valor |
|---|---|
| Cartão nacional | 3,99% + R$ 0,39 |
| Cartão internacional | +2% |
| PIX | 1,19% |
| Boleto | R$ 3,45 por boleto pago |
| **Billing (assinaturas)** | **+0,7% do volume** |
| Contestação recebida | R$ 55,00 |
| Conversão de moeda | 2% |

### Aplicado aos nossos preços

| | Essencial R$ 19,99 | Pro R$ 89,99 |
|---|---|---|
| Cartão (3,99% + 0,39 + 0,7%) | R$ 1,33 → **6,6%** | R$ 4,61 → **5,1%** |
| Boleto (3,45 + 0,7%) | R$ 3,59 → **18,0%** | R$ 4,08 → **4,5%** |
| PIX (1,19% + 0,7%) — *se liberado, e só avulso* | R$ 0,38 → 1,9% | R$ 1,70 → 1,9% |

**Boleto come 18% do plano Essencial.** E o boleto não tem reembolso — o que colide com o direito de arrependimento de 7 dias do CDC. Se um assinante do Essencial pagar boleto e pedir cancelamento em 7 dias, não dá pra estornar pela Stripe; teria que devolver por fora (PIX manual), com o custo do boleto já perdido.

Comparar essas três linhas com o que o Asaas cobra hoje é a conta que decide o lado financeiro.

---

## 5. O que a migração melhora de verdade

**1. Some o passivo de PCI.** Hoje `app/checkout/[priceId]/page.tsx` coleta PAN, CCV e validade e faz `POST` desses dados pro nosso servidor. Isso nos joga em escopo PCI DSS SAQ D — o nível mais pesado, e a maior exposição jurídica do produto hoje. Com Stripe Checkout ou Payment Element, o dado do cartão nunca toca nosso servidor.

**2. Ganhamos portal self-service.** Hoje `/api/billing/portal` só faz `cancel`, porque o Asaas não tem portal. O Customer Portal da Stripe entrega, em **pt-BR**, com nossa marca: atualizar forma de pagamento, cancelar (imediato ou no fim do período), ver e baixar faturas, atualizar dados fiscais, e ainda **cancellation reversal** (oferecer cupom quando o cliente tenta cancelar) — que é retenção pronta, sem código.

**3. Dunning e recuperação de receita prontos.** Smart Retries, atualizador automático de cartão (CAU), network tokens e Adaptive Acceptance. Hoje isso é nosso `handlePaymentOverdue` + campanhas manuais.

**4. Ferramental de agente.** A Stripe mantém skills oficiais para agentes de código:
```bash
npm install -g @stripe/cli@latest
stripe agent setup
```
Instala o MCP da Stripe + skills atualizadas automaticamente. Vale rodar antes de escrever qualquer linha.

---

## 6. O que a Stripe **não** resolve (e o Asaas resolvia ou pode resolver)

| Lacuna | Impacto |
|---|---|
| **PIX recorrente** | Não existe em conta BR. É o item nº 1. |
| **Nota fiscal** | Oficialmente: *"Também não geramos faturas para os serviços ou produtos que você vende aos seus clientes através da nossa plataforma."* A Stripe nem emite NF-e das próprias tarifas pra nós desde maio/2022. Se hoje o Asaas emite NFS-e, perdemos e precisamos de um serviço separado (eNotas, NFE.io, Focus NFe). |
| **Parcelamento no cartão** | A Stripe só tem parcelado no México, Japão e Mastercard Installments. **Não tem parcelado no Brasil.** Irrelevante pro mensal, mas mata qualquer plano anual parcelado no futuro — que é justamente o formato que mais vende curso de OAB. |
| **Reembolso de boleto** | Não suportado, nem total nem parcial. |
| **Taxa de cartão** | 3,99% + R$ 0,39 é caro pro mercado brasileiro. |

---

## 7. Arquitetura proposta (se seguirmos)

**Checkout:** Stripe Checkout em `mode=subscription` (hospedado ou embedded). Elimina nossa página de cartão inteira.

**Catálogo:** Product + Price na Stripe. `BASIC_MONTHLY` → `price_xxx`, `PRO_MONTHLY` → `price_xxx`. `lib/billing/plans.ts` passa a mapear tier → priceId.

**Webhooks** (`/api/webhooks/stripe`), com verificação de assinatura via `stripe.webhooks.constructEvent` sobre o **corpo cru** (`await req.text()` no App Router):

| Evento | Ação |
|---|---|
| `checkout.session.completed` | vincula Customer/Subscription ao nosso userId |
| `invoice.paid` | **provisiona acesso** (é aqui que o gate libera) |
| `invoice.payment_failed` | avisa cliente, dispara recuperação |
| `invoice.payment_action_required` | pede ação do cliente |
| `customer.subscription.updated` | acompanha `trialing/active/past_due/canceled/unpaid` |
| `customer.subscription.deleted` | revoga acesso |
| `invoice.finalization_failed` | **crítico** — fatura não finalizada não cobra, e a assinatura fica ativa sem pagar |
| `charge.refunded` | reembolso |

⚠️ Detalhe importante: se a Stripe **não receber 2xx no `invoice.created`**, ela adia a finalização de todas as faturas em cobrança automática **por até 72 horas**. Nosso padrão atual de "sempre retornar 200" está certo e deve continuar.

**Estados:** revogar acesso em `canceled` e em `unpaid`. Em `past_due`, avisar e deixar o Smart Retries trabalhar.

**Portal:** substituir `/api/billing/portal` por `billingPortal.sessions.create({ customer, return_url })`.

**Banco:** o schema já tem campo `gateway`, mas os IDs são `asaasCustomerId` / `asaasSubscriptionId` (únicos). Precisa de `stripeCustomerId` / `stripeSubscriptionId` — ou generalizar para `externalCustomerId` / `externalSubscriptionId` com `gateway` fazendo a distinção. `WebhookLog` e a idempotência por `eventId` são reaproveitáveis inteiros.

**Reconciliação:** o cron atual vira listagem de `subscriptions` / `invoices` na Stripe.

---

## 8. Migração dos assinantes que já existem

- **Cartão:** a Stripe faz **PAN import** — processo formal, PCI-compliant, com chave PGP e formulário de solicitação de migração. Depende de o **Asaas concordar em exportar os dados de cartão**. Prazo: até 10 dias úteis depois que a Stripe recebe os dados. Se o Asaas não exportar, cada assinante de cartão precisa recadastrar.
- **Assinaturas:** há o *Billing migration toolkit* para recriar assinaturas preservando a âncora de cobrança.
- **PIX e boleto:** nada a migrar — assinantes de PIX precisam de um novo caminho de qualquer forma.
- Convivência: dá pra rodar Stripe para novos e Asaas para os antigos durante a transição, sem downtime.

---

## 9. Decisão tomada (25/08/2026)

**Stripe, somente cartão de crédito.** Sem PIX, sem boleto.

Consequências que isso trava no escopo:

- Custo por transação: **6,6%** no Essencial (R$ 1,33) e **5,1%** no Pro (R$ 4,61).
- Cai fora todo o fluxo assíncrono: sem página `/pagamento/[id]`, sem QR Code, sem espera de compensação. Pagamento confirma na hora.
- Cai fora a coleta obrigatória de CPF/endereço que o boleto exigia — passa a ser opcional.
- `PaymentMethod` no schema deixa de precisar de PIX/BOLETO.
- Reembolso volta a ser possível (cartão suporta total e parcial), o que resolve o direito de arrependimento de 7 dias.
- Chargeback passa a existir: R$ 55,00 por contestação recebida.
- Vale ligar Smart Retries, atualizador de cartão (CAU) e network tokens desde o dia 1 — em assinatura de cartão eles são a maior alavanca de receita recuperada.

**Aguardando:** lista de alterações do Erick antes de montar o plano de execução.

---

## Fontes

- https://docs.stripe.com/payments/pix
- https://docs.stripe.com/payments/pix/pix-automatico
- https://docs.stripe.com/billing/subscriptions/pix
- https://docs.stripe.com/payments/boleto
- https://docs.stripe.com/payments/boleto/set-up-subscription
- https://docs.stripe.com/payments/payment-methods/payment-method-support
- https://docs.stripe.com/billing/subscriptions/webhooks
- https://docs.stripe.com/customer-management
- https://docs.stripe.com/get-started/data-migrations/pan-import
- https://docs.stripe.com/payments/installments
- https://docs.stripe.com/skills
- https://stripe.com/br/pricing
- https://support.stripe.com/questions/nota-fiscal-eletrônica-de-serviços-invoices-(nf-e)
