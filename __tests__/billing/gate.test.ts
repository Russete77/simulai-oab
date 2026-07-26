import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/billing/free-access-mode', () => ({
  isFreeAccessModeEnabled: vi.fn(() => false),
}));

import { prisma } from '@/lib/db/prisma';
import { requirePaidPlan } from '@/lib/billing/gate';

const findUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;

describe('requirePaidPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ADMIN_EMAILS;
  });

  it('bloqueia quando não há userId', async () => {
    const result = await requirePaidPlan(null);
    expect(result).toEqual({
      allowed: false,
      reason: 'no_user',
      planType: null,
      subscriptionStatus: null,
    });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('bloqueia quando o usuário não existe no banco', async () => {
    findUnique.mockResolvedValueOnce(null);
    const result = await requirePaidPlan('user_1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('no_user');
  });

  it('bloqueia quando não há subscription', async () => {
    findUnique.mockResolvedValueOnce({
      planType: 'BASIC',
      email: 'aluno@example.com',
      customer: { subscriptions: [] },
    });
    const result = await requirePaidPlan('user_1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('no_subscription');
  });

  it('bloqueia quando a subscription está PAST_DUE (pagamento atrasado)', async () => {
    findUnique.mockResolvedValueOnce({
      planType: 'PRO',
      email: 'aluno@example.com',
      customer: { subscriptions: [{ status: 'PAST_DUE', trialEnd: null }] },
    });
    const result = await requirePaidPlan('user_1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('subscription_inactive');
  });

  it('libera acesso quando a subscription está ACTIVE', async () => {
    findUnique.mockResolvedValueOnce({
      planType: 'PRO',
      email: 'aluno@example.com',
      customer: { subscriptions: [{ status: 'ACTIVE', trialEnd: null }] },
    });
    const result = await requirePaidPlan('user_1');
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('ok');
  });

  it('libera acesso via bypass de ADMIN_EMAILS mesmo sem subscription', async () => {
    process.env.ADMIN_EMAILS = 'fundador@example.com, outro@example.com';
    findUnique.mockResolvedValueOnce({
      planType: 'BASIC',
      email: 'FUNDADOR@example.com', // case-insensitive de propósito
      customer: { subscriptions: [] },
    });
    const result = await requirePaidPlan('user_1');
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('ok');
  });

  it('NÃO libera bypass de admin quando ADMIN_EMAILS não está configurada', async () => {
    // Regressão: lib/admin/auth.ts chegou a ter um fallback hardcoded pra um
    // e-mail fixo quando ADMIN_EMAILS estava ausente. gate.ts sempre falhou
    // fechado aqui — este teste trava esse comportamento.
    findUnique.mockResolvedValueOnce({
      planType: 'BASIC',
      email: 'ninguem-configurado@example.com',
      customer: { subscriptions: [] },
    });
    const result = await requirePaidPlan('user_1');
    expect(result.allowed).toBe(false);
  });
});
