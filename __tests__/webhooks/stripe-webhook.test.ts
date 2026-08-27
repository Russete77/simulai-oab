import { describe, it, expect, beforeEach, vi } from 'vitest';
import type Stripe from 'stripe';

vi.mock('@/lib/db/prisma', () => {
  const tx = {
    subscription: { upsert: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
    payment: { upsert: vi.fn(), updateMany: vi.fn() },
    user: { update: vi.fn() },
    customer: { findUnique: vi.fn(), update: vi.fn() },
  };
  return {
    prisma: {
      ...tx,
      $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
      __tx: tx,
    },
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import {
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleSubscriptionChanged,
  handleFinalizationFailed,
  handlePaymentActionRequired,
} from '@/lib/stripe/webhook-handlers';

const tx = (prisma as unknown as { __tx: Record<string, any> }).__tx;

const CUSTOMER = {
  id: 'cust_1',
  userId: 'user_1',
  stripeCustomerId: 'cus_stripe_1',
  email: 'aluno@example.com',
  name: 'Aluno',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.customer.findUnique).mockResolvedValue(CUSTOMER as any);
  vi.mocked(tx.subscription.upsert).mockResolvedValue({ id: 'sub_local_1' } as any);
  vi.mocked(tx.payment.upsert).mockResolvedValue({} as any);
  vi.mocked(tx.user.update).mockResolvedValue({} as any);
  vi.mocked(prisma.subscription.updateMany).mockResolvedValue({ count: 1 } as any);
});

// Fatura no formato da API 2025-03-31.basil ou posterior, onde o id da
// assinatura mudou de `invoice.subscription` para
// `invoice.parent.subscription_details.subscription`.
function invoiceNova(over: Record<string, unknown> = {}) {
  return {
    id: 'in_1',
    customer: 'cus_stripe_1',
    amount_paid: 999,
    due_date: 1_800_000_000,
    hosted_invoice_url: 'https://stripe.test/fatura',
    invoice_pdf: 'https://stripe.test/fatura.pdf',
    parent: { subscription_details: { subscription: 'sub_stripe_1' } },
    lines: { data: [{ period: { start: 1_800_000_000, end: 1_802_592_000 } }] },
    ...over,
  } as unknown as Stripe.Invoice;
}

describe('Stripe — invoice.paid libera o acesso', () => {
  it('marca a assinatura como ACTIVE e promove o usuário', async () => {
    await handleInvoicePaid(invoiceNova());

    expect(tx.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeSubscriptionId: 'sub_stripe_1' },
        update: expect.objectContaining({ status: 'ACTIVE' }),
      })
    );
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user_1' } })
    );
  });

  it('grava o Payment — a integração anterior nunca gravava', async () => {
    await handleInvoicePaid(invoiceNova());

    expect(tx.payment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { externalPaymentId: 'in_1' },
        create: expect.objectContaining({
          value: 9.99,
          status: 'RECEIVED',
          paymentMethod: 'CARD',
        }),
      })
    );
  });

  it('ainda entende o formato legado (invoice.subscription)', async () => {
    const legada = invoiceNova();
    delete (legada as unknown as { parent?: unknown }).parent;
    (legada as unknown as { subscription: string }).subscription = 'sub_legado';

    await handleInvoicePaid(legada);

    expect(tx.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { stripeSubscriptionId: 'sub_legado' } })
    );
  });

  it('ignora fatura avulsa, sem assinatura', async () => {
    const avulsa = invoiceNova();
    delete (avulsa as unknown as { parent?: unknown }).parent;

    await handleInvoicePaid(avulsa);

    expect(tx.subscription.upsert).not.toHaveBeenCalled();
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('não libera acesso se o customer não existe no banco', async () => {
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(null as any);

    await handleInvoicePaid(invoiceNova());

    expect(tx.user.update).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('Stripe — mudanças de status da assinatura', () => {
  const casos: Array<[Stripe.Subscription.Status, string]> = [
    ['active', 'ACTIVE'],
    ['past_due', 'PAST_DUE'],
    ['canceled', 'CANCELED'],
    ['unpaid', 'UNPAID'],
    ['trialing', 'TRIALING'],
    ['incomplete_expired', 'INCOMPLETE_EXPIRED'],
    ['paused', 'PAUSED'],
  ];

  it.each(casos)('mapeia %s para %s', async (stripeStatus, nosso) => {
    await handleSubscriptionChanged({
      id: 'sub_stripe_1',
      status: stripeStatus,
      cancel_at_period_end: false,
      canceled_at: null,
      items: { data: [{ current_period_start: 1, current_period_end: 2 }] },
    } as unknown as Stripe.Subscription);

    expect(prisma.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: nosso }) })
    );
  });

  it('adota assinatura criada fora do app em vez de ignorá-la', async () => {
    // Assinatura criada pelo painel da Stripe: o updateMany não acha linha.
    // Antes o handler só avisava, e o cliente pagava sem ganhar acesso.
    vi.mocked(prisma.subscription.updateMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.subscription.create).mockResolvedValue({ id: 'nova' } as any);

    await handleSubscriptionChanged({
      id: 'sub_de_fora',
      status: 'active',
      customer: 'cus_stripe_1',
      cancel_at_period_end: false,
      canceled_at: null,
      metadata: { userId: 'user_1' },
      items: { data: [{ price: { unit_amount: 999 } }] },
    } as unknown as Stripe.Subscription);

    expect(prisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          stripeSubscriptionId: 'sub_de_fora',
          status: 'ACTIVE',
          value: 9.99,
        }),
      })
    );
  });

  it('registra erro quando nem o customer é conhecido', async () => {
    vi.mocked(prisma.subscription.updateMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(null as any);

    await handleSubscriptionChanged({
      id: 'sub_orfa',
      status: 'active',
      customer: 'cus_desconhecido',
      cancel_at_period_end: false,
      canceled_at: null,
      items: { data: [] },
    } as unknown as Stripe.Subscription);

    expect(prisma.subscription.create).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('Stripe — falhas', () => {
  it('payment_failed marca PAST_DUE sem revogar acesso', async () => {
    await handleInvoicePaymentFailed(invoiceNova({ attempt_count: 2 }));

    expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: 'sub_stripe_1' },
      data: { status: 'PAST_DUE' },
    });
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('finalization_failed é registrado como erro — assinatura ativa sem cobrar', async () => {
    await handleFinalizationFailed(
      invoiceNova({ last_finalization_error: { message: 'endereço inválido' } })
    );

    expect(logger.error).toHaveBeenCalled();
  });
});

describe('Stripe — autenticação (3DS)', () => {
  it('payment_action_required deixa a assinatura INCOMPLETE e registra', async () => {
    await handlePaymentActionRequired(
      invoiceNova({ hosted_invoice_url: 'https://stripe.test/autenticar' })
    );

    expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: 'sub_stripe_1' },
      data: { status: 'INCOMPLETE' },
    });
    expect(logger.warn).toHaveBeenCalled();
  });

  it('ignora fatura sem assinatura', async () => {
    const avulsa = invoiceNova();
    delete (avulsa as unknown as { parent?: unknown }).parent;

    await handlePaymentActionRequired(avulsa);

    expect(prisma.subscription.updateMany).not.toHaveBeenCalled();
  });
});
