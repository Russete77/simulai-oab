/**
 * Tipos TypeScript para integração com Stripe
 * Documentação: https://stripe.com/docs/api
 */

// Tipos de Customer
export interface StripeCustomer {
  id: string;
  object: 'customer';
  email: string | null;
  name: string | null;
  phone: string | null;
  metadata: Record<string, string>;
  created: number;
  livemode: boolean;
}

export interface CreateCustomerRequest {
  email?: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
  description?: string;
}

// Tipos de Subscription
export interface StripeSubscription {
  id: string;
  object: 'subscription';
  customer: string;
  status: SubscriptionStatus;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  items: {
    data: SubscriptionItem[];
  };
  metadata: Record<string, string>;
  created: number;
}

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'paused';

export interface SubscriptionItem {
  id: string;
  price: {
    id: string;
    product: string;
    unit_amount: number;
    currency: string;
    recurring: {
      interval: 'day' | 'week' | 'month' | 'year';
      interval_count: number;
    };
  };
  quantity: number;
}

export interface CreateSubscriptionRequest {
  customer: string;
  items: Array<{
    price: string;
    quantity?: number;
  }>;
  metadata?: Record<string, string>;
  payment_behavior?: 'default_incomplete' | 'error_if_incomplete' | 'allow_incomplete';
  payment_settings?: {
    payment_method_types?: string[];
  };
  trial_period_days?: number;
}

// Tipos de Price
export interface StripePrice {
  id: string;
  object: 'price';
  product: string;
  unit_amount: number;
  currency: string;
  recurring: {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number;
  } | null;
  active: boolean;
  metadata: Record<string, string>;
}

// Tipos de Product
export interface StripeProduct {
  id: string;
  object: 'product';
  name: string;
  description: string | null;
  active: boolean;
  metadata: Record<string, string>;
}

// Tipos de Payment Intent
export interface StripePaymentIntent {
  id: string;
  object: 'payment_intent';
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  customer: string | null;
  metadata: Record<string, string>;
  client_secret: string;
}

export type PaymentIntentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded';

// Tipos de Checkout Session
export interface StripeCheckoutSession {
  id: string;
  object: 'checkout.session';
  url: string | null;
  customer: string | null;
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  status: 'open' | 'complete' | 'expired';
  success_url: string;
  cancel_url: string;
}

export interface CreateCheckoutSessionRequest {
  mode: 'payment' | 'setup' | 'subscription';
  success_url: string;
  cancel_url: string;
  customer?: string;
  customer_email?: string;
  line_items?: Array<{
    price: string;
    quantity: number;
  }>;
  metadata?: Record<string, string>;
}

// Tipos de Webhook
export interface StripeWebhookEvent {
  id: string;
  object: 'event';
  type: string;
  data: {
    object: any;
  };
  created: number;
  livemode: boolean;
}

// Tipos de resposta genéricos
export interface ListResponse<T> {
  object: 'list';
  data: T[];
  has_more: boolean;
  url: string;
}

export interface StripeError {
  type: string;
  message: string;
  code?: string;
  param?: string;
  status?: number;
}
