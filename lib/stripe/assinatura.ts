/**
 * Estado de uma assinatura, com UMA regra só para "vai acabar".
 *
 * A Stripe agenda o fim de uma assinatura de duas formas diferentes, e as
 * duas convivem no mesmo objeto:
 *
 *   cancel_at_period_end  booleano, ligado quando você chama a API pedindo
 *                         cancelamento no fim do período
 *   cancel_at             data exata em que a assinatura será cancelada
 *
 * O portal do cliente usa a SEGUNDA: resolve o fim do período para uma data
 * concreta e deixa o booleano em `false`. Quem lê só o booleano conclui que
 * a assinatura vai renovar — e mostra "próxima cobrança em..." para alguém
 * que acabou de cancelar.
 *
 * A própria Stripe trata os dois casos como um só: pedir o fluxo de
 * cancelamento para uma assinatura com `cancel_at` marcado devolve
 * "The subscription is already set to be canceled at period end".
 *
 * Nas duas leituras: o que vale é `cancelAt || cancelAtPeriodEnd`.
 */

export interface EstadoAssinatura {
  status: string;
  cancelAtPeriodEnd: boolean;
  cancelAt: Date | null;
  currentPeriodEnd: Date | null;
}

/** Status em que a pessoa tem acesso liberado. */
const COM_ACESSO = ['ACTIVE', 'TRIALING'];

/** A assinatura tem data de fim marcada e não vai renovar. */
export function temFimMarcado(s: EstadoAssinatura): boolean {
  return s.cancelAtPeriodEnd || s.cancelAt !== null;
}

/**
 * Até quando o acesso vale.
 *
 * `cancelAt` na frente porque ele pode ser ANTES do fim do período: dá para
 * marcar uma data no meio do ciclo pelo painel da Stripe.
 */
export function fimDoAcesso(s: EstadoAssinatura): Date | null {
  return s.cancelAt ?? s.currentPeriodEnd;
}

/**
 * Dá para desfazer o cancelamento?
 *
 * Só enquanto a assinatura ainda está de pé. Depois que ela vira `canceled`
 * não há volta — a doc é explícita: "Não é possível reativar uma assinatura
 * cancelada". Aí o caminho é assinar de novo.
 */
export function podeReativar(s: EstadoAssinatura): boolean {
  return temFimMarcado(s) && COM_ACESSO.includes(s.status);
}
