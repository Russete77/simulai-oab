import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

/**
 * POST /api/notifications/subscribe
 * Salva a subscription push do usuário
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Subscription inválida' }, { status: 400 });
    }

    // Upsert: atualiza se já existe para este endpoint, senão cria
    await prisma.pushSubscription.upsert({
      where: {
        endpoint: subscription.endpoint,
      },
      update: {
        p256dh: subscription.keys?.p256dh || '',
        auth: subscription.keys?.auth || '',
        userId: user.id,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh || '',
        auth: subscription.keys?.auth || '',
      },
    });

    logger.info('Push subscription saved', {
      userId: user.id,
      endpoint: subscription.endpoint.substring(0, 50) + '...',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Push subscription error:', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return NextResponse.json({ error: 'Erro ao salvar subscription' }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications/subscribe
 * Remove a subscription push do usuário
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint necessário' }, { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({
      where: {
        userId: user.id,
        endpoint,
      },
    });

    logger.info('Push subscription removed', { userId: user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Push unsubscribe error:', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return NextResponse.json({ error: 'Erro ao remover subscription' }, { status: 500 });
  }
}
