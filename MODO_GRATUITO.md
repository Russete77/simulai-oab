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

# Opcional: Definir data de término
FREE_ACCESS_END_DATE=2025-12-31

# Necessário para emails
RESEND_API_KEY=your-resend-api-key
CRON_SECRET=your-random-secret-key
```

### 2. Em Produção (Vercel)

```bash
# Dashboard Vercel → Project Settings → Environment Variables
ENABLE_FREE_ACCESS_MODE = true
FREE_ACCESS_END_DATE = 2025-12-31  # Opcional

# Para sistema de emails
RESEND_API_KEY = your-resend-api-key
CRON_SECRET = your-random-secret-key

# Ou via CLI:
vercel env add ENABLE_FREE_ACCESS_MODE production
vercel env add FREE_ACCESS_END_DATE production
vercel env add RESEND_API_KEY production
vercel env add CRON_SECRET production
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

## Sistema de Avisos por Email 📧

### Avisos Automáticos

Quando você define `FREE_ACCESS_END_DATE`, o sistema **envia emails automaticamente** para avisar os usuários:

**Cronograma de emails:**
- **14 dias antes**: Email amarelo "⏰ Faltam 14 dias"
- **7 dias antes**: Email amarelo "⏰ Faltam 7 dias"
- **3 dias antes**: Email laranja urgente "⚠️ Faltam 3 dias!"
- **1 dia antes**: Email vermelho "⚠️ ÚLTIMO DIA!"

### Como funciona?

1. **Cron Job Vercel** roda todo dia às 10h (horário UTC)
2. Verifica `getDaysUntilEnd()`
3. Se `isNearingEnd() === true` (≤14 dias), envia emails
4. Busca todos usuários `planType = 'FREE'`
5. Envia email personalizado com contagem regressiva

### Configuração do Cron

O arquivo `vercel.json` já está configurado:

```json
{
  "crons": [
    {
      "path": "/api/cron/free-access-email-reminder",
      "schedule": "0 10 * * *"
    }
  ]
}
```

**Horário:** Todo dia às 10:00 UTC (07:00 BRT)

### Testar manualmente

```bash
# Em desenvolvimento (GET sem auth)
curl http://localhost:3000/api/cron/free-access-email-reminder

# Em produção (POST com auth)
curl -X POST https://simulaioab.com/api/cron/free-access-email-reminder \
  -H "Authorization: Bearer seu-cron-secret"
```

### Banner Inteligente

O banner no frontend muda automaticamente baseado na urgência:

| Dias Restantes | Cor | Ícone | Comportamento |
|----------------|-----|-------|---------------|
| > 14 dias | Verde | 🎉 | Normal, mostra data |
| 2-14 dias | Laranja | ⏰ | Urgente, contagem regressiva |
| Último dia | Vermelho | ⚠️ | CRÍTICO, pulsando + botão CTA |

### Template do Email

O email inclui:
- **Countdown visual** em destaque
- **Lista de benefícios** que aproveitou
- **CTA "Ver Planos Premium"** com link direto
- **Explicação clara** do que acontece após o término

## Riscos e Mitigações

### ⚠️ Risco 1: Custos de IA disparam

**Mitigação:**
- Manter rate limiting (10 req/hora por usuário)
- Monitorar gastos OpenAI diariamente
- Ter budget alert configurado

### ⚠️ Risco 2: Usuários acostumam com gratuito

**Mitigação:**
- ✅ Banner sempre visível "Por tempo limitado"
- ✅ Emails automáticos 14 dias antes
- ✅ Contagem regressiva nos últimos 3 dias
- ✅ Mensagem clara sobre volta ao plano FREE

### ⚠️ Risco 3: Infraestrutura não aguenta

**Mitigação:**
- Testar com 100, depois 500, depois 1000 usuários
- Monitorar Supabase + Vercel dashboards
- Ter plano de upgrade pronto

## Arquivos do Sistema

### Core
```
lib/billing/free-access-mode.ts                      # Lógica principal + datas
lib/billing/limits.ts                                # Integração com limites
```

### Frontend
```
components/layout/free-access-banner.tsx             # Banner inteligente
app/api/config/free-access-mode/route.ts             # API para frontend
```

### Emails
```
lib/email/config.ts                                  # Config + tipo FIM_ACESSO_GRATUITO
lib/email/servico-email.ts                           # Template + enviarFimAcessoGratuito()
app/api/cron/free-access-email-reminder/route.ts     # Cron job para avisos
```

### Configuração
```
.env.example                                         # Variáveis de ambiente
vercel.json                                          # Config do cron job
MODO_GRATUITO.md                                     # Esta documentação
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

**Q: Os emails são enviados automaticamente?**
A: Sim! Se você definir `FREE_ACCESS_END_DATE`, o cron job envia emails automaticamente quando faltar 14 dias ou menos.

**Q: Posso desativar os emails?**
A: Sim. Não defina `FREE_ACCESS_END_DATE` ou não configure `RESEND_API_KEY`.

**Q: Quantos emails serão enviados?**
A: O sistema envia 1 email por dia durante os últimos 14 dias. Total máximo: 14 emails por usuário.

**Q: E se o usuário assinar antes do fim?**
A: O cron job só envia para `planType = 'FREE'`. Se o usuário assinar, vira PREMIUM e para de receber avisos.

**Q: Como testar o sistema de emails localmente?**
A: Configure RESEND_API_KEY e FREE_ACCESS_END_DATE no .env, depois acesse:
```bash
curl http://localhost:3000/api/cron/free-access-email-reminder
```

---

**Criado por:** Claude Code Analysis Tool
**Data:** 04/11/2025
