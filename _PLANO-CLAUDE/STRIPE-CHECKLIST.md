# Stripe — o que falta você fazer

O código está pronto e verificado. Faltam a conta e a configuração no painel.

---

## 1. Painel da Stripe

**Conta:** Brasil, liquidação em BRL, conta bancária no mesmo CNPJ. A verificação leva alguns dias — comece por aqui.

**Produto e preço**
- Produtos → Criar produto → nome `Simulai OAB`
- Recorrente · **9,99** · **BRL** · Mensal · Taxa fixa
- Copie o ID do preço (`price_...`) → vira `STRIPE_PRICE_ID`

**Formas de pagamento** (Configurações → Formas de pagamento)
- Deixe **só cartão** ligado. Boleto e Pix desligados.
- O código já força `payment_method_types: ['card']`, mas deixar desligado no painel evita alguém religar sem querer.

**Recuperação de receita** (Configurações → Assinaturas e e-mails) — em recorrência mensal de cartão isso é o que segura churn involuntário:
- Smart Retries: ligado
- Atualizador automático de cartão (CAU): ligado
- Network tokens: ligado

**Portal do cliente** (Configurações → Portal do cliente)
- Ligar · idioma **pt-BR** · logo e cores da marca
- Permitir: cancelar assinatura, atualizar forma de pagamento, ver e baixar faturas
- Opcional: cupom na tela de cancelamento (retenção pronta, sem código)

**Webhook** (Desenvolvedores → Webhooks → Adicionar endpoint)
- URL: `https://www.simulaioab.com/api/webhooks/stripe`
- Eventos:
  - `checkout.session.completed`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `invoice.finalization_failed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `charge.refunded`
- Copie o segredo (`whsec_...`) → vira `STRIPE_WEBHOOK_SECRET`

---

## 2. Banco

Rode `sql/04-stripe-colunas.sql`. É aditivo — só cria duas colunas nuláveis e seus índices. Nenhum dado é alterado.

---

## 3. Variáveis de ambiente (Vercel + `.env.local`)

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
```

Sem as três o **build quebra** de propósito — nada mal configurado chega em produção.

Opcional: `DAILY_AI_EXPLANATIONS_LIMIT` (padrão 20).

---

## 4. Testar em sandbox antes de ir pra produção

Local, com a CLI da Stripe:

```
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Cartões de teste:
- `4242 4242 4242 4242` — sucesso
- `4000 0000 0000 9995` — recusado por saldo insuficiente
- `4000 0025 0000 3155` — exige autenticação

Fluxo a percorrer:
1. Assinar → cai no checkout da Stripe → paga
2. Confirmar que `invoice.paid` chegou e que o acesso liberou
3. Abrir o portal → cancelar → confirmar que o acesso é revogado no fim do período
4. Conferir no Workbench que nenhuma entrega de webhook está falhando

---

## 5. Ainda em aberto (fora do código)

- **Chargebacks.** 6 contestações contra 8 pagamentos em 30 dias no Asaas. A Stripe é mais rígida — resolver a causa antes de migrar volume, ou a conta é encerrada depois da obra pronta. Bloco 3 de `sql/03-desambiguar.sql`.
- **Nota fiscal.** A Stripe não emite. Se o Asaas emitia, precisa de um serviço à parte (eNotas, NFE.io, Focus NFe).
- **Assinantes atuais.** Todos precisam recadastrar — quem paga por PIX ou boleto não tem cartão salvo. A conversa é fácil: R$ 9,99 é mais barato que os dois planos antigos. O webhook do Asaas segue vivo até o último ciclo pago vencer.
