/**
 * Stripe Integration
 * Exporta todos os serviços e tipos para uso na aplicação
 */

// Cliente
export {
  StripeClient,
  StripeError,
  getStripeClient,
  handleStripeError,
} from './client';

// Serviços
export { CustomerService, getCustomerService } from './customer-service';
export {
  SubscriptionService,
  getSubscriptionService,
} from './subscription-service';
export { CheckoutService, getCheckoutService } from './checkout-service';

// Webhook Handlers
export {
  handleCheckoutCompleted,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed,
} from './webhook-handlers';

// Tipos
export type {
  StripeCustomer,
  CreateCustomerRequest,
  StripeSubscription,
  SubscriptionStatus,
  SubscriptionItem,
  CreateSubscriptionRequest,
  StripePrice,
  StripeProduct,
  StripePaymentIntent,
  PaymentIntentStatus,
  StripeCheckoutSession,
  CreateCheckoutSessionRequest,
  StripeWebhookEvent,
  ListResponse,
  StripeError as StripeErrorType,
} from './types';
