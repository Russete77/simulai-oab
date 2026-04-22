/**
 * Client HTTP tipado para a API do Asaas v3
 *
 * Endpoints: sandbox.asaas.com/api/v3 (dev) | api.asaas.com/api/v3 (prod)
 * Auth: Header `access_token`
 *
 * Uso:
 *   import { asaas } from '@/lib/asaas/client';
 *   const customer = await asaas.createCustomer({ name, email, cpfCnpj });
 */

import { logger } from '@/lib/logger';
import type {
  AsaasCustomer,
  AsaasSubscription,
  AsaasPayment,
  AsaasPixQrCode,
  AsaasPaginatedResponse,
  CreateCustomerRequest,
  CreateSubscriptionRequest,
} from './types';

function getApiKey(): string {
  return process.env.ASAAS_API_KEY || '';
}

function getBaseUrl(): string {
  const key = getApiKey();
  // Detectar ambiente pela chave: $aact_prod_ = produção, qualquer outra = sandbox
  // Docs: https://docs.asaas.com/reference/about-this-doc
  const isProdKey = key.startsWith('$aact_prod_');

  if (isProdKey) {
    return 'https://api.asaas.com/v3';
  }
  return process.env.ASAAS_SANDBOX_URL || 'https://api-sandbox.asaas.com/v3';
}

class AsaasClient {
  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, any>
  ): Promise<T> {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('ASAAS_API_KEY não configurada. Adicione ao .env');
    }

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}${path}`;
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          access_token: apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const errorMsg = `Asaas API Error [${response.status}] ${method} ${path}: ${JSON.stringify(errorBody)}`;
        logger.error(errorMsg, { status: response.status, duration, path });
        throw new Error(errorMsg);
      }

      logger.debug('Asaas API call', { method, path, duration });
      return response.json();
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Asaas API Error')) {
        throw error;
      }
      const duration = Date.now() - startTime;
      logger.error('Asaas API network error', {
        method,
        path,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ==========================================================================
  // CUSTOMERS
  // ==========================================================================

  async createCustomer(data: CreateCustomerRequest): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>('POST', '/customers', data);
  }

  async getCustomer(id: string): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>('GET', `/customers/${id}`);
  }

  async getCustomerByEmail(email: string): Promise<AsaasPaginatedResponse<AsaasCustomer>> {
    return this.request<AsaasPaginatedResponse<AsaasCustomer>>(
      'GET',
      `/customers?email=${encodeURIComponent(email)}`
    );
  }

  async getCustomerByCpf(cpfCnpj: string): Promise<AsaasPaginatedResponse<AsaasCustomer>> {
    return this.request<AsaasPaginatedResponse<AsaasCustomer>>(
      'GET',
      `/customers?cpfCnpj=${encodeURIComponent(cpfCnpj)}`
    );
  }

  // ==========================================================================
  // SUBSCRIPTIONS
  // ==========================================================================

  async createSubscription(data: CreateSubscriptionRequest): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>('POST', '/subscriptions', data);
  }

  async getSubscription(id: string): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>('GET', `/subscriptions/${id}`);
  }

  async updateSubscription(
    id: string,
    data: Partial<Pick<CreateSubscriptionRequest, 'billingType' | 'value' | 'nextDueDate' | 'cycle' | 'description'>>
  ): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>('PUT', `/subscriptions/${id}`, data);
  }

  async cancelSubscription(id: string): Promise<{ deleted: boolean; id: string }> {
    return this.request<{ deleted: boolean; id: string }>('DELETE', `/subscriptions/${id}`);
  }

  async getSubscriptionPayments(id: string): Promise<AsaasPaginatedResponse<AsaasPayment>> {
    return this.request<AsaasPaginatedResponse<AsaasPayment>>(
      'GET',
      `/subscriptions/${id}/payments`
    );
  }

  // ==========================================================================
  // PAYMENTS
  // ==========================================================================

  async getPayment(id: string): Promise<AsaasPayment> {
    return this.request<AsaasPayment>('GET', `/payments/${id}`);
  }

  async getPaymentPixQrCode(id: string): Promise<AsaasPixQrCode> {
    return this.request<AsaasPixQrCode>('GET', `/payments/${id}/pixQrCode`);
  }

  async getPaymentBankSlip(id: string): Promise<{ url: string }> {
    return this.request<{ url: string }>('GET', `/payments/${id}/identificationField`);
  }

  async refundPayment(id: string): Promise<AsaasPayment> {
    return this.request<AsaasPayment>('POST', `/payments/${id}/refund`);
  }

  /**
   * Lista pagamentos por status com paginação.
   * Usado pelo job de reconciliação.
   */
  async listPaymentsByStatus(
    status: 'RECEIVED' | 'CONFIRMED' | 'PENDING' | 'OVERDUE',
    limit = 100,
    offset = 0
  ): Promise<AsaasPaginatedResponse<AsaasPayment>> {
    return this.request<AsaasPaginatedResponse<AsaasPayment>>(
      'GET',
      `/payments?status=${status}&limit=${limit}&offset=${offset}`
    );
  }
}

export const asaas = new AsaasClient();
