/**
 * API para gerenciar clientes do Stripe
 * POST /api/billing/customer - Criar ou obter cliente
 * GET /api/billing/customer - Obter cliente atual
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCustomerService } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email, name, phone } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const customerService = getCustomerService();

    // Buscar ou criar cliente
    const customer = await customerService.getOrCreate({
      email,
      name,
      phone,
      metadata: {
        clerk_user_id: userId,
      },
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('[BILLING_CUSTOMER_POST]', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const customerService = getCustomerService();
    const customer = await customerService.get(customerId);

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('[BILLING_CUSTOMER_GET]', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
