/**
 * Configuração do Resend para envio de emails
 */

import { Resend } from 'resend';

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const emailConfig = {
  from: 'Simulai OAB <noreply@simulaioab.com>',
  replyTo: 'suporte@simulaioab.com',
};

export enum TipoEmail {
  // Billing
  ASSINATURA_CRIADA = 'ASSINATURA_CRIADA',
  PAGAMENTO_CONFIRMADO = 'PAGAMENTO_CONFIRMADO',
  PAGAMENTO_FALHOU = 'PAGAMENTO_FALHOU',
  ASSINATURA_CANCELADA = 'ASSINATURA_CANCELADA',
  RENOVACAO_PROXIMA = 'RENOVACAO_PROXIMA',

  // Onboarding
  BOAS_VINDAS = 'BOAS_VINDAS',

  // Engajamento
  LEMBRETE_ESTUDO = 'LEMBRETE_ESTUDO',
  CONQUISTA_DESBLOQUEADA = 'CONQUISTA_DESBLOQUEADA',
  RELATORIO_SEMANAL = 'RELATORIO_SEMANAL',

  // Promoções
  FIM_ACESSO_GRATUITO = 'FIM_ACESSO_GRATUITO',

  // Recovery
  RECOVERY_D1 = 'RECOVERY_D1',
  RECOVERY_D3 = 'RECOVERY_D3',
  RECOVERY_D7 = 'RECOVERY_D7',
  RECOVERY_D14 = 'RECOVERY_D14',
  RECOVERY_D30 = 'RECOVERY_D30',

  // Genérico
  NOTIFICACAO_GENERICA = 'NOTIFICACAO_GENERICA',
}

export const assuntosEmail: Record<TipoEmail, string> = {
  [TipoEmail.ASSINATURA_CRIADA]: '🎉 Bem-vindo ao Simulai OAB!',
  [TipoEmail.PAGAMENTO_CONFIRMADO]: '✅ Pagamento confirmado - Simulai OAB',
  [TipoEmail.PAGAMENTO_FALHOU]: '⚠️ Problema com seu pagamento - Simulai OAB',
  [TipoEmail.ASSINATURA_CANCELADA]: '👋 Sua assinatura foi cancelada',
  [TipoEmail.RENOVACAO_PROXIMA]: '📅 Sua assinatura será renovada em breve',
  [TipoEmail.BOAS_VINDAS]: '🎓 Bem-vindo ao Simulai OAB!',
  [TipoEmail.LEMBRETE_ESTUDO]: '📚 Hora de estudar!',
  [TipoEmail.CONQUISTA_DESBLOQUEADA]: '🏆 Você desbloqueou uma conquista!',
  [TipoEmail.RELATORIO_SEMANAL]: '📊 Seu relatório semanal está pronto',
  [TipoEmail.FIM_ACESSO_GRATUITO]: '⏰ Últimos dias de Acesso Premium Gratuito - Simulai OAB',
  [TipoEmail.RECOVERY_D1]: '🎓 Pronto pra começar a estudar pra OAB?',
  [TipoEmail.RECOVERY_D3]: '📚 Sua aprovação na OAB começa hoje',
  [TipoEmail.RECOVERY_D7]: '⏰ Não deixe a OAB pra última hora',
  [TipoEmail.RECOVERY_D14]: '🎁 Oferta especial: Simulai OAB com 20% off',
  [TipoEmail.RECOVERY_D30]: '⚡ Última chance: assine e comece a estudar agora',
  [TipoEmail.NOTIFICACAO_GENERICA]: '🔔 Notificação Simulai OAB',
};
