import { loadStripe, type Stripe } from '@stripe/stripe-js';

/**
 * Carregador do Stripe.js no browser — preguiçoso e com nova tentativa.
 *
 * Antes cada tela chamava `loadStripe()` no escopo do modulo. Isso dispara
 * assim que o chunk e importado — inclusive quando a pessoa nem chegou a ver
 * a tela (foi redirecionada pro login, por exemplo) — e a promessa rejeitada
 * ficava sem ninguem tratando. Uma oscilacao de rede virava um "Failed to
 * load Stripe.js" em tela cheia, numa pagina de pagamento.
 *
 * Aqui a carga so comeca quando alguem pede, o resultado e memoizado, e uma
 * falha limpa o cache para a proxima chamada tentar de novo.
 */

let pendente: Promise<Stripe | null> | null = null;

export function carregarStripe(): Promise<Stripe | null> {
  if (pendente) return pendente;

  const chave = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!chave) {
    return Promise.reject(
      new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não configurada.')
    );
  }

  pendente = loadStripe(chave).catch((erro) => {
    // Solta o cache para que uma nova tentativa possa dar certo.
    pendente = null;
    throw erro;
  });

  return pendente;
}
