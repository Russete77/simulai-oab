/**
 * Configuração do Resend para envio de emails
 */

import { Resend } from 'resend';

/**
 * Cliente Resend configurado (opcional durante desenvolvimento)
 * Se RESEND_API_KEY não estiver configurado, emails não serão enviados
 */
export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * Configurações de email
 */
export const emailConfig = {
  from: 'Simulai OAB <noreply@simulaioab.com>',
  replyTo: 'suporte@simulaioab.com',
};

/**
 * Tipos de emails do sistema
 */
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
}

/**
 * Assuntos dos emails
 */
export const assuntosEmail: Record<TipoEmail, string> = {
  // Billing
  [TipoEmail.ASSINATURA_CRIADA]: '🎉 Bem-vindo ao Simulai OAB!',
  [TipoEmail.PAGAMENTO_CONFIRMADO]: '✅ Pagamento confirmado - Simulai OAB',
  [TipoEmail.PAGAMENTO_FALHOU]: '⚠️ Problema com seu pagamento - Simulai OAB',
  [TipoEmail.ASSINATURA_CANCELADA]: '👋 Sua assinatura foi cancelada',
  [TipoEmail.RENOVACAO_PROXIMA]: '📅 Sua assinatura será renovada em breve',

  // Onboarding
  [TipoEmail.BOAS_VINDAS]: '🎓 Bem-vindo ao Simulai OAB!',

  // Engajamento
  [TipoEmail.LEMBRETE_ESTUDO]: '📚 Hora de estudar!',
  [TipoEmail.CONQUISTA_DESBLOQUEADA]: '🏆 Você desbloqueou uma conquista!',
  [TipoEmail.RELATORIO_SEMANAL]: '📊 Seu relatório semanal está pronto',
};
