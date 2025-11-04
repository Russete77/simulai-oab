# 🎉 Modo de Acesso Gratuito Temporário

## O que é?

Um "kill switch" que permite tornar o SIMULAIOAB **completamente gratuito** para todos os usuários, sem quebrar a arquitetura de planos existente.

## Por que usar?

- 🚀 **Crescimento Rápido**: Remover barreiras para adquirir usuários
- 🧪 **Validação de Mercado**: Testar features premium antes de cobrar
- 🎁 **Promoções**: Oferecer acesso premium temporário
- 📊 **Teste A/B**: Comparar engajamento free vs paid

## Como ativar?

### 1. Em Desenvolvimento

```bash
# .env
ENABLE_FREE_ACCESS_MODE=true
```

### 2. Em Produção (Vercel)

```bash
# Dashboard Vercel → Project Settings → Environment Variables
ENABLE_FREE_ACCESS_MODE = true

# Ou via CLI:
vercel env add ENABLE_FREE_ACCESS_MODE production
# Digite: true
```

### 3. Recarregar aplicação

- **Vercel:** Redeploy automático após mudar env var
- **Local:** Reiniciar `npm run dev`

## O que acontece quando ativo?

✅ **TODOS os usuários ganham acesso PREMIUM:**
- Questões ilimitadas
- Simulados ilimitados
- IA ilimitada (explicações + chat)
- Analytics completo
- Exportar PDF
- Simulados adaptativos

✅ **Estrutura preservada:**
- Tabela `users.planType` continua existindo
- Webhooks Stripe continuam funcionando
- Billing continua registrando pagamentos
- Fácil reverter para planos normais

✅ **Banner visual:**
- Mostra mensagem "Acesso Premium GRATUITO"
- Aparece no topo do app
- Usuário pode fechar (dismissed)

## Como desativar?

```bash
ENABLE_FREE_ACCESS_MODE=false
```

Instantaneamente todos os limites voltam ao normal.

## Casos de Uso

### 1. Lançamento Soft (1-2 meses)

```bash
# Fase 1: Conquistar base de usuários
ENABLE_FREE_ACCESS_MODE=true

# Fase 2: Avisar que voltará a ser pago (2 semanas antes)
# Enviar email: "Aproveite últimas 2 semanas grátis"

# Fase 3: Ativar planos
ENABLE_FREE_ACCESS_MODE=false
```

**Conversão esperada:** 3-5% dos usuários ativos

### 2. Promoção Sazonal

```bash
# Black Friday / Cyber Monday (1 semana)
ENABLE_FREE_ACCESS_MODE=true

# Depois
ENABLE_FREE_ACCESS_MODE=false
# + oferecer desconto 50% para quem gostou
```

### 3. Teste de Features

```bash
# Testar nova feature com usuários FREE
ENABLE_FREE_ACCESS_MODE=true

# Coletar feedback, ajustar

# Tornar premium novamente
ENABLE_FREE_ACCESS_MODE=false
```

## Monitoramento

### Métricas para acompanhar

**Com modo gratuito ATIVO:**
- DAU (Daily Active Users)
- Engagement (questões/dia por usuário)
- Retention D7/D30
- Feature usage (quem usa IA, simulados, analytics)

**Ao DESATIVAR:**
- Conversão FREE → PAID
- Churn rate
- Revenue gerado
- LTV dos convertidos

### Logs

```typescript
// Aparece no console quando ativo:
[FREE_ACCESS_MODE] Modo gratuito ativo - usuário tem acesso PREMIUM
```

## Riscos e Mitigações

### ⚠️ Risco 1: Custos de IA disparam

**Mitigação:**
- Manter rate limiting (10 req/hora por usuário)
- Monitorar gastos OpenAI diariamente
- Ter budget alert configurado

### ⚠️ Risco 2: Usuários acostumam com gratuito

**Mitigação:**
- Sempre avisar que é temporário
- Banner visível "Promoção por tempo limitado"
- Email 2 semanas antes de acabar

### ⚠️ Risco 3: Infraestrutura não aguenta

**Mitigação:**
- Testar com 100, depois 500, depois 1000 usuários
- Monitorar Supabase + Vercel dashboards
- Ter plano de upgrade pronto

## Arquivos Modificados

```
lib/billing/free-access-mode.ts          # Lógica principal
lib/billing/limits.ts                    # Integração com limites
components/layout/free-access-banner.tsx # Banner visual
app/api/config/free-access-mode/route.ts # API para frontend
.env                                     # Configuração
```

## FAQ

**Q: Os pagamentos continuam funcionando?**
A: Sim! Se alguém assinar, será registrado normalmente no DB.

**Q: Posso ativar/desativar múltiplas vezes?**
A: Sim, quantas vezes quiser. É instantâneo.

**Q: Afeta usuários que já pagaram?**
A: Não prejudica. Eles continuam com PREMIUM (mesmo que desative o modo gratuito).

**Q: Como sei quantos se beneficiaram?**
A: Query SQL:
```sql
SELECT COUNT(*) FROM users WHERE planType = 'FREE';
-- Esses são os que teriam acesso restrito se modo off
```

---

**Criado por:** Claude Code Analysis Tool
**Data:** 04/11/2025
