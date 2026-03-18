/**
 * API para gerenciar clientes Asaas
 * POST /api/billing/customer — Criar ou obter customer
 * GET /api/billing/customer — Obter customer atual pelo userId
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { findOrCreateAsaasCustomer } from '@/lib/asaas/checkout';

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    const user = await currentUser();

    if (!clerkId || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Resolver Clerk ID → Database User ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    const userId = dbUser.id;

    const body = await req.json();
    const { cpfCnpj, phone } = body as { cpfCnpj: string; phone?: string };

    if (!cpfCnpj) {
      return NextResponse.json(
        { error: 'CPF/CNPJ é obrigatório' },
        { status: 400 }
      );
    }

    const email = user.emailAddresses[0]?.emailAddress;
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || email;

    const asaasCustomerId = await findOrCreateAsaasCustomer(userId, {
      name,
      email,
      cpfCnpj,
      phone,
    });

    return NextResponse.json({
      asaasCustomerId,
      userId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    logger.error('[BILLING_CUSTOMER_POST]', { error: message });
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Resolver Clerk ID → Database User ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    const userId = dbUser.id;

    const customer = await prisma.customer.findFirst({
      where: { userId, gateway: 'asaas' },
      select: {
        id: true,
        asaasCustomerId: true,
        name: true,
        email: true,
        cpfCnpj: true,
        phone: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    logger.error('[BILLING_CUSTOMER_GET]', { error: message });
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
