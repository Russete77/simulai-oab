/**
 * Deixa a conta Stripe do jeito que o app espera.
 *
 * Cria (ou reaproveita) o produto, os quatro preços, acerta os eventos do
 * webhook e configura o portal do cliente. Roda igual em teste e em live —
 * a única diferença é de qual arquivo ele lê a chave.
 *
 *   TESTE                                    LIVE
 *   lê STRIPE_SECRET_KEY de .env.local       lê STRIPE_LIVE_SECRET_KEY de
 *                                            .env.producao.local
 *
 * COMO USAR
 *
 *   Em seco (não escreve nada, só diz o que faria):
 *     npx tsx scripts/stripe-setup.ts
 *     npx tsx scripts/stripe-setup.ts --live
 *
 *   Para valer:
 *     npx tsx scripts/stripe-setup.ts --aplicar
 *     npx tsx scripts/stripe-setup.ts --live --aplicar
 *
 * É idempotente: rodar de novo não duplica nada.
 */

import fs from 'node:fs';
import path from 'node:path';
import Stripe from 'stripe';
import { CICLOS, PLANO, formatarBRL, porMesCentavos } from '../lib/stripe/plan';

const LIVE = process.argv.includes('--live');
const APLICAR = process.argv.includes('--aplicar');

// Com WWW: o apex responde 307 para www, e a Stripe NÃO segue redirect em
// webhook — trata 3xx como entrega falhada. www é o canônico.
const URL_WEBHOOK = 'https://www.simulaioab.com/api/webhooks/stripe';

/** Exatamente os eventos que lib/stripe/webhook-handlers.ts trata. */
const EVENTOS: Stripe.WebhookEndpointUpdateParams.EnabledEvent[] = [
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.payment_action_required',
  'invoice.finalization_failed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'charge.refunded',
];

function lerChave(): string {
  const arquivo = LIVE ? '.env.producao.local' : '.env.local';
  const nome = LIVE ? 'STRIPE_LIVE_SECRET_KEY' : 'STRIPE_SECRET_KEY';
  const caminho = path.join(process.cwd(), arquivo);

  if (!fs.existsSync(caminho)) {
    throw new Error(`Não achei ${arquivo}. Precisa de ${nome}=... dentro dele.`);
  }

  const chave =
    fs
      .readFileSync(caminho, 'utf8')
      .match(new RegExp(`^\\s*${nome}\\s*=\\s*(.+?)\\s*$`, 'm'))?.[1] ?? '';

  const prefixo = LIVE ? 'sk_live_' : 'sk_test_';
  if (!chave.startsWith(prefixo)) {
    throw new Error(
      `${nome} em ${arquivo} precisa começar com ${prefixo}. ` +
        (LIVE
          ? 'Chave de teste não cria nada em modo live.'
          : 'Para mexer em live use --live.')
    );
  }
  return chave;
}

async function produto(stripe: Stripe): Promise<string> {
  const existentes = await stripe.products.list({ active: true, limit: 100 });
  const achado = existentes.data.find((p) => p.metadata?.app === 'simulai-oab');

  if (achado) {
    console.log(`  produto      reaproveitado   ${achado.id}  "${achado.name}"`);
    return achado.id;
  }
  if (!APLICAR) {
    console.log(`  produto      SERIA CRIADO    "${PLANO.nome}"`);
    return '(a criar)';
  }

  const criado = await stripe.products.create({
    name: PLANO.nome,
    description: PLANO.descricao,
    metadata: { app: 'simulai-oab' },
  });
  console.log(`  produto      CRIADO          ${criado.id}  "${criado.name}"`);
  return criado.id;
}

async function precos(stripe: Stripe, produtoId: string): Promise<void> {
  for (const c of CICLOS) {
    const rotulo = `${c.rotulo.padEnd(11)}`;
    const valor = `${formatarBRL(c.totalCentavos).padStart(10)}  (${formatarBRL(porMesCentavos(c))}/mês${c.descontoPercent ? `, -${c.descontoPercent}%` : ''})`;

    const achados = await stripe.prices.list({
      lookup_keys: [c.lookupKey],
      active: true,
      limit: 1,
    });
    const atual = achados.data[0];

    if (atual && atual.unit_amount === c.totalCentavos && atual.currency === PLANO.moeda) {
      console.log(`  ${rotulo}  ja correto      ${atual.id}  ${valor}`);
      continue;
    }

    if (atual) {
      // Preço na Stripe é imutável: não dá para editar o valor. O jeito é
      // criar outro e levar a lookup_key junto, que é o que aponta para ele.
      console.log(
        `  ${rotulo}  VALOR MUDOU     ${atual.id} tem ${formatarBRL(atual.unit_amount ?? 0)}, queremos ${formatarBRL(c.totalCentavos)}`
      );
    }

    if (!APLICAR) {
      console.log(`  ${rotulo}  SERIA CRIADO    ${valor}`);
      continue;
    }

    const criado = await stripe.prices.create({
      product: produtoId,
      unit_amount: c.totalCentavos,
      currency: PLANO.moeda,
      recurring: { interval: c.intervalo, interval_count: c.intervaloContagem },
      lookup_key: c.lookupKey,
      transfer_lookup_key: Boolean(atual),
      nickname: c.rotulo,
      metadata: { app: 'simulai-oab', ciclo: c.chave },
    });
    console.log(`  ${rotulo}  CRIADO          ${criado.id}  ${valor}`);
  }
}

async function webhook(stripe: Stripe): Promise<void> {
  if (!LIVE) {
    // O endpoint aponta para produção. Criar o equivalente em teste faria
    // evento de teste bater numa URL de produção sem serventia nenhuma —
    // em desenvolvimento quem entrega o evento é o `stripe listen`.
    console.log('  webhook      pulado          (só em --live; em teste use `stripe listen`)');
    return;
  }

  const existentes = await stripe.webhookEndpoints.list({ limit: 100 });
  const achado = existentes.data.find((w) => w.url === URL_WEBHOOK);

  if (!achado) {
    if (!APLICAR) {
      console.log(`  webhook      SERIA CRIADO    ${URL_WEBHOOK}`);
      return;
    }
    const criado = await stripe.webhookEndpoints.create({
      url: URL_WEBHOOK,
      enabled_events: EVENTOS as Stripe.WebhookEndpointCreateParams.EnabledEvent[],
      description: 'Simulai OAB — produção',
    });
    console.log(`  webhook      CRIADO          ${criado.id}`);
    console.log(`               GUARDE O SEGREDO AGORA — só aparece uma vez:`);
    console.log(`               ${criado.secret}`);
    return;
  }

  const sobrando = achado.enabled_events.filter(
    (e) => !EVENTOS.includes(e as (typeof EVENTOS)[number])
  );
  const faltando = EVENTOS.filter((e) => !achado.enabled_events.includes(e));

  if (!sobrando.length && !faltando.length) {
    console.log(`  webhook      ja correto      ${achado.id}  (${EVENTOS.length} eventos)`);
    return;
  }

  console.log(`  webhook      ${APLICAR ? 'AJUSTANDO      ' : 'PRECISA AJUSTE '} ${achado.id}`);
  for (const e of faltando) console.log(`               falta   + ${e}`);
  for (const e of sobrando) console.log(`               sobra   - ${e}`);

  if (APLICAR) {
    await stripe.webhookEndpoints.update(achado.id, { enabled_events: EVENTOS });
    console.log(`               ajustado para os ${EVENTOS.length} eventos que o código trata`);
  }
}

async function portal(stripe: Stripe): Promise<void> {
  const configs = await stripe.billingPortal.configurations.list({ limit: 10 });
  const padrao = configs.data.find((c) => c.is_default) ?? configs.data[0];

  const desejado = {
    features: {
      // No fim do período: quem pagou o mês (ou o ano) usa até o fim.
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end' as const,
        proration_behavior: 'none' as const,
        cancellation_reason: {
          enabled: true,
          options: [
            'too_expensive' as const,
            'missing_features' as const,
            'switched_service' as const,
            'unused' as const,
            'other' as const,
          ],
        },
      },
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
      // Trocar de ciclo pelo portal geraria pro rata e cobrança fora de hora.
      // A troca é pelo app, no fim do período.
      subscription_update: { enabled: false },
    },
  };

  if (!APLICAR) {
    console.log(`  portal       ${padrao ? 'SERIA AJUSTADO ' : 'SERIA CRIADO   '} cancelar no fim do período`);
    return;
  }

  const salvo = padrao
    ? await stripe.billingPortal.configurations.update(padrao.id, desejado)
    : await stripe.billingPortal.configurations.create(desejado);
  console.log(`  portal       AJUSTADO        ${salvo.id}  cancelar no fim do período`);
}

async function main() {
  const stripe = new Stripe(lerChave());

  // `null` no lugar do id devolve a conta da própria chave — o parâmetro só
  // serve para o Connect, onde se busca a conta de outra pessoa.
  const conta = await stripe.accounts.retrieve(null);
  const nome =
    conta.settings?.dashboard?.display_name ?? conta.business_profile?.name ?? '(sem nome)';

  console.log('');
  console.log(`  conta        ${nome}  (${conta.id})  país ${conta.country}`);
  console.log(`  modo         ${LIVE ? 'LIVE — dinheiro de verdade' : 'TESTE'}`);
  console.log(`  ação         ${APLICAR ? 'APLICANDO' : 'SECO — não escreve nada'}`);
  console.log('');

  const produtoId = await produto(stripe);
  await precos(stripe, produtoId);
  await webhook(stripe);
  await portal(stripe);

  console.log('');
  if (!APLICAR) {
    console.log(`  Nada foi escrito. Para valer: npx tsx scripts/stripe-setup.ts${LIVE ? ' --live' : ''} --aplicar`);
  }
  console.log('');
}

main().catch((erro) => {
  console.error('');
  console.error(`  ERRO: ${erro instanceof Error ? erro.message : String(erro)}`);
  console.error('');
  process.exit(1);
});
