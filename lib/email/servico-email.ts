/**
 * Serviço de envio de emails
 * Centraliza toda lógica de emails do sistema
 */

import { render } from '@react-email/components';
import { resend, emailConfig, TipoEmail, assuntosEmail } from './config';
import { AssinaturaCriadaEmail } from './templates/assinatura-criada';
import { PagamentoFalhouEmail } from './templates/pagamento-falhou';

/**
 * Interface base para dados de email
 */
interface DadosEmailBase {
  destinatario: string;
  nomeUsuario: string;
}

/**
 * Dados específicos para cada tipo de email
 */
interface DadosAssinaturaCriada extends DadosEmailBase {
  nomePlano: string;
  valorMensal: string;
  proximaCobranca: string;
}

interface DadosPagamentoFalhou extends DadosEmailBase {
  nomePlano: string;
  valor: string;
}

interface DadosPagamentoConfirmado extends DadosEmailBase {
  nomePlano: string;
  valor: string;
  dataCobranca: string;
}

interface DadosRenovacaoProxima extends DadosEmailBase {
  nomePlano: string;
  valor: string;
  dataRenovacao: string;
}

/**
 * Classe do serviço de emails
 */
export class ServicoEmail {
  /**
   * Enviar email de assinatura criada
   */
  async enviarAssinaturaCriada(dados: DadosAssinaturaCriada): Promise<boolean> {
    if (!resend) {
      console.warn('[EMAIL] Resend não configurado. Adicione RESEND_API_KEY ao .env para enviar emails.');
      return false;
    }

    try {
      const html = await render(
        AssinaturaCriadaEmail({
          nomeUsuario: dados.nomeUsuario,
          nomePlano: dados.nomePlano,
          valorMensal: dados.valorMensal,
          proximaCobranca: dados.proximaCobranca,
          linkDashboard: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        })
      );

      await resend.emails.send({
        from: emailConfig.from,
        to: dados.destinatario,
        replyTo: emailConfig.replyTo,
        subject: assuntosEmail[TipoEmail.ASSINATURA_CRIADA],
        html,
      });

      console.log(`[EMAIL] Assinatura criada enviado para ${dados.destinatario}`);
      return true;
    } catch (erro: any) {
      console.error('[EMAIL] Erro ao enviar assinatura criada:', erro);
      return false;
    }
  }

  /**
   * Enviar email de pagamento falhou
   */
  async enviarPagamentoFalhou(dados: DadosPagamentoFalhou): Promise<boolean> {
    if (!resend) {
      console.warn('[EMAIL] Resend não configurado. Adicione RESEND_API_KEY ao .env para enviar emails.');
      return false;
    }

    try {
      const html = await render(
        PagamentoFalhouEmail({
          nomeUsuario: dados.nomeUsuario,
          nomePlano: dados.nomePlano,
          valor: dados.valor,
          linkAtualizar: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/assinatura`,
        })
      );

      await resend.emails.send({
        from: emailConfig.from,
        to: dados.destinatario,
        replyTo: emailConfig.replyTo,
        subject: assuntosEmail[TipoEmail.PAGAMENTO_FALHOU],
        html,
      });

      console.log(`[EMAIL] Pagamento falhou enviado para ${dados.destinatario}`);
      return true;
    } catch (erro: any) {
      console.error('[EMAIL] Erro ao enviar pagamento falhou:', erro);
      return false;
    }
  }

  /**
   * Enviar email de pagamento confirmado
   */
  async enviarPagamentoConfirmado(dados: DadosPagamentoConfirmado): Promise<boolean> {
    if (!resend) {
      console.warn('[EMAIL] Resend não configurado. Adicione RESEND_API_KEY ao .env para enviar emails.');
      return false;
    }

    try {
      // Template simples de confirmação
      const html = `
        <!DOCTYPE html>
        <html>
          <body style="background-color: #0F172A; font-family: sans-serif; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1E293B; border-radius: 12px; padding: 32px;">
              <h1 style="color: #10B981; font-size: 28px; margin-bottom: 20px;">✅ Pagamento Confirmado</h1>
              <p style="color: #E2E8F0; font-size: 16px; line-height: 24px;">
                Olá, <strong>${dados.nomeUsuario}</strong>!
              </p>
              <p style="color: #E2E8F0; font-size: 16px; line-height: 24px;">
                Seu pagamento de <strong>${dados.valor}</strong> foi confirmado com sucesso!
              </p>
              <div style="background-color: #0F172A; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="color: #FFFFFF; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">
                  Detalhes do Pagamento
                </p>
                <p style="color: #CBD5E1; font-size: 14px; margin: 8px 0;">
                  <strong>Plano:</strong> ${dados.nomePlano}
                </p>
                <p style="color: #CBD5E1; font-size: 14px; margin: 8px 0;">
                  <strong>Valor:</strong> ${dados.valor}
                </p>
                <p style="color: #CBD5E1; font-size: 14px; margin: 8px 0;">
                  <strong>Data:</strong> ${dados.dataCobranca}
                </p>
              </div>
              <p style="color: #94A3B8; font-size: 14px; margin-top: 24px;">
                Você pode acessar o recibo completo no seu <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/assinatura" style="color: #60A5FA;">dashboard</a>.
              </p>
            </div>
          </body>
        </html>
      `;

      await resend.emails.send({
        from: emailConfig.from,
        to: dados.destinatario,
        replyTo: emailConfig.replyTo,
        subject: assuntosEmail[TipoEmail.PAGAMENTO_CONFIRMADO],
        html,
      });

      console.log(`[EMAIL] Pagamento confirmado enviado para ${dados.destinatario}`);
      return true;
    } catch (erro: any) {
      console.error('[EMAIL] Erro ao enviar pagamento confirmado:', erro);
      return false;
    }
  }

  /**
   * Enviar email de renovação próxima (7 dias antes)
   */
  async enviarRenovacaoProxima(dados: DadosRenovacaoProxima): Promise<boolean> {
    if (!resend) {
      console.warn('[EMAIL] Resend não configurado. Adicione RESEND_API_KEY ao .env para enviar emails.');
      return false;
    }

    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <body style="background-color: #0F172A; font-family: sans-serif; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1E293B; border-radius: 12px; padding: 32px;">
              <h1 style="color: #60A5FA; font-size: 28px; margin-bottom: 20px;">📅 Renovação em Breve</h1>
              <p style="color: #E2E8F0; font-size: 16px; line-height: 24px;">
                Olá, <strong>${dados.nomeUsuario}</strong>!
              </p>
              <p style="color: #E2E8F0; font-size: 16px; line-height: 24px;">
                Sua assinatura <strong>${dados.nomePlano}</strong> será renovada automaticamente em <strong>${dados.dataRenovacao}</strong>.
              </p>
              <div style="background-color: #1E3A8A; border: 1px solid #3B82F6; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="color: #93C5FD; font-size: 16px; margin: 0;">
                  Valor da renovação: <strong style="font-size: 24px;">${dados.valor}</strong>
                </p>
              </div>
              <p style="color: #94A3B8; font-size: 14px;">
                Se desejar cancelar ou alterar sua assinatura, acesse o
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/assinatura" style="color: #60A5FA;">gerenciamento de assinatura</a>.
              </p>
            </div>
          </body>
        </html>
      `;

      await resend.emails.send({
        from: emailConfig.from,
        to: dados.destinatario,
        replyTo: emailConfig.replyTo,
        subject: assuntosEmail[TipoEmail.RENOVACAO_PROXIMA],
        html,
      });

      console.log(`[EMAIL] Renovação próxima enviado para ${dados.destinatario}`);
      return true;
    } catch (erro: any) {
      console.error('[EMAIL] Erro ao enviar renovação próxima:', erro);
      return false;
    }
  }

  /**
   * Enviar email de boas-vindas
   */
  async enviarBoasVindas(dados: DadosEmailBase): Promise<boolean> {
    if (!resend) {
      console.warn('[EMAIL] Resend não configurado. Adicione RESEND_API_KEY ao .env para enviar emails.');
      return false;
    }

    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <body style="background-color: #0F172A; font-family: sans-serif; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1E293B; border-radius: 12px; padding: 32px;">
              <h1 style="color: #60A5FA; font-size: 28px; margin-bottom: 20px;">🎓 Bem-vindo ao Simulai OAB!</h1>
              <p style="color: #E2E8F0; font-size: 16px; line-height: 24px;">
                Olá, <strong>${dados.nomeUsuario}</strong>!
              </p>
              <p style="color: #E2E8F0; font-size: 16px; line-height: 24px;">
                Estamos muito felizes em ter você conosco! O Simulai OAB é a plataforma mais completa para sua preparação, com:
              </p>

              <div style="background-color: #0F172A; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="color: #FFFFFF; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">
                  ✨ O que você pode fazer:
                </p>
                <ul style="color: #CBD5E1; font-size: 14px; line-height: 24px; margin: 0; padding-left: 20px;">
                  <li>📝 <strong>5.605 questões oficiais</strong> da OAB (2010-2025)</li>
                  <li>🤖 <strong>Explicações IA</strong> especializadas em Direito</li>
                  <li>🎯 <strong>Simulados completos</strong> com correção automática</li>
                  <li>📊 <strong>Analytics detalhado</strong> do seu progresso</li>
                  <li>🏆 <strong>Ranking nacional</strong> de estudantes</li>
                </ul>
              </div>

              <div style="background-color: #1E3A8A; border: 1px solid #3B82F6; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="color: #93C5FD; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
                  🚀 Primeiros Passos:
                </p>
                <ol style="color: #DBEAFE; font-size: 14px; line-height: 24px; margin: 0; padding-left: 20px;">
                  <li>Responda <strong>20 questões</strong> para entender seu nível</li>
                  <li>Veja <strong>explicações IA</strong> das respostas</li>
                  <li>Crie seu <strong>primeiro simulado</strong></li>
                </ol>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                   style="display: inline-block; background: linear-gradient(to right, #3B82F6, #8B5CF6);
                          color: white; text-decoration: none; padding: 14px 32px;
                          border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Começar Agora
                </a>
              </div>

              <p style="color: #94A3B8; font-size: 14px; margin-top: 24px; text-align: center;">
                Dúvidas? Responda este email ou acesse nosso suporte.
              </p>

              <p style="color: #94A3B8; font-size: 14px; margin-top: 16px; text-align: center;">
                Boa sorte nos estudos! 🍀
              </p>
            </div>
          </body>
        </html>
      `;

      await resend.emails.send({
        from: emailConfig.from,
        to: dados.destinatario,
        replyTo: emailConfig.replyTo,
        subject: assuntosEmail[TipoEmail.BOAS_VINDAS],
        html,
      });

      console.log(`[EMAIL] Boas-vindas enviado para ${dados.destinatario}`);
      return true;
    } catch (erro: any) {
      console.error('[EMAIL] Erro ao enviar boas-vindas:', erro);
      return false;
    }
  }

  /**
   * Enviar email de assinatura cancelada
   */
  async enviarAssinaturaCancelada(dados: DadosEmailBase & { dataTermino: string }): Promise<boolean> {
    if (!resend) {
      console.warn('[EMAIL] Resend não configurado. Adicione RESEND_API_KEY ao .env para enviar emails.');
      return false;
    }

    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <body style="background-color: #0F172A; font-family: sans-serif; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1E293B; border-radius: 12px; padding: 32px;">
              <h1 style="color: #E2E8F0; font-size: 28px; margin-bottom: 20px;">👋 Assinatura Cancelada</h1>
              <p style="color: #E2E8F0; font-size: 16px; line-height: 24px;">
                Olá, <strong>${dados.nomeUsuario}</strong>!
              </p>
              <p style="color: #E2E8F0; font-size: 16px; line-height: 24px;">
                Sua assinatura foi cancelada conforme solicitado.
              </p>
              <p style="color: #94A3B8; font-size: 14px;">
                Você ainda poderá usar todos os recursos premium até <strong>${dados.dataTermino}</strong>.
              </p>
              <p style="color: #94A3B8; font-size: 14px; margin-top: 24px;">
                Sentiremos sua falta! Se mudar de ideia, você pode reativar sua assinatura a qualquer momento em nosso
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" style="color: #60A5FA;">site</a>.
              </p>
            </div>
          </body>
        </html>
      `;

      await resend.emails.send({
        from: emailConfig.from,
        to: dados.destinatario,
        replyTo: emailConfig.replyTo,
        subject: assuntosEmail[TipoEmail.ASSINATURA_CANCELADA],
        html,
      });

      console.log(`[EMAIL] Assinatura cancelada enviado para ${dados.destinatario}`);
      return true;
    } catch (erro: any) {
      console.error('[EMAIL] Erro ao enviar assinatura cancelada:', erro);
      return false;
    }
  }

  /**
   * Enviar aviso de fim do acesso gratuito
   */
  async enviarFimAcessoGratuito(dados: DadosEmailBase & { diasRestantes: number; dataTermino: string }): Promise<boolean> {
    if (!resend) {
      console.warn('[EMAIL] Resend não configurado. Adicione RESEND_API_KEY ao .env para enviar emails.');
      return false;
    }

    try {
      const urgencia = dados.diasRestantes <= 3; // 3 dias ou menos = urgente
      const corPrincipal = urgencia ? '#F97316' : '#FACC15';
      const corSecundaria = urgencia ? '#FB923C' : '#FDE047';

      const html = `
        <!DOCTYPE html>
        <html>
          <body style="background-color: #0F172A; font-family: sans-serif; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1E293B; border-radius: 12px; padding: 32px; border: 2px solid ${corPrincipal};">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 64px;">${urgencia ? '⚠️' : '⏰'}</span>
              </div>

              <h1 style="color: ${corPrincipal}; font-size: 28px; margin-bottom: 20px; text-align: center;">
                ${urgencia ? 'ÚLTIMOS DIAS!' : 'Acesso Premium Gratuito Terminando'}
              </h1>

              <p style="color: #E2E8F0; font-size: 16px; line-height: 24px;">
                Olá, <strong>${dados.nomeUsuario}</strong>!
              </p>

              <div style="background: linear-gradient(135deg, ${corPrincipal}, ${corSecundaria});
                          border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                <p style="color: #FFFFFF; font-size: 18px; margin: 0 0 8px 0; font-weight: 600;">
                  Seu acesso Premium GRATUITO termina em
                </p>
                <p style="color: #FFFFFF; font-size: 48px; font-weight: bold; margin: 0;">
                  ${dados.diasRestantes} ${dados.diasRestantes === 1 ? 'dia' : 'dias'}
                </p>
                <p style="color: #FFFFFF; font-size: 14px; margin: 8px 0 0 0; opacity: 0.9;">
                  Data de término: ${dados.dataTermino}
                </p>
              </div>

              <div style="background-color: #0F172A; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="color: #FFFFFF; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">
                  ✨ Você aproveitou:
                </p>
                <ul style="color: #CBD5E1; font-size: 14px; line-height: 28px; margin: 0; padding-left: 20px;">
                  <li><strong>Simulados ilimitados</strong> com 5.605 questões oficiais</li>
                  <li><strong>Explicações IA</strong> sem limites</li>
                  <li><strong>Analytics avançado</strong> do seu desempenho</li>
                  <li><strong>Relatórios detalhados</strong> por matéria</li>
                </ul>
              </div>

              <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6);
                          border-radius: 12px; padding: 24px; margin: 24px 0;">
                <p style="color: #FFFFFF; font-size: 18px; font-weight: 600; margin: 0 0 12px 0; text-align: center;">
                  🎯 Continue com o Premium!
                </p>
                <p style="color: #E0E7FF; font-size: 14px; margin: 0 0 20px 0; text-align: center;">
                  Mantenha todo o progresso que você conquistou
                </p>
                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing"
                     style="display: inline-block; background-color: #FFFFFF;
                            color: #6366F1; text-decoration: none; padding: 16px 40px;
                            border-radius: 8px; font-weight: 700; font-size: 16px;">
                    Ver Planos Premium
                  </a>
                </div>
              </div>

              <p style="color: #94A3B8; font-size: 14px; margin-top: 24px; text-align: center;">
                ${urgencia ? 'Não perca tempo! Garanta seu plano agora.' : 'Aproveite o desconto especial para quem já experimentou a plataforma.'}
              </p>

              <div style="border-top: 1px solid #334155; margin-top: 32px; padding-top: 24px;">
                <p style="color: #94A3B8; font-size: 12px; text-align: center; margin: 0;">
                  Após ${dados.dataTermino}, você voltará ao plano gratuito com 5 simulados/mês.
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      await resend.emails.send({
        from: emailConfig.from,
        to: dados.destinatario,
        replyTo: emailConfig.replyTo,
        subject: assuntosEmail[TipoEmail.FIM_ACESSO_GRATUITO],
        html,
      });

      console.log(`[EMAIL] Fim acesso gratuito enviado para ${dados.destinatario} (${dados.diasRestantes} dias restantes)`);
      return true;
    } catch (erro: any) {
      console.error('[EMAIL] Erro ao enviar fim acesso gratuito:', erro);
      return false;
    }
  }

}


// Singleton
let servicoEmailInstance: ServicoEmail | null = null;

export function getServicoEmail(): ServicoEmail {
  if (!servicoEmailInstance) {
    servicoEmailInstance = new ServicoEmail();
  }
  return servicoEmailInstance;
}
