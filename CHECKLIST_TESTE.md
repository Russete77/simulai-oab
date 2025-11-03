# ✅ Checklist de Testes - Sistema de Billing

## 🧪 **TESTES ANTES DE PRODUÇÃO**

Use este checklist para garantir que tudo está funcionando perfeitamente.

---

## 1️⃣ **SETUP INICIAL**

### **Ambiente de Desenvolvimento:**

- [ ] `.env` configurado com todas as variáveis
- [ ] `npm install` executado sem erros
- [ ] Migration do banco executada (`npx prisma migrate dev`)
- [ ] Prisma Client gerado (`npx prisma generate`)
- [ ] App iniciando sem erros (`npm run dev`)
- [ ] Stripe CLI instalado e funcionando

### **Stripe Dashboard:**

- [ ] Conta criada e verificada
- [ ] Modo TEST ativado
- [ ] 9 produtos criados (3 tiers × 3 ciclos)
- [ ] Price IDs copiados para `.env`
- [ ] Webhook endpoint configurado

### **Resend:**

- [ ] Conta criada
- [ ] API Key copiada para `.env`
- [ ] Domínio verificado (ou usando onboarding@resend.dev)
- [ ] Email de teste enviado com sucesso

---

## 2️⃣ **TESTES DE FLUXO**

### **A. Pricing Page:**

- [ ] `/pricing` carrega sem erros
- [ ] Seletor de ciclo funciona (Mensal/Trimestral/Anual)
- [ ] Valores calculados corretamente
- [ ] Descontos exibidos corretamente
- [ ] Botões "Assinar Agora" respondem
- [ ] Plano FREE exibe "Plano Atual" para logado
- [ ] Redirect para `/register` se não logado

### **B. Checkout Page:**

- [ ] `/checkout/[priceId]` carrega
- [ ] Payment Element renderiza
- [ ] Resumo do pedido correto
- [ ] Valor total correto
- [ ] Features do plano listadas
- [ ] Garantia de 7 dias exibida
- [ ] Aceita cartão de teste: `4242 4242 4242 4242`

### **C. Fluxo de Pagamento:**

**Teste 1: Compra Bem-Sucedida**

- [ ] Preencher formulário de checkout
- [ ] Usar cartão: 4242 4242 4242 4242
- [ ] Data: 12/34
- [ ] CVC: 123
- [ ] Clicar "Confirmar Pagamento"
- [ ] Aguardar processamento
- [ ] Redirect para `/dashboard?pagamento=sucesso`

**Verificações pós-compra:**

- [ ] User.planType atualizado no BD
- [ ] Customer criado no BD
- [ ] Subscription criada no BD (status: ACTIVE)
- [ ] Payment registrado no BD (status: CONFIRMED)
- [ ] Email de boas-vindas recebido
- [ ] Email de pagamento confirmado recebido

**No Stripe Dashboard:**

- [ ] Customer criado
- [ ] Subscription ativa
- [ ] Payment Intent succeeded
- [ ] Invoice paid

**Teste 2: Pagamento Falha**

- [ ] Usar cartão que falha: 4000 0000 0000 0002
- [ ] Ver mensagem de erro
- [ ] Não criar subscription
- [ ] Não enviar email de boas-vindas

### **D. Dashboard de Assinatura:**

- [ ] `/dashboard/assinatura` carrega
- [ ] Status da assinatura exibido
- [ ] Badge correto (Ativa, BASIC/PRO/PREMIUM)
- [ ] Próxima cobrança exibida
- [ ] Valor mensal correto
- [ ] Botão "Gerenciar" funciona
- [ ] Histórico de pagamentos lista payments
- [ ] Recibos PDF clicáveis (se disponíveis)

### **E. Stripe Customer Portal:**

- [ ] Botão "Gerenciar" abre portal
- [ ] Informações de pagamento editáveis
- [ ] Cancelamento funciona
- [ ] Reativação funciona (se cancelou)
- [ ] Redirect de volta ao app funciona

---

## 3️⃣ **TESTES DE WEBHOOKS**

### **Setup:**

```bash
# Terminal 1
npm run dev

# Terminal 2
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### **Eventos a Testar:**

**checkout.session.completed:**

- [ ] Dispara ao completar checkout
- [ ] Cria customer no BD
- [ ] Logs no terminal corretos

**customer.subscription.created:**

- [ ] Dispara após checkout
- [ ] Salva subscription no BD
- [ ] Atualiza User.planType
- [ ] Envia email de boas-vindas
- [ ] Logs corretos

**invoice.payment_succeeded:**

- [ ] Dispara após pagamento
- [ ] Cria Payment no BD
- [ ] Envia email de confirmação
- [ ] Valores corretos

**customer.subscription.updated:**

- [ ] Testar upgrade de plano
- [ ] BD atualizado
- [ ] Logs corretos

**customer.subscription.deleted:**

- [ ] Cancelar via Stripe Portal
- [ ] Status mudado para CANCELED
- [ ] User.planType voltou para FREE
- [ ] Email de cancelamento enviado

**invoice.payment_failed:**

- [ ] Simular falha de pagamento (cartão expirado)
- [ ] Payment com status FAILED no BD
- [ ] Email de alerta enviado

---

## 4️⃣ **TESTES DE EMAILS**

### **Checklist de Emails:**

**Assinatura Criada:**

- [ ] Email recebido
- [ ] Assunto correto
- [ ] Nome do usuário correto
- [ ] Nome do plano correto
- [ ] Valor mensal correto
- [ ] Data de próxima cobrança correta
- [ ] Link para dashboard funciona
- [ ] Design bonito e responsivo
- [ ] Abre em mobile corretamente

**Pagamento Confirmado:**

- [ ] Email recebido
- [ ] Valor correto
- [ ] Data correta
- [ ] Link para recibo funciona (se disponível)

**Pagamento Falhou:**

- [ ] Email recebido
- [ ] Tom de urgência adequado
- [ ] Link para atualizar pagamento funciona
- [ ] Motivos listados

**Teste em Diferentes Clientes:**

- [ ] Gmail (web)
- [ ] Outlook (web)
- [ ] Apple Mail (se disponível)
- [ ] Mobile (iPhone/Android)

---

## 5️⃣ **TESTES DE EDGE CASES**

### **Cenários Especiais:**

**Usuário sem email:**

- [ ] Sistema não quebra
- [ ] Usa fallback adequado

**Price ID inválido:**

- [ ] Checkout retorna erro amigável
- [ ] Não quebra app

**Webhook falha:**

- [ ] Log de erro criado
- [ ] Webhook marcado como não processado
- [ ] Sistema continua funcionando

**Multiplas tentativas:**

- [ ] Não cria duplicatas no BD
- [ ] Idempotência funciona

**Cancelamento e Reativação:**

- [ ] Cancelar subscription
- [ ] Reativar antes do fim do período
- [ ] Status atualizado corretamente

---

## 6️⃣ **TESTES DE SEGURANÇA**

### **Autenticação:**

- [ ] Rotas protegidas exigem login
- [ ] `/checkout` redireciona se não logado
- [ ] `/dashboard/assinatura` redireciona se não logado
- [ ] API routes validam auth

### **Autorização:**

- [ ] Usuário só vê própria assinatura
- [ ] Não pode acessar assinatura de outros
- [ ] Webhook valida signature

### **Dados Sensíveis:**

- [ ] API Keys não expostas no frontend
- [ ] Logs não expõem dados de cartão
- [ ] Webhook secret não commitado

---

## 7️⃣ **TESTES DE PERFORMANCE**

### **Load Testing:**

- [ ] 10 usuários simultâneos em `/pricing`
- [ ] 5 checkouts simultâneos
- [ ] Webhooks processam rápido (< 2s)
- [ ] Emails enviam rápido (< 5s)

### **Database:**

- [ ] Queries otimizadas (use `npx prisma studio`)
- [ ] Indexes funcionando
- [ ] Sem N+1 queries

---

## 8️⃣ **TESTES DE UX**

### **Desktop:**

- [ ] Layout responsivo
- [ ] Botões clicáveis
- [ ] Loading states claros
- [ ] Mensagens de erro amigáveis

### **Mobile:**

- [ ] Pricing page adaptada
- [ ] Checkout usável
- [ ] Payment Element responsivo
- [ ] Dashboard legível

### **Acessibilidade:**

- [ ] Cores têm contraste adequado
- [ ] Textos legíveis
- [ ] Formulários acessíveis
- [ ] Loading states com aria-labels

---

## 9️⃣ **TESTES PRÉ-PRODUÇÃO**

### **Ambiente:**

- [ ] Trocar para modo LIVE no Stripe
- [ ] Atualizar webhook URL para produção
- [ ] Domínio verificado no Resend
- [ ] URLs corretas em templates de email
- [ ] NEXT_PUBLIC_APP_URL correto

### **Smoke Tests:**

- [ ] Build de produção sem erros
- [ ] Deploy bem-sucedido
- [ ] Pricing page carrega
- [ ] Checkout funciona
- [ ] Webhooks recebem eventos
- [ ] Emails chegam

---

## 🎯 **CHECKLIST FINAL**

Antes de lançar:

- [ ] Todos os testes acima passando
- [ ] Documentação revisada
- [ ] Equipe treinada
- [ ] Backup do banco
- [ ] Monitoramento configurado (opcional)
- [ ] Plano de rollback definido
- [ ] Suporte preparado para dúvidas

---

## 📊 **RESULTADOS ESPERADOS**

Após completar todos os testes:

✅ **0 erros** em produção
✅ **100% uptime** do billing
✅ **< 2s** resposta de webhooks
✅ **< 5s** envio de emails
✅ **> 90%** satisfação de UX
✅ **0 duplicatas** no BD

---

## 🆘 **SE ALGO FALHAR**

1. Verifique logs no console
2. Verifique Stripe Dashboard > Events
3. Verifique Resend Dashboard > Logs
4. Revise `.env`
5. Confira `IMPLEMENTACAO_COMPLETA.md`
6. Teste em modo incógnito
7. Limpe cache do navegador

---

**Boa sorte com os testes! 🚀**
