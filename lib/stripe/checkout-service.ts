// @ts-nocheck
/**
 * Serviço para gerenciar checkout sessions no Stripe
 */

import { getStripeClient, handleStripeError } from './client';
import type {
  StripeCheckoutSession,
  CreateCheckoutSessionRequest,
} from './types';

export class CheckoutService {
  private client = getStripeClient();

  /**
   * Criar sessão de checkout
   */
  async createSession(
    data: CreateCheckoutSessionRequest
  ): Promise<StripeCheckoutSession> {
    try {
      const session = await this.client.checkoutSessions.create({
        mode: data.mode,
        success_url: data.success_url,
        cancel_url: data.cancel_url,
        customer: data.customer,
        customer_email: data.customer_email,
        line_items: data.line_items,
        metadata: data.metadata || {},
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        automatic_tax: { enabled: false },
      });

      return session as StripeCheckoutSession;
    } catch (error) {
      handleStripeError(error);
    }
  }

  /**
   * Buscar sessão de checkout por ID
   */
  async getSession(sessionId: string): Promise<StripeCheckoutSession> {
    try {
      const session =
        await this.client.checkoutSessions.retrieve(sessionId);
      return session as StripeCheckoutSession;
    } catch (error) {
      handleStripeError(error);
    }
  }

  /**
   * Criar sessão de checkout para assinatura
   */
  async createSubscriptionSession(params: {
    customerId?: string;
    customerEmail?: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    trialDays?: number;
    metadata?: Record<string, string>;
  }): Promise<StripeCheckoutSession> {
    try {
      const sessionData: CreateCheckoutSessionRequest = {
        mode: 'subscription',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        metadata: params.metadata,
      };

      if (params.customerId) {
        sessionData.customer = params.customerId;
      } else if (params.customerEmail) {
        sessionData.customer_email = params.customerEmail;
      }

      const session = await this.client.checkoutSessions.create({
        ...sessionData,
        subscription_data: params.trialDays
          ? {
              trial_period_days: params.trialDays,
            }
          : undefined,
      });

      return session as StripeCheckoutSession;
    } catch (error) {
      handleStripeError(error);
    }
  }

  /**
   * Criar sessão de checkout para pagamento único
   */
  async createPaymentSession(params: {
    customerId?: string;
    customerEmail?: string;
    priceId: string;
    quantity?: number;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<StripeCheckoutSession> {
    const sessionData: CreateCheckoutSessionRequest = {
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      line_items: [
        {
          price: params.priceId,
          quantity: params.quantity || 1,
        },
      ],
      metadata: params.metadata,
    };

    if (params.customerId) {
      sessionData.customer = params.customerId;
    } else if (params.customerEmail) {
      sessionData.customer_email = params.customerEmail;
    }

    return this.createSession(sessionData);
  }

  /**
   * Criar portal do cliente (para gerenciar assinatura)
   */
  async createCustomerPortal(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<{ url: string }> {
    try {
      const session = await this.client.getInstance().billingPortal.sessions.create({
        customer: params.customerId,
        return_url: params.returnUrl,
      });

      return { url: session.url };
    } catch (error) {
      handleStripeError(error);
    }
  }
}

// Singleton
let checkoutServiceInstance: CheckoutService | null = null;

export function getCheckoutService(): CheckoutService {
  if (!checkoutServiceInstance) {
    checkoutServiceInstance = new CheckoutService();
  }
  return checkoutServiceInstance;
}
