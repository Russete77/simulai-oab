/**
 * Cliente HTTP para API Stripe
 * Documentação: https://stripe.com/docs/api
 */

import Stripe from 'stripe';

const STRIPE_API_VERSION = '2025-10-29.clover' as const;

export class StripeClient {
  private stripe: Stripe;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.STRIPE_SECRET_KEY;

    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    this.stripe = new Stripe(key, {
      apiVersion: STRIPE_API_VERSION,
      typescript: true,
    });
  }

  /**
   * Retorna a instância do Stripe para acesso direto quando necessário
   */
  getInstance(): Stripe {
    return this.stripe;
  }

  /**
   * Customers
   */
  get customers() {
    return this.stripe.customers;
  }

  /**
   * Subscriptions
   */
  get subscriptions() {
    return this.stripe.subscriptions;
  }

  /**
   * Prices
   */
  get prices() {
    return this.stripe.prices;
  }

  /**
   * Products
   */
  get products() {
    return this.stripe.products;
  }

  /**
   * Payment Intents
   */
  get paymentIntents() {
    return this.stripe.paymentIntents;
  }

  /**
   * Checkout Sessions
   */
  get checkoutSessions() {
    return this.stripe.checkout.sessions;
  }

  /**
   * Webhooks
   */
  get webhooks() {
    return this.stripe.webhooks;
  }
}

export class StripeError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'StripeError';
  }
}

// Singleton instance
let stripeClientInstance: StripeClient | null = null;

export function getStripeClient(): StripeClient {
  if (!stripeClientInstance) {
    stripeClientInstance = new StripeClient();
  }
  return stripeClientInstance;
}

/**
 * Helper para lidar com erros do Stripe
 */
export function handleStripeError(error: any): never {
  if (error instanceof Stripe.errors.StripeError) {
    throw new StripeError(
      error.message,
      error.statusCode || 500,
      error.code,
      error
    );
  }

  throw new StripeError(
    error.message || 'Unknown Stripe error',
    500,
    'unknown',
    error
  );
}
