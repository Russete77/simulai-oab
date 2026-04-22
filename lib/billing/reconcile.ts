/**
 * Reconciliação Asaas ↔ Banco (safety net)
 *
 * Mesmo que o webhook falhe (URL errada, token inválido, timeout, fila pausada),
 * este job garante que todo pagamento RECEIVED/CONFIRMED no Asaas vire acesso PRO/BASIC no banco.
 *
 * Idempotente — pode rodar N vezes. Rode a cada 10 min via Vercel Cron.
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { asaas } from '@/lib/asaas/client';
import { ASAAS_PLANS, type AsaasPlanKey } from '@/lib/asaas/checkout';
import type { AsaasPayment } from '@/lib/asaas/types';

type PlanTier = 'FREE' | 'BASIC' | 'PRO' | 'PREMIUM';

export interface ReconcileResult {
  totalFromAsaas: number;
  reconciled: number;
  skipped: number;
  errors: Array<{ paymentId: string; reason: string }>;
  activated: Array<{ email: string; plan: PlanTier; paymentId: string }>;
}

function detectPlanKey(
  value?: number,
  description?: string | null
): AsaasPlanKey | null {
  if (value) {
    for (const [key, plan] of Object.entries(ASAAS_PLANS)) {
      if (Math.abs(plan.value - value) <= 0.5) return key as AsaasPlanKey;
    }
  }
  if (description) {
    const d = description.toLowerCase();
    if (d.includes(' pro ') || d.includes('pro -') || d.includes('com ia')) {
      return 'PRO_MONTHLY';
    }
    if (d.includes('essencial') || d.includes('basic')) {
      return 'BASIC_MONTHLY';
    }
  }
  return null;
}

async function fetchPayments(status: 'RECEIVED' | 'CONFIRMED'): Promise<AsaasPayment[]> {
  const all: AsaasPayment[] = [];
  let offset = 0;
  while (true) {
    const page = await asaas.listPaymentsByStatus(status, 100, offset);
    all.push(...page.data);
    if (!page.hasMore) break;
    offset += 100;
  }
  return all;
}

export async function reconcileAsaasPayments(): Promise<ReconcileResult> {
  const result: ReconcileResult = {
    totalFromAsaas: 0, reconciled: 0, skipped: 0, errors: [], activated: [],
  };

  const [received, confirmed] = await Promise.all([
    fetchPayments('RECEIVED'),
    fetchPayments('CONFIRMED'),
  ]);
  const payments = [...received, ...confirmed];
  result.totalFromAsaas = payments.length;

  for (const p of payments) {
    try {
      if (!p.subscription) { result.skipped++; continue; }

      let userId: string | null = null;
      if (p.externalReference) {
        const u = await prisma.user.findUnique({ where: { id: p.externalReference } });
        if (u) userId = u.id;
      }
      if (!userId) {
        const c = await prisma.customer.findFirst({ where: { asaasCustomerId: p.customer } });
        if (c) userId = c.userId;
      }
      if (!userId) { result.skipped++; continue; }

      const planKey = detectPlanKey(p.value, p.description);
      if (!planKey) {
        result.errors.push({ paymentId: p.id, reason: `plano indetectável (R$${p.value})` });
        continue;
      }
      const planConfig = ASAAS_PLANS[planKey];
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) continue;

      await prisma.$transaction(async (tx) => {
        let customer = await tx.customer.findFirst({ where: { userId: userId! } });
        if (!customer) {
          customer = await tx.customer.create({
            data: {
              userId: userId!, asaasCustomerId: p.customer, gateway: 'asaas',
              name: user.name || user.email, email: user.email, cpfCnpj: '',
            },
          });
        } else if (customer.asaasCustomerId !== p.customer) {
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: { asaasCustomerId: p.customer, gateway: 'asaas' },
          });
        }

        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        const sub = await tx.subscription.upsert({
          where: { asaasSubscriptionId: p.subscription! },
          update: { status: 'ACTIVE', plan: planKey, value: planConfig.value },
          create: {
            customerId: customer.id, asaasSubscriptionId: p.subscription!,
            gateway: 'asaas', plan: planKey, status: 'ACTIVE',
            value: planConfig.value, cycle: 'MONTHLY',
            currentPeriodStart: p.paymentDate ? new Date(p.paymentDate) : new Date(),
            currentPeriodEnd: periodEnd,
          },
        });

        await tx.payment.upsert({
          where: { externalPaymentId: p.id },
          update: { status: p.status as any, updatedAt: new Date() },
          create: {
            customerId: customer.id, subscriptionId: sub.id,
            externalPaymentId: p.id, value: p.value, netValue: p.netValue,
            status: p.status as any,
            paymentMethod: (p.billingType === 'CREDIT_CARD' ? 'CARD' : p.billingType) as any,
            dueDate: new Date(p.dueDate),
            paymentDate: p.paymentDate ? new Date(p.paymentDate) : null,
            confirmedDate: p.paymentDate ? new Date(p.paymentDate) : null,
            externalReference: p.externalReference ?? null,
            description: p.description ?? null,
            invoiceUrl: p.invoiceUrl ?? null,
          },
        });

        const rank = (t: PlanTier): number =>
          ({ FREE: 0, BASIC: 1, PRO: 2, PREMIUM: 2 } as const)[t];
        if (rank(planConfig.tier) > rank(user.planType as PlanTier)) {
          await tx.user.update({
            where: { id: userId! },
            data: { planType: planConfig.tier },
          });
          result.activated.push({ email: user.email, plan: planConfig.tier, paymentId: p.id });
        }
      });

      result.reconciled++;
    } catch (err) {
      logger.error('[RECONCILE] Falha em pagamento', {
        paymentId: p.id,
        error: err instanceof Error ? err.message : String(err),
      });
      result.errors.push({
        paymentId: p.id,
        reason: err instanceof Error ? err.message : 'unknown',
      });
    }
  }

  logger.info('[RECONCILE] Concluído', {
    total: result.totalFromAsaas,
    reconciled: result.reconciled,
    activated: result.activated.length,
    errors: result.errors.length,
  });

  return result;
}
