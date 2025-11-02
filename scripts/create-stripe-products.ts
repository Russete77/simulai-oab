/**
 * Script para criar produtos e preços no Stripe automaticamente
 * Execute: npx tsx scripts/create-stripe-products.ts
 */

import 'dotenv/config';
import Stripe from 'stripe';
import { PLANS } from '../lib/billing/plans';

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY não encontrado no .env');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
});

interface ProductConfig {
  tier: string;
  cycle: string;
  name: string;
  description: string;
  amount: number; // em reais
  interval: 'month' | 'year';
  intervalCount: number;
}

const PRODUCTS: ProductConfig[] = [
  // BASIC
  {
    tier: 'BASIC',
    cycle: 'MONTHLY',
    name: 'Simulai OAB - Básico Mensal',
    description: PLANS.BASIC.MONTHLY.description,
    amount: PLANS.BASIC.MONTHLY.value,
    interval: 'month',
    intervalCount: 1,
  },
  {
    tier: 'BASIC',
    cycle: 'QUARTERLY',
    name: 'Simulai OAB - Básico Trimestral',
    description: PLANS.BASIC.QUARTERLY.description,
    amount: PLANS.BASIC.QUARTERLY.value,
    interval: 'month',
    intervalCount: 3,
  },
  {
    tier: 'BASIC',
    cycle: 'YEARLY',
    name: 'Simulai OAB - Básico Anual',
    description: PLANS.BASIC.YEARLY.description,
    amount: PLANS.BASIC.YEARLY.value,
    interval: 'year',
    intervalCount: 1,
  },

  // PRO
  {
    tier: 'PRO',
    cycle: 'MONTHLY',
    name: 'Simulai OAB - Pro Mensal',
    description: PLANS.PRO.MONTHLY.description,
    amount: PLANS.PRO.MONTHLY.value,
    interval: 'month',
    intervalCount: 1,
  },
  {
    tier: 'PRO',
    cycle: 'QUARTERLY',
    name: 'Simulai OAB - Pro Trimestral',
    description: PLANS.PRO.QUARTERLY.description,
    amount: PLANS.PRO.QUARTERLY.value,
    interval: 'month',
    intervalCount: 3,
  },
  {
    tier: 'PRO',
    cycle: 'YEARLY',
    name: 'Simulai OAB - Pro Anual',
    description: PLANS.PRO.YEARLY.description,
    amount: PLANS.PRO.YEARLY.value,
    interval: 'year',
    intervalCount: 1,
  },

  // PREMIUM
  {
    tier: 'PREMIUM',
    cycle: 'MONTHLY',
    name: 'Simulai OAB - Premium Mensal',
    description: PLANS.PREMIUM.MONTHLY.description,
    amount: PLANS.PREMIUM.MONTHLY.value,
    interval: 'month',
    intervalCount: 1,
  },
  {
    tier: 'PREMIUM',
    cycle: 'QUARTERLY',
    name: 'Simulai OAB - Premium Trimestral',
    description: PLANS.PREMIUM.QUARTERLY.description,
    amount: PLANS.PREMIUM.QUARTERLY.value,
    interval: 'month',
    intervalCount: 3,
  },
  {
    tier: 'PREMIUM',
    cycle: 'YEARLY',
    name: 'Simulai OAB - Premium Anual',
    description: PLANS.PREMIUM.YEARLY.description,
    amount: PLANS.PREMIUM.YEARLY.value,
    interval: 'year',
    intervalCount: 1,
  },
];

async function createProducts() {
  console.log('🚀 Criando produtos no Stripe...\n');

  const results: Array<{ tier: string; cycle: string; priceId: string }> = [];

  for (const config of PRODUCTS) {
    try {
      console.log(`📦 Criando: ${config.name}`);

      // Criar produto
      const product = await stripe.products.create({
        name: config.name,
        description: config.description,
        metadata: {
          tier: config.tier,
          cycle: config.cycle,
        },
      });

      console.log(`   ✅ Produto criado: ${product.id}`);

      // Criar preço
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(config.amount * 100), // Converter para centavos
        currency: 'brl',
        recurring: {
          interval: config.interval,
          interval_count: config.intervalCount,
        },
        metadata: {
          tier: config.tier,
          cycle: config.cycle,
        },
      });

      console.log(`   ✅ Preço criado: ${price.id}`);
      console.log(`   💰 Valor: R$ ${config.amount.toFixed(2)}\n`);

      results.push({
        tier: config.tier,
        cycle: config.cycle,
        priceId: price.id,
      });
    } catch (error: any) {
      console.error(`   ❌ Erro ao criar ${config.name}:`, error.message);
    }
  }

  // Gerar variáveis de ambiente
  console.log('\n✨ Concluído! Adicione estas variáveis ao seu .env:\n');
  console.log('# ========================================');
  console.log('# STRIPE PRICE IDs');
  console.log('# ========================================\n');

  results.forEach(({ tier, cycle, priceId }) => {
    const envKey = `NEXT_PUBLIC_STRIPE_${tier}_${cycle}_PRICE_ID`;
    console.log(`${envKey}=${priceId}`);
  });

  console.log('\n# ========================================\n');
}

// Executar
createProducts()
  .then(() => {
    console.log('✅ Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro ao executar script:', error);
    process.exit(1);
  });
