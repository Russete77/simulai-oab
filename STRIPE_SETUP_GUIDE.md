# Guia de Configuração do Stripe

## ✅ Integração Completa Implementada

A integração com Stripe foi implementada com sucesso! Agora você precisa configurar sua conta Stripe e conectar com a aplicação.

---

## 📋 Próximos Passos

### 1. Criar Conta no Stripe

1. Acesse: https://dashboard.stripe.com/register
2. Complete o registro
3. Ative o modo **Test** no dashboard (canto superior direito)

### 2. Obter Chaves de API

1. Vá em: https://dashboard.stripe.com/test/apikeys
2. Copie as chaves:
   - **Publishable key** (começa com `pk_test_`)
   - **Secret key** (começa com `sk_test_`)

### 3. Configurar Variáveis de Ambiente

Adicione as chaves no arquivo `.env`:

```bash
# Stripe (para pagamentos e assinaturas)
STRIPE_SECRET_KEY=sk_test_SEU_SECRET_KEY_AQUI
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_SEU_PUBLISHABLE_KEY_AQUI
STRIPE_WEBHOOK_SECRET=
```

### 4. Criar Produtos e Preços no Stripe

#### 4.1 Criar Produto Mensal

1. Acesse: https://dashboard.stripe.com/test/products/create
2. Preencha:
   - **Name**: "Simulai OAB - Plano Mensal"
   - **Description**: "Acesso completo a todas as questões e simulados"
   - **Pricing**: R$ 29,90
   - **Billing period**: Monthly
3. Clique em **Save product**
4. Copie o **Price ID** (começa com `price_`)

#### 4.2 Criar Produto Anual

1. Acesse: https://dashboard.stripe.com/test/products/create
2. Preencha:
   - **Name**: "Simulai OAB - Plano Anual"
   - **Description**: "Acesso completo com desconto de 33%"
   - **Pricing**: R$ 238,80
   - **Billing period**: Yearly
3. Clique em **Save product**
4. Copie o **Price ID** (começa com `price_`)

#### 4.3 Adicionar Price IDs no `.env`

```bash
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
```

### 5. Configurar Webhook

#### 5.1 Instalar Stripe CLI (para testes locais)

**Windows:**
```bash
scoop install stripe
```

**Ou baixe direto:** https://github.com/stripe/stripe-cli/releases

#### 5.2 Logar no Stripe CLI

```bash
stripe login
```

#### 5.3 Testar Webhook Localmente

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Isso vai gerar um `webhook secret` (começa com `whsec_`). Copie e adicione no `.env`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

#### 5.4 Configurar Webhook em Produção

Quando fizer deploy:

1. Acesse: https://dashboard.stripe.com/test/webhooks/create
2. Configure:
   - **Endpoint URL**: `https://SEU_DOMINIO.com/api/webhooks/stripe`
   - **Events to send**:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
3. Copie o **Signing secret** e adicione no `.env` de produção

---

## 🧪 Testar a Integração

### 1. Iniciar a aplicação

```bash
npm run dev
```

### 2. Testar fluxo de pagamento

1. Acesse: http://localhost:3000/pricing
2. Clique em "Assinar Agora" em qualquer plano
3. Use um cartão de teste do Stripe:
   - **Número**: 4242 4242 4242 4242
   - **Data**: Qualquer data futura (ex: 12/34)
   - **CVC**: Qualquer 3 dígitos (ex: 123)
   - **ZIP**: Qualquer 5 dígitos (ex: 12345)

### 3. Verificar Webhooks

No terminal onde está rodando `stripe listen`, você deve ver os eventos sendo recebidos.

---

## 📁 Arquitetura Implementada

```
lib/stripe/
├── client.ts              # Cliente Stripe configurado
├── types.ts               # Tipos TypeScript
├── customer-service.ts    # Gerenciamento de clientes
├── subscription-service.ts # Gerenciamento de assinaturas
├── checkout-service.ts    # Checkout e portal do cliente
└── index.ts               # Exports

app/api/billing/
├── customer/route.ts      # API de clientes
├── subscribe/route.ts     # API de assinaturas
├── status/route.ts        # Status da assinatura
└── portal/route.ts        # Portal do cliente

app/api/webhooks/stripe/
└── route.ts               # Webhook handler

app/pricing/
└── page.tsx               # Página de planos
```

---

## 🔐 Segurança

### Boas Práticas Implementadas:

✅ API keys armazenadas em variáveis de ambiente
✅ Webhook signature verification
✅ Autenticação com Clerk antes de criar checkouts
✅ Metadata com `clerk_user_id` para rastreabilidade
✅ Tratamento de erros robusto

### IMPORTANTE:

- ❌ NUNCA commite as chaves de API no git
- ❌ NUNCA exponha a `STRIPE_SECRET_KEY` no frontend
- ✅ Use apenas a `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` no frontend

---

## 📝 TODO: Próximas Implementações

As seguintes tarefas estão marcadas como `TODO` no código e precisam ser implementadas:

### 1. Sincronizar com Banco de Dados

No arquivo `app/api/webhooks/stripe/route.ts`, implementar:

- Salvar `subscription_id`, `customer_id` e `status` na tabela de usuários
- Atualizar `current_period_end` para controlar acesso
- Criar tabela de `payments` para histórico

### 2. Controle de Acesso

Criar middleware ou hook para verificar:
- Se usuário tem assinatura ativa
- Se assinatura não está vencida
- Liberar funcionalidades premium baseado no plano

### 3. Dashboard do Usuário

Adicionar seção de "Minha Assinatura" com:
- Status atual da assinatura
- Data de renovação
- Histórico de pagamentos
- Botão "Gerenciar Assinatura" (abre Stripe Portal)

### 4. Email de Confirmação

Integrar com serviço de email para enviar:
- Confirmação de compra
- Nota fiscal
- Lembretes de renovação
- Aviso de falha de pagamento

---

## 🆘 Troubleshooting

### Erro: "This value is not a valid price"

- Verifique se o `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID` está correto
- Certifique-se que o preço existe no dashboard do Stripe

### Erro: "No signatures found matching the expected signature"

- Verifique se `STRIPE_WEBHOOK_SECRET` está configurado
- Se estiver testando localmente, certifique-se que `stripe listen` está rodando

### Webhook não está recebendo eventos

- Verifique se a URL do webhook está correta
- Certifique-se que a rota `/api/webhooks/stripe` está pública no middleware
- Verifique os logs do webhook no dashboard: https://dashboard.stripe.com/test/webhooks

---

## 📚 Documentação Oficial

- **Stripe API**: https://stripe.com/docs/api
- **Stripe Subscriptions**: https://stripe.com/docs/billing/subscriptions/overview
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **Stripe Testing**: https://stripe.com/docs/testing

---

## ✅ Status da Implementação

| Componente | Status |
|------------|--------|
| Cliente Stripe | ✅ Implementado |
| Serviços (Customer, Subscription, Checkout) | ✅ Implementado |
| APIs de Billing | ✅ Implementado |
| Webhook Handler | ✅ Implementado |
| Página de Pricing | ✅ Implementado |
| Integração com Clerk | ✅ Implementado |
| Testes Manuais | ⏳ Pendente |
| Sincronização com BD | ⏳ Pendente |
| Portal do Cliente | ✅ Implementado |

---

**Última atualização**: 31/10/2025
**Versão**: 1.0.0
