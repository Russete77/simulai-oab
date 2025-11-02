/**
 * API para criar sessão do portal do cliente Stripe
 * POST /api/billing/portal - Criar portal para gerenciar assinatura
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCheckoutService } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const checkoutService = getCheckoutService();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin');

    const portal = await checkoutService.createCustomerPortal({
      customerId,
      returnUrl: `${baseUrl}/dashboard`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (error: any) {
    console.error('[BILLING_PORTAL_POST]', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
