/**
 * API para verificar status da assinatura do usuário
 * GET /api/billing/status - Obter status da assinatura atual
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCustomerService, getSubscriptionService } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const customerService = getCustomerService();
    const subscriptionService = getSubscriptionService();

    // Buscar cliente por email
    const customers = await customerService.list({ email, limit: 1 });

    if (customers.data.length === 0) {
      return NextResponse.json({
        hasSubscription: false,
        status: 'no_customer',
      });
    }

    const customer = customers.data[0];

    // Buscar assinatura ativa
    const subscription = await subscriptionService.getActiveByCustomer(
      customer.id
    );

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        status: 'no_subscription',
        customerId: customer.id,
      });
    }

    return NextResponse.json({
      hasSubscription: true,
      status: subscription.status,
      customerId: customer.id,
      subscriptionId: subscription.id,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  } catch (error: any) {
    console.error('[BILLING_STATUS_GET]', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
