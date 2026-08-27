# Testar o Stripe em localhost

Tudo em **modo de teste**. Nenhum centavo real é movimentado, e os dados de
teste ficam separados dos de produção no painel.

---

## Passo 1 — Instalar a CLI da Stripe

```
npm install -g @stripe/cli
```

Depois:

```
stripe login
```

Abre o navegador e vincula a CLI à sua conta.

---

## Passo 2 — Criar o produto em modo de teste

⚠️ **Ligue o "Modo de teste"** no canto superior direito do painel antes de
criar. Um `price_` criado em produção **não funciona** com uma `sk_test_` —
a Stripe devolve "No such price".

Painel → Produtos → Criar produto:
- Nome: `Simulai OAB`
- Recorrente · **9,99** · **BRL** · Mensal
- Copie o ID do preço (`price_...`)

Ou pela CLI, que já cria no modo de teste:

```
stripe products create --name "Simulai OAB"
```

```
stripe prices create --product PROD_ID --unit-amount 999 --currency brl -d "recurring[interval]=month"
```

---

## Passo 3 — Escutar os webhooks

Num terminal separado, deixe rodando:

```
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Ele imprime algo como:

```
> Ready! Your webhook signing secret is whsec_abc123...
```

**Esse `whsec_` é o que vai no `.env.local`.** Não é o mesmo do endpoint
cadastrado no painel — aquele só vale para a URL de produção. Trocar os dois
é o erro mais comum, e o sintoma é `assinatura inválida` no log.

O segredo do `stripe listen` muda a cada nova execução, a não ser que você
fixe com `--api-key`. Se o webhook parar de validar depois de reiniciar a CLI,
é isso: copie o novo.

---

## Passo 4 — `.env.local`

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...        # o do `stripe listen`
STRIPE_PRICE_ID=price_...              # o criado em MODO DE TESTE
```

---

## Passo 5 — Subir e testar

```
npm run dev
```

Cartões de teste (qualquer validade futura, qualquer CVC):

| Cartão | O que acontece |
|---|---|
| `4242 4242 4242 4242` | Aprova |
| `4000 0000 0000 9995` | Recusa por saldo insuficiente |
| `4000 0025 0000 3155` | Exige autenticação (3DS) |
| `4000 0000 0000 0341` | Aprova no checkout, **falha na renovação** |

### Roteiro

1. `/pricing` → **Assinar por R$ 9,99/mês** → deve abrir o checkout da Stripe
2. Pagar com `4242` → volta pro `/dashboard?assinatura=ativa`
3. No terminal do `stripe listen`, confirmar `checkout.session.completed` e `invoice.paid` com `[200]`
4. `/dashboard/assinatura` → deve mostrar **Assinatura ativa** e a data da próxima cobrança
5. **Gerenciar assinatura** → abre o portal da Stripe em pt-BR
6. Cancelar no portal → voltar → deve dizer que o acesso vai até o fim do período

### Forçar a renovação sem esperar um mês

```
stripe trigger invoice.paid
```

### Ver se o acesso realmente liberou

```sql
SELECT s.status, s.gateway, s."currentPeriodEnd", p.status AS pagamento, p.value
FROM "Subscription" s
LEFT JOIN "Payment" p ON p."subscriptionId" = s.id
WHERE s.gateway = 'stripe'
ORDER BY s."createdAt" DESC
LIMIT 5;
```

Tem que aparecer `ACTIVE` e um `Payment` com `RECEIVED` / `9.99`. Se a
assinatura estiver ativa mas **não houver Payment**, me avisa — é o bug que
existia no Asaas e que eu corrigi aqui.

---

## Antes de tudo: rode o SQL das colunas

`sql/04-stripe-colunas.sql`. Sem `stripeCustomerId` e `stripeSubscriptionId`
no banco, o webhook falha ao gravar.

---

## Se der errado

| Sintoma | Causa quase certa |
|---|---|
| `assinatura inválida` no log | `whsec_` do painel em vez do `stripe listen` |
| `No such price` | `price_` de produção com chave de teste |
| Webhook não chega | `stripe listen` não está rodando, ou porta diferente de 3000 |
| Paga mas não libera | Rodou o SQL 04? Veja o log `[STRIPE_HANDLER]` |
| Build quebra | Falta uma das 3 variáveis — o erro diz qual |
