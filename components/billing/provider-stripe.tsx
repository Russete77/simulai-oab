'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { stripeAppearance } from '@/lib/stripe/appearance';

// Carregar Stripe.js
if (process.env.NODE_ENV === 'development') console.log('[PROVIDER_STRIPE] Publishable Key:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 20) + '...');

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface ProviderStripeProps {
  clientSecret: string;
  children: React.ReactNode;
}

/**
 * Provider do Stripe Elements
 * Envolve componentes que usam Payment Element
 */
export function ProviderStripe({ clientSecret, children }: ProviderStripeProps) {
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: stripeAppearance,
    locale: 'pt-BR',
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
