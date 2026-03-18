# 🎮 Sistema de Gamificação - Simulai OAB

## ✅ Implementado

### 1. Sistema de Pontos (`lib/gamification/points.ts`)

**Como Funciona:**
- **Pontos base**: 100 pontos por resposta correta
- **Bônus de velocidade**: +50 pontos se responder em < 30 segundos
- **Multiplicador de dificuldade**:
  - EASY: 0.8x
  - MEDIUM: 1.0x
  - HARD: 1.5x
  - VERY_HARD: 2.0x
- **Bônus de streak**: 10 pontos por dia consecutivo

**Exemplos:**
```typescript
// Resposta EASY em 25s com 5 dias de streak
// (100 + 50) * 0.8 + (5 * 10) = 170 pontos

// Resposta HARD em 45s com 10 dias de streak
// (100 + 0) * 1.5 + (10 * 10) = 250 pontos

// Resposta VERY_HARD em 20s com 15 dias de streak
// (100 + 50) * 2.0 + (15 * 10) = 450 pontos
```

### 2. Sistema de Níveis

**Cálculo:** `level = floor(sqrt(totalPoints / 1000)) + 1`

**Progressão:**
- Level 1: 0-999 pontos
- Level 2: 1.000-3.999 pontos
- Level 3: 4.000-8.999 pontos
- Level 4: 9.000-15.999 pontos
- Level 5: 16.000-24.999 pontos
- Level 10: 81.000+ pontos

### 3. Sistema de Streak

**Regras:**
- Estudar no mesmo dia: streak mantém
- Estudar no dia seguinte: streak +1
- Pular 1+ dias: streak reseta para 1

### 4. Sistema de Conquistas (`lib/gamification/achievements.ts`)

**11 Conquistas Implementadas:**

| Conquista | Pontos | Condição |
|-----------|--------|----------|
| 🎯 Primeira Acertada | 50 | 1 resposta correta |
| 🔥 Sequência 7 Dias | 200 | 7 dias consecutivos |
| 🔥 Sequência 30 Dias | 1.000 | 30 dias consecutivos |
| 🏆 Simulado Perfeito | 500 | 100% em um simulado |
| 📚 Mestre da Matéria | 300 | 90% em uma matéria (mín. 20 questões) |
| ⚡ Velocista | 250 | 10 questões < 30s |
| 🎓 Centurião | 200 | 100 questões |
| 🎓 Veterano | 500 | 500 questões |
| 🎓 Lenda | 1.000 | 1.000 questões |
| 📝 Maratonista | 300 | 10 simulados completos |
| 🎯 Certeiro | 400 | 80% acerto geral (mín. 50 questões) |

### 5. Integração na API

**Automática em `/api/questions/answer`:**
1. ✅ Calcula pontos baseado em velocidade, dificuldade e streak
2. ✅ Atualiza nível do usuário
3. ✅ Mantém/incrementa/reseta streak
4. ✅ Verifica e desbloqueia conquistas
5. ✅ Adiciona pontos das conquistas

## 📊 Campos Atualizados no UserProfile

```typescript
{
  totalPoints: number,    // Soma de todos os pontos
  level: number,          // Calculado automaticamente
  streak: number,         // Dias consecutivos estudando
  lastStudyDate: DateTime // Para calcular streak
}
```

## 🎯 Como Testar

### 1. Responder Questão
```bash
POST /api/questions/answer
{
  "questionId": "...",
  "alternativeId": "...",
  "timeSpent": 25,  // < 30s = bônus
  "confidence": 5
}
```

### 2. Ver Pontos no Dashboard
- O dashboard já mostra `totalPoints` e `level`
- Streak aparece como badge

### 3. Verificar Conquistas
```bash
GET /api/profile/achievements  # Criar esta rota se necessário
```

## 🚀 Próximos Passos (Opcional)

### UI de Conquistas
- [ ] Modal de desbloqueio de conquista
- [ ] Página de todas as conquistas
- [ ] Progress bars para conquistas próximas

### Notificações
- [ ] Toast quando desbloqueia conquista
- [ ] Notificação de novo nível
- [ ] Alerta de streak em risco

### Leaderboard
- [ ] Top 10 usuários por pontos
- [ ] Top por matéria
- [ ] Ranking semanal/mensal

## 📝 Observações

1. **Performance**: Conquistas são verificadas apenas quando o usuário acerta uma questão
2. **Cache**: Considerar cache Redis para leaderboards
3. **Histórico**: Todas as ações são registradas no banco (UserAnswer)
4. **Rollback**: Se precisar recalcular pontos, há histórico completo

## 🔧 Manutenção

### Adicionar Nova Conquista

1. Edite `lib/gamification/achievements.ts`
2. Adicione ao array `ACHIEVEMENTS`:

```typescript
{
  key: "NEW_ACHIEVEMENT",
  name: "🎖️ Nome",
  description: "Descrição",
  icon: "🎖️",
  points: 300,
  condition: (stats) => stats.totalQuestions >= 50,
}
```

3. A conquista será automaticamente verificada e desbloqueada

### Ajustar Pontuação

Edite `lib/gamification/points.ts`:
- `BASE_POINTS`: pontos base
- `SPEED_BONUS`: bônus de velocidade
- `DIFFICULTY_MULTIPLIERS`: multiplicadores
- `STREAK_BONUS_PER_DAY`: bônus por dia de streak

---

**Sistema 100% funcional e integrado!** 🎉
