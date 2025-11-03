# 🎯 Próximos Passos - Ativação do Stripe

## 📝 Checklist de Ativação

### ✅ Fase 1: Preparar Banco de Dados (5 min)

```bash
# 1. Criar e aplicar migration
npx prisma migrate dev --name migrate-to-stripe

# 2. Gerar Prisma Client atualizado
npx prisma generate

# 3. Verificar se tudo está OK
npx prisma studio  # Abre interface visual do banco
```

**O que esperar:**
- Tabelas Customer, Subscription e Payment com campos Stripe
- Enums atualizados para match com Stripe

---

### ✅ Fase 2: Criar Produtos no Stripe (10 min)

#### Opção A: Script Automático (Recomendado)

```bash
# Instalar dependência se necessário
npm install tsx --save-dev

# Executar script
npx tsx scripts/create-stripe-products.ts
```

**O script vai:**
1. Criar 9 produtos no Stripe
2. Criar 9 preços correspondentes
3. Gerar as variáveis de ambiente para você copiar

#### Opção B: Manual no Dashboard

1. Acesse: https://dashboard.stripe.com/test/products/create
2. Crie cada produto seguindo a tabela em `IMPLEMENTATION_SUMMARY.md`
3. Copie os Price IDs manualmente

---

### ✅ Fase 3: Configurar Variáveis de Ambiente (2 min)

Adicione ao seu `.env`:

```bash
# Copie os Price IDs gerados pelo script ou do dashboard

# BASIC
NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_BASIC_QUARTERLY_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID=price_xxxxx

# PRO
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_PRO_QUARTERLY_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_xxxxx

# PREMIUM
NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_PREMIUM_QUARTERLY_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID=price_xxxxx

# Webhook Secret (vem na próxima etapa)
STRIPE_WEBHOOK_SECRET=
```

---

### ✅ Fase 4: Configurar Webhooks (5 min)

#### Desenvolvimento Local

```bash
# Terminal 1: Iniciar app
npm run dev

# Terminal 2: Iniciar webhook listener
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Copie o webhook secret** que aparece no terminal e adicione ao `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

#### Produção (depois do deploy)

1. Vá em: https://dashboard.stripe.com/test/webhooks/create
2. Endpoint URL: `https://seu-dominio.com/api/webhooks/stripe`
3. Eventos para selecionar:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
4. Copie o signing secret para `.env` de produção

---

### ✅ Fase 5: Ativar Nova Página de Pricing (1 min)

```bash
# Renomear páginas
mv app/pricing/page.tsx app/pricing/page_old.tsx
mv app/pricing/page_new.tsx app/pricing/page.tsx

# Ou manter ambas para comparar
# Nova: /pricing (page_new.tsx)
# Antiga: /pricing/old (renomeie page.tsx)
```

---

### ✅ Fase 6: Testar Fluxo Completo (10 min)

#### 1. Iniciar ambiente

```bash
# Terminal 1
npm run dev

# Terminal 2
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

#### 2. Teste de Compra

1. Acesse: http://localhost:3000/pricing
2. Faça login ou cadastre-se
3. Clique em "Assinar Agora" em qualquer plano
4. Use cartão de teste:
   - **Número**: 4242 4242 4242 4242
   - **Data**: 12/34 (qualquer data futura)
   - **CVC**: 123 (qualquer 3 dígitos)
   - **ZIP**: 12345 (qualquer CEP)

#### 3. Verificar Sucesso

**No Terminal 2 (webhooks):**
```
✓ Received event checkout.session.completed
✓ Received event customer.subscription.created
✓ Received event invoice.payment_succeeded
```

**No Banco de Dados:**
```bash
npx prisma studio
```

Verifique:
- ✅ Customer criado com stripeCustomerId
- ✅ Subscription criada com status ACTIVE
- ✅ Payment registrado com status CONFIRMED
- ✅ User.planType atualizado (BASIC, PRO ou PREMIUM)

**No Stripe Dashboard:**
- ✅ Customer criado
- ✅ Subscription ativa
- ✅ Payment recebido

---

## 🎨 Próximas Melhorias (Opcionais)

### 1. Payment Element Customizado

Substituir redirect do Stripe Checkout por formulário embedded.

**Benefícios:**
- Usuário não sai do site
- Design 100% customizado
- Múltiplos métodos de pagamento
- Melhor conversão

**Estimativa**: 2-3 horas

### 2. Dashboard de Assinatura

Adicionar no dashboard do usuário:
- Status da assinatura
- Próxima cobrança
- Histórico de pagamentos
- Botão "Gerenciar Assinatura"

**Estimativa**: 3-4 horas

### 3. Notificações por Email

Enviar emails para:
- Confirmação de compra
- Renovação próxima (7 dias antes)
- Falha de pagamento
- Cancelamento de assinatura

**Estimativa**: 2-3 horas

---

## ⚠️ Troubleshooting

### Erro: "Missing STRIPE_WEBHOOK_SECRET"

**Solução**: Execute `stripe listen` e copie o webhook secret para `.env`

### Erro: "Unknown priceId"

**Solução**: Verifique se o Price ID está no `.env` e se corresponde ao plano correto

### Webhook não recebe eventos

**Solução**:
1. Verifique se `stripe listen` está rodando
2. Verifique se a porta está correta (3000)
3. Verifique logs do webhook no terminal

### Subscription não aparece no banco

**Solução**:
1. Verifique logs do webhook
2. Verifique se o `clerk_user_id` está no metadata
3. Verifique se o usuário existe no banco

---

## 📚 Documentação Útil

- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **Stripe Testing**: https://stripe.com/docs/testing
- **Stripe Checkout**: https://stripe.com/docs/payments/checkout
- **Stripe CLI**: https://stripe.com/docs/stripe-cli

---

## ✨ Tudo Pronto?

Se seguiu todos os passos:

1. ✅ Banco migrado
2. ✅ Produtos criados no Stripe
3. ✅ Webhooks configurados
4. ✅ Pricing page atualizada
5. ✅ Fluxo testado

**Seu sistema de billing está FUNCIONANDO! 🎉**

Agora você pode:
- Aceitar pagamentos reais (trocar para modo live no Stripe)
- Implementar melhorias opcionais
- Focar em outras features do app

---

**Precisa de ajuda?** Verifique o arquivo `IMPLEMENTATION_SUMMARY.md` para detalhes técnicos completos.
