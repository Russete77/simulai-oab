/**
 * API para criar Payment Intent no Stripe
 * POST /api/billing/criar-intencao-pagamento
 * Usado para checkout embedded com Payment Element
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getStripeClient, getCustomerService } from '@/lib/stripe';
import { getPlanFromPriceId } from '@/lib/billing/stripe-plan-mapping';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { priceId } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID é obrigatório' },
        { status: 400 }
      );
    }

    // Obter informações do plano
    const planConfig = getPlanFromPriceId(priceId);
    if (!planConfig) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    const stripe = getStripeClient().getInstance();
    const customerService = getCustomerService();

    // Buscar ou criar cliente no Stripe
    const customer = await customerService.getOrCreate({
      email: user.emailAddresses[0]?.emailAddress,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      metadata: {
        clerk_user_id: userId,
      },
    });

    // Obter preço do Stripe para calcular valor
    const price = await stripe.prices.retrieve(priceId);
    const amount = price.unit_amount || 0;

    // Criar Subscription (assinatura recorrente)
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        clerk_user_id: userId,
        plan_tier: planConfig.tier,
        plan_cycle: planConfig.cycle,
      },
    });

    console.log('[CRIAR_INTENCAO_PAGAMENTO] Subscription created:', {
      id: subscription.id,
      status: subscription.status,
      hasInvoice: !!subscription.latest_invoice,
    });

    // Extrair invoice
    let invoice = subscription.latest_invoice as any;
    let paymentIntent = invoice?.payment_intent;

    console.log('[CRIAR_INTENCAO_PAGAMENTO] Initial Payment Intent:', {
      hasPaymentIntent: !!paymentIntent,
      invoiceStatus: invoice?.status,
      invoiceId: invoice?.id,
    });

    // Se o Payment Intent não foi criado, finalizar a invoice para criar
    if (!paymentIntent && invoice?.id) {
      console.log('[CRIAR_INTENCAO_PAGAMENTO] Payment Intent missing, checking invoice status...');

      // Só finalizar se a invoice estiver em draft
      if (invoice.status === 'draft') {
        console.log('[CRIAR_INTENCAO_PAGAMENTO] Invoice is draft, finalizing...');

        invoice = await stripe.invoices.finalizeInvoice(invoice.id, {
          expand: ['payment_intent'],
        });

        paymentIntent = invoice.payment_intent;

        console.log('[CRIAR_INTENCAO_PAGAMENTO] After finalize:', {
          invoiceStatus: invoice.status,
          hasPaymentIntent: !!paymentIntent,
          paymentIntentId: paymentIntent?.id,
        });
      } else {
        // Invoice já finalizada, buscar payment intent diretamente
        console.log('[CRIAR_INTENCAO_PAGAMENTO] Invoice already finalized, retrieving...');

        invoice = await stripe.invoices.retrieve(invoice.id, {
          expand: ['payment_intent'],
        });

        paymentIntent = invoice.payment_intent;

        console.log('[CRIAR_INTENCAO_PAGAMENTO] After retrieve:', {
          invoiceStatus: invoice.status,
          hasPaymentIntent: !!paymentIntent,
          paymentIntentId: paymentIntent?.id,
        });
      }
    }

    console.log('[CRIAR_INTENCAO_PAGAMENTO] Final Payment Intent:', {
      hasPaymentIntent: !!paymentIntent,
      hasClientSecret: !!paymentIntent?.client_secret,
      paymentIntentStatus: paymentIntent?.status,
    });

    if (!paymentIntent?.client_secret) {
      console.error('[CRIAR_INTENCAO_PAGAMENTO] Missing client_secret after finalize', {
        subscriptionId: subscription.id,
        invoiceId: invoice?.id,
        invoiceStatus: invoice?.status,
        paymentIntentId: paymentIntent?.id,
      });
      throw new Error('Erro ao criar subscription - client_secret não encontrado');
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
      customerId: customer.id,
      amount: amount / 100, // Converter para reais
    });
  } catch (error: any) {
    console.error('[CRIAR_INTENCAO_PAGAMENTO]', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
