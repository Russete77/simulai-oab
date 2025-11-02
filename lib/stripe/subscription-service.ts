// @ts-nocheck
/**
 * Serviço para gerenciar assinaturas no Stripe
 */

import { getStripeClient, handleStripeError } from './client';
import type { StripeSubscription, CreateSubscriptionRequest } from './types';

export class SubscriptionService {
  private client = getStripeClient();

  /**
   * Criar nova assinatura
   */
  async create(data: CreateSubscriptionRequest): Promise<StripeSubscription> {
    try {
      const subscription = await this.client.subscriptions.create({
        customer: data.customer,
        items: data.items,
        metadata: data.metadata || {},
        payment_behavior: data.payment_behavior || 'default_incomplete',
        payment_settings: data.payment_settings as any,
        trial_period_days: data.trial_period_days,
        expand: ['latest_invoice.payment_intent'],
      });

      return subscription as StripeSubscription;
    } catch (error) {
      handleStripeError(error);
    }
  }

  /**
   * Buscar assinatura por ID
   */
  async get(subscriptionId: string): Promise<StripeSubscription> {
    try {
      const subscription = await this.client.subscriptions.retrieve(
        subscriptionId
      );
      return subscription as StripeSubscription;
    } catch (error) {
      handleStripeError(error);
    }
  }

  /**
   * Atualizar assinatura
   */
  async update(
    subscriptionId: string,
    data: Partial<CreateSubscriptionRequest>
  ): Promise<StripeSubscription> {
    try {
      const subscription = await this.client.subscriptions.update(
        subscriptionId,
        {
          items: data.items,
          metadata: data.metadata,
          trial_end: data.trial_period_days ? 'now' : undefined,
        }
      );

      return subscription as StripeSubscription;
    } catch (error) {
      handleStripeError(error);
    }
  }

  /**
   * Listar assinaturas
   */
  async list(params?: {
    customer?: string;
    status?: string;
    limit?: number;
  }) {
    try {
      const subscriptions = await this.client.subscriptions.list({
        customer: params?.customer,
        status: params?.status as any,
        limit: params?.limit || 10,
      });

      return subscriptions;
    } catch (error) {
      handleStripeError(error);
    }
  }

  /**
   * Cancelar assinatura
   */
  async cancel(
    subscriptionId: string,
    options?: {
      at_period_end?: boolean;
      prorate?: boolean;
    }
  ): Promise<StripeSubscription> {
    try {
      const subscription = await this.client.subscriptions.update(
        subscriptionId,
        {
          cancel_at_period_end: options?.at_period_end || false,
          proration_behavior: options?.prorate ? 'create_prorations' : 'none',
        }
      );

      if (!options?.at_period_end) {
        await this.client.subscriptions.cancel(subscriptionId);
      }

      return subscription as StripeSubscription;
    } catch (error) {
      handleStripeError(error);
    }
  }

  /**
   * Reativar assinatura cancelada
   */
  async reactivate(subscriptionId: string): Promise<StripeSubscription> {
    try {
      const subscription = await this.client.subscriptions.update(
        subscriptionId,
        {
          cancel_at_period_end: false,
        }
      );

      return subscription as StripeSubscription;
    } catch (error) {
      handleStripeError(error);
    }
  }

  /**
   * Buscar assinatura ativa do cliente
   */
  async getActiveByCustomer(
    customerId: string
  ): Promise<StripeSubscription | null> {
    try {
      const subscriptions = await this.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        return subscriptions.data[0] as StripeSubscription;
      }

      return null;
    } catch (error) {
      handleStripeError(error);
    }
  }
}

// Singleton
let subscriptionServiceInstance: SubscriptionService | null = null;

export function getSubscriptionService(): SubscriptionService {
  if (!subscriptionServiceInstance) {
    subscriptionServiceInstance = new SubscriptionService();
  }
  return subscriptionServiceInstance;
}
