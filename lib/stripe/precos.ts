/**
 * Ponte entre os nossos ciclos e os Prices da Stripe.
 *
 * Os preços são encontrados por `lookup_key`, não por ID guardado em variável
 * de ambiente. Motivo: a chave de busca é a MESMA em teste e em live, mas o
 * ID não é. Com quatro ciclos, guardar ID viraria oito variáveis para
 * configurar à mão em dois ambientes — oito chances de trocar um preço de
 * teste por um de produção e ninguém perceber até alguém ser cobrado errado.
 *
 * `STRIPE_PRICE_ID` continua funcionando como atalho do mensal, para não
 * quebrar quem já configurou.
 */

import type Stripe from 'stripe';
import { getStripe } from './client';
import { CICLOS, ciclo, type Ciclo, type CicloChave } from './plan';

/** Resolvido uma vez por instância. Preço não muda de ID depois de criado. */
const cache = new Map<CicloChave, string>();

export async function precoIdDe(chave: CicloChave): Promise<string> {
  const emCache = cache.get(chave);
  if (emCache) return emCache;

  const alvo = ciclo(chave);

  if (chave === 'mensal' && process.env.STRIPE_PRICE_ID) {
    cache.set(chave, process.env.STRIPE_PRICE_ID);
    return process.env.STRIPE_PRICE_ID;
  }

  const achados = await getStripe().prices.list({
    lookup_keys: [alvo.lookupKey],
    active: true,
    limit: 1,
  });

  const preco = achados.data[0];
  if (!preco) {
    throw new Error(
      `Preço "${alvo.lookupKey}" (${alvo.rotulo}) não existe nesta conta Stripe. ` +
        `Rode: npx tsx scripts/stripe-precos.ts --aplicar`
    );
  }

  cache.set(chave, preco.id);
  return preco.id;
}

/**
 * Caminho inverso: dado o preço que veio no webhook, qual ciclo é.
 *
 * Tenta a lookup_key primeiro; se o preço tiver sido criado à mão no painel,
 * sem chave, cai no formato da recorrência. Devolve null quando não é nenhum
 * dos nossos — pode ser assinatura antiga ou criada fora do app.
 */
export function cicloDePreco(preco: Stripe.Price | null | undefined): Ciclo | null {
  if (!preco) return null;

  if (preco.lookup_key) {
    const porChave = CICLOS.find((c) => c.lookupKey === preco.lookup_key);
    if (porChave) return porChave;
  }

  const r = preco.recurring;
  if (!r) return null;

  return (
    CICLOS.find(
      (c) => c.intervalo === r.interval && c.intervaloContagem === (r.interval_count ?? 1)
    ) ?? null
  );
}

/**
 * Mesma coisa, mas partindo só do ID.
 *
 * A linha da fatura não traz o objeto do preço — desde a API
 * 2025-03-31.basil ela traz `pricing.price_details.price`, que é string.
 * Nunca lança: no webhook, não saber o ciclo não pode impedir de registrar
 * o pagamento.
 */
export async function cicloDePrecoId(
  id: string | null | undefined
): Promise<Ciclo | null> {
  if (!id) return null;
  try {
    return cicloDePreco(await getStripe().prices.retrieve(id));
  } catch {
    return null;
  }
}

/** Só para os testes: zera o que já foi resolvido. */
export function limparCachePrecos(): void {
  cache.clear();
}
