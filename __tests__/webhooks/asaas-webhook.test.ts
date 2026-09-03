import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { AsaasWebhookPayload, AsaasPayment, AsaasSubscription } from '@/lib/asaas/types';
import {
  handlePaymentConfirmed,
  handlePaymentOverdue,
  handlePaymentRefunded,
  handleSubscriptionInactivated,
} from '@/lib/asaas/webhook-handlers';

// Mock prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    webhookLog: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    customer: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn(prisma)),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock email service
// O objeto precisa ser ESTÁVEL entre chamadas. Antes era `vi.fn(() => ({...}))`,
// que devolvia spies novos a cada getServicoEmail() — o teste inspecionava um
// spy diferente do que o handler tinha usado, e a assertiva nunca passava.
const mockEmailService = vi.hoisted(() => ({
  enviarPagamentoConfirmado: vi.fn(),
  enviarPagamentoFalhou: vi.fn(),
  enviarAssinaturaCancelada: vi.fn(),
}));

vi.mock('@/lib/email/servico-email', () => ({
  getServicoEmail: vi.fn(() => mockEmailService),
}));

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { getServicoEmail } from '@/lib/email/servico-email';

describe('Asaas Webhook Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // PAYMENT_CONFIRMED Tests
  // ============================================================================

  describe('handlePaymentConfirmed', () => {
    it('should activate premium when payment is confirmed with valid customer', async () => {
      const payload: AsaasWebhookPayload = {
        id: 'evt_123',
        event: 'PAYMENT_CONFIRMED',
        dateCreated: new Date().toISOString(),
        payment: {
          id: 'pay_123',
          customer: 'cus_456',
          subscription: 'sub_789',
          billingType: 'CREDIT_CARD',
          value: 99.9,
          netValue: 99.9,
          status: 'CONFIRMED',
          dueDate: '2026-03-16',
          paymentDate: '2026-03-16',
          dateCreated: new Date().toISOString(),
        },
      };

      const mockCustomer = {
        id: 'cust_123',
        userId: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        asaasCustomerId: 'cus_456',
        user: { id: 'user_123', planType: 'BASIC' },
      } as any;

      // Persistente, não Once: o handler busca o customer, e activatePremium
      // busca de novo dentro da transação. Com Once, a 2ª busca vinha vazia e
      // o código caía no branch de criar customer.
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(mockCustomer);
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => {
        return fn(prisma);
      });
      vi.mocked(prisma.subscription.upsert).mockResolvedValueOnce({
        id: 'sub_123',
        customerId: 'cust_123',
        asaasSubscriptionId: 'sub_789',
        gateway: 'asaas',
        plan: 'BASIC',
        status: 'ACTIVE',
        value: 99.9,
        cycle: 'MONTHLY',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        canceledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        id: 'user_123',
        email: 'test@example.com',
        clerkId: 'clerk_123',
        planType: 'BASIC',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await handlePaymentConfirmed(payload);

      expect(prisma.customer.findFirst).toHaveBeenCalledWith({
        where: { asaasCustomerId: 'cus_456' },
        include: { user: true },
      });
      expect(prisma.user.update).toHaveBeenCalled();
      const emailService = getServicoEmail();
      expect(emailService.enviarPagamentoConfirmado).toHaveBeenCalled();
    });

    it('should handle payment without subscription', async () => {
      const payload: AsaasWebhookPayload = {
        id: 'evt_124',
        event: 'PAYMENT_CONFIRMED',
        dateCreated: new Date().toISOString(),
        payment: {
          id: 'pay_124',
          customer: 'cus_457',
          subscription: undefined,
          billingType: 'PIX',
          value: 50.0,
          netValue: 50.0,
          status: 'CONFIRMED',
          dueDate: '2026-03-16',
          dateCreated: new Date().toISOString(),
        },
      };

      await handlePaymentConfirmed(payload);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('avulso')
      );
    });

    it('should fallback to externalReference if customer not found', async () => {
      const payload: AsaasWebhookPayload = {
        id: 'evt_125',
        event: 'PAYMENT_CONFIRMED',
        dateCreated: new Date().toISOString(),
        payment: {
          id: 'pay_125',
          customer: 'cus_458',
          subscription: 'sub_790',
          billingType: 'BOLETO',
          value: 99.9,
          netValue: 99.9,
          status: 'CONFIRMED',
          dueDate: '2026-03-16',
          externalReference: 'user_124',
          dateCreated: new Date().toISOString(),
        },
      };

      // Caminho de fallback: customer não existe no banco em nenhuma das duas
      // buscas, então activatePremium cria um a partir do User.
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user_124',
        email: 'fallback@example.com',
        clerkId: 'clerk_124',
        planType: 'BASIC',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      vi.mocked(prisma.customer.create).mockResolvedValue({
        id: 'cust_124',
        userId: 'user_124',
        asaasCustomerId: 'cus_457',
        gateway: 'asaas',
        name: 'fallback@example.com',
        email: 'fallback@example.com',
        cpfCnpj: '',
      } as any);
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => {
        return fn(prisma);
      });

      await handlePaymentConfirmed(payload);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user_124' },
      });
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should log error when customer not found', async () => {
      const payload: AsaasWebhookPayload = {
        id: 'evt_126',
        event: 'PAYMENT_CONFIRMED',
        dateCreated: new Date().toISOString(),
        payment: {
          id: 'pay_126',
          customer: 'cus_999',
          subscription: 'sub_999',
          billingType: 'CREDIT_CARD',
          value: 99.9,
          netValue: 99.9,
          status: 'CONFIRMED',
          dueDate: '2026-03-16',
          dateCreated: new Date().toISOString(),
        },
      };

      vi.mocked(prisma.customer.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      await handlePaymentConfirmed(payload);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Customer não encontrado'),
        expect.any(Object)
      );
    });

    it('should handle missing payment object', async () => {
      const payload: AsaasWebhookPayload = {
        id: 'evt_127',
        event: 'PAYMENT_CONFIRMED',
        dateCreated: new Date().toISOString(),
      };

      await handlePaymentConfirmed(payload);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('PAYMENT_CONFIRMED sem dados de payment')
      );
    });
  });

  // ============================================================================
  // PAYMENT_OVERDUE Tests
  // ============================================================================

  describe('handlePaymentOverdue', () => {
    it('should set subscription status to PAST_DUE', async () => {
      const payload: AsaasWebhookPayload = {
        id: 'evt_200',
        event: 'PAYMENT_OVERDUE',
        dateCreated: new Date().toISOString(),
        payment: {
          id: 'pay_200',
          customer: 'cus_500',
          subscription: 'sub_600',
          billingType: 'CREDIT_CARD',
          value: 99.9,
          netValue: 99.9,
          status: 'OVERDUE',
          dueDate: '2026-02-16',
          dateCreated: new Date().toISOString(),
        },
      };

      const mockCustomer = {
        id: 'cust_200',
        userId: 'user_200',
        email: 'overdue@example.com',
        name: 'Overdue User',
        asaasCustomerId: 'cus_500',
        user: { id: 'user_200', planType: 'BASIC' },
      } as any;

      vi.mocked(prisma.customer.findFirst).mockResolvedValueOnce(mockCustomer);
      vi.mocked(prisma.subscription.updateMany).mockResolvedValueOnce({
        count: 1,
      });

      await handlePaymentOverdue(payload);

      expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
        where: {
          asaasSubscriptionId: 'sub_600',
          customerId: 'cust_200',
        },
        data: { status: 'PAST_DUE' },
      });
      const emailService = getServicoEmail();
      expect(emailService.enviarPagamentoFalhou).toHaveBeenCalled();
    });

    it('should handle missing payment object', async () => {
      const payload: AsaasWebhookPayload = {
        id: 'evt_201',
        event: 'PAYMENT_OVERDUE',
        dateCreated: new Date().toISOString(),
      };

      await handlePaymentOverdue(payload);

      expect(prisma.subscription.updateMany).not.toHaveBeenCalled();
    });

    it('should handle customer not found gracefully', async () => {
      const payload: AsaasWebhookPayload = {
        id: 'evt_202',
        event: 'PAYMENT_OVERDUE',
        dateCreated: new Date().toISOString(),
        payment: {
          id: 'pay_202',
          customer: 'cus_501',
          subscription: 'sub_601',
          billingType: 'CREDIT_CARD',
          value: 99.9,
          netValue: 99.9,
          status: 'OVERDUE',
          dueDate: '2026-02-16',
          dateCreated: new Date().toISOString(),
        },
      };

      vi.mocked(prisma.customer.findFirst).mockResolvedValueOnce(null);

      await handlePaymentOverdue(payload);

      expect(prisma.subscription.updateMany).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // PAYMENT_REFUNDED Tests
  // ============================================================================

  describe('handlePaymentRefunded', () => {
    it('should log refunded payment without changing subscription', async () => {
      const payload: AsaasWebhookPayload = {
        id: 'evt_300',
        event: 'PAYMENT_REFUNDED',
        dateCreated: new Date().toISOString(),
        payment: {
          id: 'pay_300',
          customer: 'cus_600',
          subscription: 'sub_700',
          billingType: 'CREDIT_CARD',
          value: 99.9,
          netValue: 99.9,
          status: 'REFUNDED',
          dueDate: '2026-03-16',
          paymentDate: '2026-03-10',
          dateCreated: new Date().toISOString(),
        },
      };

      await handlePaymentRefunded(payload);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Pagamento estornado/deletado'),
        expect.any(Object)
      );
    });

    it('should handle missing payment object', async () => {
      const payload: AsaasWebhookPayload = {
        id: 'evt_301',
        event: 'PAYMENT_REFUNDED',
        dateCreated: new Date().toISOString(),
      };

      await handlePaymentRefunded(payload);

      expect(logger.info).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // SUBSCRIPTION_INACTIVATED Tests
  // ============================================================================

  describe('handleSubscriptionInactivated', () => {
    it('should deactivate premium subscription', async () => {
      const payload: AsaasWebhookPayload = {
        id: 'evt_400',
        event: 'SUBSCRIPTION_INACTIVATED',
        dateCreated: new Date().toISOString(),
        subscription: {
          id: 'sub_800',
          customer: 'cus_700',
          billingType: 'CREDIT_CARD',
          value: 99.9,
          nextDueDate: '2026-04-16',
          cycle: 'MONTHLY',
          description: 'Premium Plan',
          status: 'INACTIVE',
          dateCreated: new Date().toISOString(),
        },
      };

      const mockCustomer = {
        id: 'cust_300',
        userId: 'user_300',
        email: 'cancel@example.com',
        name: 'Cancel User',
        asaasCustomerId: 'cus_700',
        user: { id: 'user_300', planType: 'BASIC' },
      } as any;

      vi.mocked(prisma.customer.findFirst).mockResolvedValueOnce(mockCustomer);
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => {
        return fn(prisma);
      });
      vi.mocked(prisma.subscription.updateMany).mockResolvedValueOnce({
        count: 1,
      });
      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        id: 'user_300',
        email: 'cancel@example.com',
        clerkId: 'clerk_300',
        planType: 'BASIC',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await handleSubscriptionInactivated(payload);

      expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
        where: { asaasSubscriptionId: 'sub_800' },
        data: { status: 'CANCELED', canceledAt: expect.any(Date) },
      });
      // Não muda mais planType ao cancelar (removido FREE) — gate.ts bloqueia via Subscription.status
      const emailService = getServicoEmail();
      expect(emailService.enviarAssinaturaCancelada).toHaveBeenCalled();
    });

    it('should fallback to externalReference if customer not found', async () => {
      const payload: AsaasWebhookPayload = {
        id: 'evt_401',
        event: 'SUBSCRIPTION_INACTIVATED',
        dateCreated: new Date().toISOString(),
        subscription: {
          id: 'sub_801',
          customer: 'cus_701',
          billingType: 'CREDIT_CARD',
          value: 99.9,
          nextDueDate: '2026-04-16',
          cycle: 'MONTHLY',
          description: 'Premium Plan',
          status: 'INACTIVE',
          externalReference: 'user_301',
          dateCreated: new Date().toISOString(),
        },
      };

      vi.mocked(prisma.customer.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => {
        return fn(prisma);
      });

      await handleSubscriptionInactivated(payload);

      expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
        where: { asaasSubscriptionId: 'sub_801' },
        data: { status: 'CANCELED', canceledAt: expect.any(Date) },
      });
    });

    it('should log error when customer and externalReference not found', async () => {
      const payload: AsaasWebhookPayload = {
        id: 'evt_402',
        event: 'SUBSCRIPTION_INACTIVATED',
        dateCreated: new Date().toISOString(),
        subscription: {
          id: 'sub_802',
          customer: 'cus_702',
          billingType: 'CREDIT_CARD',
          value: 99.9,
          nextDueDate: '2026-04-16',
          cycle: 'MONTHLY',
          description: 'Premium Plan',
          status: 'INACTIVE',
          dateCreated: new Date().toISOString(),
        },
      };

      vi.mocked(prisma.customer.findFirst).mockResolvedValueOnce(null);

      await handleSubscriptionInactivated(payload);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Customer não encontrado para cancelamento'),
        expect.any(Object)
      );
    });

    it('should handle missing subscription object', async () => {
      const payload: AsaasWebhookPayload = {
        id: 'evt_403',
        event: 'SUBSCRIPTION_INACTIVATED',
        dateCreated: new Date().toISOString(),
      };

      await handleSubscriptionInactivated(payload);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('SUBSCRIPTION_INACTIVATED sem dados de subscription')
      );
    });
  });

  // ============================================================================
  // Integration & Edge Cases
  // ============================================================================

  describe('Idempotency and Error Handling', () => {
    it('should be safe to call handlePaymentConfirmed multiple times', async () => {
      const payload: AsaasWebhookPayload = {
        id: 'evt_idem_1',
        event: 'PAYMENT_CONFIRMED',
        dateCreated: new Date().toISOString(),
        payment: {
          id: 'pay_idem_1',
          customer: 'cus_idem_1',
          subscription: 'sub_idem_1',
          billingType: 'CREDIT_CARD',
          value: 99.9,
          netValue: 99.9,
          status: 'CONFIRMED',
          dueDate: '2026-03-16',
          dateCreated: new Date().toISOString(),
        },
      };

      const mockCustomer = {
        id: 'cust_idem_1',
        userId: 'user_idem_1',
        email: 'idem@example.com',
        name: 'Idem User',
        asaasCustomerId: 'cus_idem_1',
        user: { id: 'user_idem_1', planType: 'BASIC' },
      } as any;

      vi.mocked(prisma.customer.findFirst).mockResolvedValue(mockCustomer);
      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        return fn(prisma);
      });
      vi.mocked(prisma.subscription.upsert).mockResolvedValue({
        id: 'sub_idem_1',
        customerId: 'cust_idem_1',
        asaasSubscriptionId: 'sub_idem_1',
        gateway: 'asaas',
        plan: 'BASIC',
        status: 'ACTIVE',
        value: 99.9,
        cycle: 'MONTHLY',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        canceledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user_idem_1',
        email: 'idem@example.com',
        clerkId: 'clerk_idem_1',
        planType: 'BASIC',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Call multiple times
      await handlePaymentConfirmed(payload);
      await handlePaymentConfirmed(payload);
      await handlePaymentConfirmed(payload);

      // upsert should be used (not insert), making it safe for duplicates
      expect(prisma.subscription.upsert).toHaveBeenCalledTimes(3);
    });

    it('should handle email service errors gracefully', async () => {
      const payload: AsaasWebhookPayload = {
        id: 'evt_email_err',
        event: 'PAYMENT_CONFIRMED',
        dateCreated: new Date().toISOString(),
        payment: {
          id: 'pay_email_err',
          customer: 'cus_email_err',
          subscription: 'sub_email_err',
          billingType: 'CREDIT_CARD',
          value: 99.9,
          netValue: 99.9,
          status: 'CONFIRMED',
          dueDate: '2026-03-16',
          dateCreated: new Date().toISOString(),
        },
      };

      const mockCustomer = {
        id: 'cust_email_err',
        userId: 'user_email_err',
        email: 'email-error@example.com',
        name: 'Email Error User',
        asaasCustomerId: 'cus_email_err',
        user: { id: 'user_email_err', planType: 'BASIC' },
      } as any;

      vi.mocked(prisma.customer.findFirst).mockResolvedValueOnce(mockCustomer);
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => {
        return fn(prisma);
      });
      vi.mocked(prisma.subscription.upsert).mockResolvedValueOnce({
        id: 'sub_email_err',
        customerId: 'cust_email_err',
        asaasSubscriptionId: 'sub_email_err',
        gateway: 'asaas',
        plan: 'BASIC',
        status: 'ACTIVE',
        value: 99.9,
        cycle: 'MONTHLY',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        canceledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        id: 'user_email_err',
        email: 'email-error@example.com',
        clerkId: 'clerk_email_err',
        planType: 'BASIC',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const emailService = getServicoEmail();
      vi.mocked(emailService.enviarPagamentoConfirmado).mockRejectedValueOnce(
        new Error('Email service down')
      );

      // Should not throw, email error should be caught and logged
      await handlePaymentConfirmed(payload);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Erro ao enviar email'),
        expect.any(Object)
      );
    });
  });
});
