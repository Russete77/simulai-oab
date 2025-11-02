/**
 * API para criar assinaturas e sessões de checkout
 * POST /api/billing/subscribe - Criar sessão de checkout para assinatura
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getCheckoutService, getCustomerService } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { priceId, trialDays } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    const customerService = getCustomerService();
    const checkoutService = getCheckoutService();

    // Buscar ou criar cliente no Stripe
    const customer = await customerService.getOrCreate({
      email: user.emailAddresses[0]?.emailAddress,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      metadata: {
        clerk_user_id: userId,
      },
    });

    // Criar sessão de checkout
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin');

    const session = await checkoutService.createSubscriptionSession({
      customerId: customer.id,
      priceId,
      successUrl: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/pricing`,
      trialDays,
      metadata: {
        clerk_user_id: userId,
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('[BILLING_SUBSCRIBE_POST]', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
