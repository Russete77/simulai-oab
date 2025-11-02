/**
 * Webhook do Stripe para receber eventos de pagamento e assinatura
 * POST /api/webhooks/stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe';
import {
  handleCheckoutCompleted,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed,
} from '@/lib/stripe/webhook-handlers';
import { PrismaClient } from '@prisma/client';

const stripe = getStripeClient().getInstance();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('[STRIPE_WEBHOOK] Missing signature');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    console.error('[STRIPE_WEBHOOK] Error verifying signature:', error.message);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  console.log(`[STRIPE_WEBHOOK] Received event: ${event.type}`);

  // Log webhook event
  try {
    await prisma.webhookLog.create({
      data: {
        event: event.type,
        payload: event as any,
        processed: false,
      },
    });
  } catch (logError) {
    console.error('[STRIPE_WEBHOOK] Failed to log event:', logError);
  }

  try {
    let webhookLogId: string | null = null;

    switch (event.type) {
      // Eventos de checkout
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      // Eventos de assinatura
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      // Eventos de pagamento
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      // Eventos de cliente
      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer;
        console.log('[STRIPE_WEBHOOK] Customer updated:', customer.id);
        // Customer sync não é crítico, apenas log
        break;
      }

      default:
        console.log(`[STRIPE_WEBHOOK] Unhandled event type: ${event.type}`);
    }

    // Marcar webhook como processado
    try {
      const log = await prisma.webhookLog.findFirst({
        where: { event: event.type },
        orderBy: { createdAt: 'desc' },
      });

      if (log) {
        await prisma.webhookLog.update({
          where: { id: log.id },
          data: { processed: true, processedAt: new Date() },
        });
      }
    } catch (updateError) {
      console.error('[STRIPE_WEBHOOK] Failed to update log:', updateError);
    }

    return NextResponse.json({ received: true, processed: true });
  } catch (error: any) {
    console.error('[STRIPE_WEBHOOK] Error processing event:', error);

    // Salvar erro no log
    try {
      const log = await prisma.webhookLog.findFirst({
        where: { event: event.type },
        orderBy: { createdAt: 'desc' },
      });

      if (log) {
        await prisma.webhookLog.update({
          where: { id: log.id },
          data: {
            processed: false,
            error: error.message || 'Unknown error',
            processedAt: new Date(),
          },
        });
      }
    } catch (logError) {
      console.error('[STRIPE_WEBHOOK] Failed to log error:', logError);
    }

    return NextResponse.json(
      { error: 'Webhook handler failed', message: error.message },
      { status: 500 }
    );
  }
}
