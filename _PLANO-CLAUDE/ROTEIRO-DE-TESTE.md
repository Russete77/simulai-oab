# Roteiro de teste — antes de commitar

Servidor: `http://localhost:3000`
Ordem por risco: o que mexe em dinheiro primeiro.

---

## Bloco 0 — Destrave o Stripe (senão o bloco 1 não roda)

Sem isto o checkout nem abre. São três coisas:

1. Rodar `sql/04-stripe-colunas.sql` no banco (aditivo, não altera dado).
2. Criar o produto **em modo de teste** no painel (R$ 9,99/mês, BRL, recorrente).
3. Num terminal separado, deixar rodando:

```
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

E pôr no `.env.local` — o `whsec_` é o que o `stripe listen` imprime, **não** o do painel:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
```

Detalhes e erros comuns em `STRIPE-LOCALHOST.md`.

---

## Bloco 1 — Pagamento  ⚠️ nada disto foi testado em runtime

O código está escrito e coberto por 17 testes, mas **nenhum centavo passou por ele ainda**.

- [ ] `/pricing` → "Assinar por R$ 9,99/mês" abre o checkout da Stripe
- [ ] Pagar com `4242 4242 4242 4242` → volta pro dashboard
- [ ] No terminal do `stripe listen`: `checkout.session.completed` e `invoice.paid` com `[200]`
- [ ] `/dashboard/assinatura` mostra "Assinatura ativa" e a data da próxima cobrança
- [ ] "Gerenciar assinatura" abre o portal da Stripe **em português**
- [ ] Cancelar no portal → volta dizendo que o acesso vai até o fim do período
- [ ] Conferir que o pagamento foi gravado:

```sql
SELECT s.status, s.gateway, p.status AS pagamento, p.value
FROM "Subscription" s
LEFT JOIN "Payment" p ON p."subscriptionId" = s.id
WHERE s.gateway = 'stripe'
ORDER BY s."createdAt" DESC LIMIT 5;
```

Tem que vir `ACTIVE` **e** um `Payment` `RECEIVED` de 9.99. Se a assinatura ativar sem
pagamento, me avisa — é o bug que existia no Asaas.

- [ ] Cartão `4000 0000 0000 0341`: aprova no checkout e **falha na renovação** — bom pra
      ver o caminho de `past_due` sem esperar um mês

---

## Bloco 2 — Dashboard e primeiro acesso

- [ ] `/dashboard?novo=1` — tela de primeiro acesso (atalho só de desenvolvimento).
      Não pode ter nenhum zero nem o "3%"
- [ ] `/dashboard` — o card do topo continua o que você estava fazendo:
      simulado em andamento → matéria mais fraca → meta genérica
- [ ] O contador `x/20` e "N de 7 dias com estudo" batem com a realidade
- [ ] "Chance de passar" mostra o valor atual **e** o "% possível" ao lado
- [ ] A matéria citada na projeção é a **mesma** do "Ponto mais fraco" no rodapé
      *(era o bug que consertei — as duas contas divergiam)*
- [ ] Três destinos, não seis

## Bloco 3 — Sessão de questões

- [ ] `/practice` — barra de 20 segmentos acima da questão
- [ ] Responder: segmento vira verde (acerto) ou vermelho (erro), contador avança
- [ ] Chegar a 20 → botão vira **"Terminar por hoje"** + "Continuar mesmo assim"
- [ ] A explicação de IA abre e **não** tem botão de chat

## Bloco 4 — Navegação e logo

- [ ] Desktop: 4 itens com ícone + "Mais"
- [ ] Celular: barra inferior fixa, item ativo marcado, "Mais" abre a folha
- [ ] **Modo claro**: o logo aparece inteiro — "SIMUL" preto + selo azul com "Ai"
      *(era um bloco preto sólido antes)*
- [ ] Modo escuro: "SIMUL" branco + o mesmo selo
- [ ] Sem scroll horizontal em 375px

## Bloco 5 — O que foi cortado (tem que dar 404 ou não existir)

- [ ] Menu não tem mais "Revisão"
- [ ] `/flashcards`, `/notificacoes`, `/revisao-inteligente` não existem
- [ ] `/admin` não tem "Notificações" nem "Emails" na sidebar
      *(precisa do seu e-mail em `ADMIN_EMAILS` no `.env.local` — hoje não está,
      por isso `/admin` te joga pra landing)*

---

## O que eu já verifiquei em runtime

Dashboard, practice com resposta e IA, resultado e relatório de simulado,
plano de estudos, menu desktop e mobile, logo nos dois temas, 13 rotas
públicas, sitemap e robots. Console e log do servidor limpos.

## O que ninguém verificou ainda

- **Todo o fluxo de pagamento** (bloco 1) — é o que mais importa
- **Sidebar do admin** — sua conta não está em `ADMIN_EMAILS`
- **Primeiro acesso com conta realmente nova** — só vi pelo atalho `?novo=1`

---

## Antes de qualquer deploy

1. **A `/pricing` e a landing já falam em R$ 9,99** — mas confira o texto inteiro,
   porque copy de plano antigo pode ter sobrado em algum canto que não varri.
2. **O schema ainda tem as tabelas órfãs** (`Notification`, `PushSubscription`,
   `UserQuestionChat`, `ReviewCard`, `EmailCampaign`). Derrubar exige backup — e
   devolve espaço no Supabase, o que pode resolver o limite sozinho.
3. **Os chargebacks.** 6 contestações contra 8 pagamentos em 30 dias no Asaas.
   A Stripe é mais rígida. Entender a causa antes de mover volume.
