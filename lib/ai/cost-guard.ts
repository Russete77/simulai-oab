/**
 * OpenAI Cost Guard — Proteção contra gastos excessivos
 *
 * Rastreia tokens consumidos e bloqueia chamadas quando o limite mensal é atingido.
 * Usa banco de dados para persistência e Redis como cache rápido.
 *
 * Configuração via env:
 *   OPENAI_MONTHLY_BUDGET_USD = "50"  (default: 50 USD)
 */

import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

// Preços por 1M tokens (USD) — atualizar conforme pricing da OpenAI
const TOKEN_COSTS: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
};

const DEFAULT_BUDGET_USD = 50;

function getMonthlyBudget(): number {
  const envBudget = process.env.OPENAI_MONTHLY_BUDGET_USD;
  return envBudget ? parseFloat(envBudget) : DEFAULT_BUDGET_USD;
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Calcula o custo em USD de uma chamada OpenAI
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const costs = TOKEN_COSTS[model] || TOKEN_COSTS["gpt-4o-mini"];
  const inputCost = (promptTokens / 1_000_000) * costs.input;
  const outputCost = (completionTokens / 1_000_000) * costs.output;
  return inputCost + outputCost;
}

/**
 * Registra uso de tokens e retorna o total acumulado no mês
 */
export async function trackUsage(
  model: string,
  promptTokens: number,
  completionTokens: number,
  context?: string
): Promise<{ totalCostUsd: number; budgetRemainingUsd: number; blocked: boolean }> {
  const cost = calculateCost(model, promptTokens, completionTokens);
  const monthKey = getCurrentMonthKey();

  try {
    // Upsert no WebhookLog (reutilizando tabela existente para não precisar de migration)
    // Alternativa: criar tabela AiUsageLog no futuro
    await prisma.webhookLog.create({
      data: {
        eventType: "ai_usage",
        eventId: `${monthKey}-${Date.now()}`,
        payload: {
          model,
          promptTokens,
          completionTokens,
          costUsd: cost,
          monthKey,
          context: context || "unknown",
        },
        processedAt: new Date(),
      },
    });
  } catch (err) {
    logger.warn("Falha ao registrar uso de AI no banco", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const totalCostUsd = await getMonthlySpend();
  const budget = getMonthlyBudget();

  return {
    totalCostUsd,
    budgetRemainingUsd: Math.max(0, budget - totalCostUsd),
    blocked: totalCostUsd >= budget,
  };
}

/**
 * Consulta o gasto acumulado no mês atual
 */
export async function getMonthlySpend(): Promise<number> {
  const monthKey = getCurrentMonthKey();
  const startOfMonth = new Date(`${monthKey}-01T00:00:00Z`);
  const now = new Date();

  try {
    const logs = await prisma.webhookLog.findMany({
      where: {
        eventType: "ai_usage",
        processedAt: {
          gte: startOfMonth,
          lte: now,
        },
      },
      select: {
        payload: true,
      },
    });

    return logs.reduce((total, log) => {
      const payload = log.payload as any;
      return total + (payload?.costUsd || 0);
    }, 0);
  } catch {
    return 0;
  }
}

/**
 * Verifica se o orçamento mensal foi excedido
 * Use antes de cada chamada OpenAI
 */
export async function checkBudget(): Promise<{
  allowed: boolean;
  totalCostUsd: number;
  budgetUsd: number;
  percentUsed: number;
}> {
  const totalCostUsd = await getMonthlySpend();
  const budgetUsd = getMonthlyBudget();
  const percentUsed = (totalCostUsd / budgetUsd) * 100;

  if (percentUsed >= 90 && percentUsed < 100) {
    logger.warn("Orçamento OpenAI acima de 90%", {
      totalCostUsd: totalCostUsd.toFixed(4),
      budgetUsd,
      percentUsed: percentUsed.toFixed(1),
    });
  }

  if (totalCostUsd >= budgetUsd) {
    logger.error("Orçamento OpenAI EXCEDIDO — bloqueando chamadas", {
      totalCostUsd: totalCostUsd.toFixed(4),
      budgetUsd,
    });
  }

  return {
    allowed: totalCostUsd < budgetUsd,
    totalCostUsd,
    budgetUsd,
    percentUsed,
  };
}
