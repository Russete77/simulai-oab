// @ts-nocheck
/**
 * Serviço para gerenciar clientes no Stripe
 */

import { getStripeClient, handleStripeError } from './client';
import type { StripeCustomer, CreateCustomerRequest } from './types';

export class CustomerService {
  private client = getStripeClient();

  /**
   * Criar novo cliente
   */
  async create(data: CreateCustomerRequest): Promise<StripeCustomer> {
    try {
      const customer = await this.client.customers.create({
        email: data.email,
        name: data.name,
        phone: data.phone,
        metadata: data.metadata || {},
        description: data.description,
      });

      return customer as StripeCustomer;
    } catch (error) {
      handleStripeError(error);
    }
  }

  /**
   * Buscar cliente por ID
   */
  async get(customerId: string): Promise<StripeCustomer> {
    try {
      const customer = await this.client.customers.retrieve(customerId);
      return customer as StripeCustomer;
    } catch (error) {
      handleStripeError(error);
    }
  }

  /**
   * Atualizar cliente
   */
  async update(
    customerId: string,
    data: Partial<CreateCustomerRequest>
  ): Promise<StripeCustomer> {
    try {
      const customer = await this.client.customers.update(customerId, {
        email: data.email,
        name: data.name,
        phone: data.phone,
        metadata: data.metadata,
        description: data.description,
      });

      return customer as StripeCustomer;
    } catch (error) {
      handleStripeError(error);
    }
  }

  /**
   * Listar clientes
   */
  async list(params?: {
    email?: string;
    limit?: number;
  }) {
    try {
      const customers = await this.client.customers.list({
        email: params?.email,
        limit: params?.limit || 10,
      });

      return customers;
    } catch (error) {
      handleStripeError(error);
    }
  }

  /**
   * Buscar ou criar cliente por email
   */
  async getOrCreate(data: CreateCustomerRequest): Promise<StripeCustomer> {
    try {
      // Buscar cliente existente por email
      if (data.email) {
        const existing = await this.list({ email: data.email, limit: 1 });

        if (existing.data.length > 0) {
          return existing.data[0] as StripeCustomer;
        }
      }

      // Criar novo cliente
      return this.create(data);
    } catch (error) {
      handleStripeError(error);
    }
  }

  /**
   * Deletar cliente
   */
  async delete(customerId: string): Promise<void> {
    try {
      await this.client.customers.del(customerId);
    } catch (error) {
      handleStripeError(error);
    }
  }
}

// Singleton
let customerServiceInstance: CustomerService | null = null;

export function getCustomerService(): CustomerService {
  if (!customerServiceInstance) {
    customerServiceInstance = new CustomerService();
  }
  return customerServiceInstance;
}
