/**
 * Template de email: Assinatura criada
 */

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Heading,
} from '@react-email/components';

interface AssinaturaCriadaEmailProps {
  nomeUsuario: string;
  nomePlano: string;
  valorMensal: string;
  proximaCobranca: string;
  linkDashboard: string;
}

export function AssinaturaCriadaEmail({
  nomeUsuario = 'Estudante',
  nomePlano = 'Pro Anual',
  valorMensal = 'R$ 54,16',
  proximaCobranca = '1 de dezembro de 2025',
  linkDashboard = 'https://www.simulaioab.com/dashboard',
}: AssinaturaCriadaEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>🎉 Bem-vindo ao Simulai OAB!</Heading>
          </Section>

          {/* Conteúdo */}
          <Section style={content}>
            <Text style={paragraph}>
              Olá, <strong>{nomeUsuario}</strong>!
            </Text>

            <Text style={paragraph}>
              Sua assinatura do <strong>{nomePlano}</strong> foi ativada com sucesso!
              Agora você tem acesso completo a todas as questões oficiais da OAB e
              recursos premium.
            </Text>

            {/* Box de informações */}
            <Section style={infoBox}>
              <Text style={infoTitle}>Detalhes da Assinatura</Text>
              <Hr style={divider} />
              <Text style={infoText}>
                <strong>Plano:</strong> {nomePlano}
              </Text>
              <Text style={infoText}>
                <strong>Valor mensal:</strong> {valorMensal}
              </Text>
              <Text style={infoText}>
                <strong>Próxima cobrança:</strong> {proximaCobranca}
              </Text>
            </Section>

            {/* O que você pode fazer agora */}
            <Text style={paragraph}>
              <strong>O que você pode fazer agora:</strong>
            </Text>

            <ul style={list}>
              <li style={listItem}>
                📚 Praticar com 5.875 questões oficiais (2010-2026)
              </li>
              <li style={listItem}>
                🤖 Usar IA ilimitada para explicações e dúvidas
              </li>
              <li style={listItem}>
                📊 Acompanhar sua evolução com analytics avançado
              </li>
              <li style={listItem}>
                🎯 Criar simulados personalizados
              </li>
            </ul>

            <Button style={button} href={linkDashboard}>
              Começar a Estudar Agora
            </Button>

            <Hr style={divider} />

            <Text style={footerText}>
              Você pode gerenciar sua assinatura a qualquer momento no seu dashboard.
            </Text>

            <Text style={footerText}>
              Tem dúvidas? Responda este email ou entre em contato com{' '}
              <a href="mailto:suporte@simulaioab.com" style={link}>
                suporte@simulaioab.com
              </a>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerSmall}>
              © 2025 Simulai OAB. Todos os direitos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Estilos
const main = {
  backgroundColor: '#0F172A',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#1E293B',
  borderRadius: '12px 12px 0 0',
  padding: '32px 24px',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#FFFFFF',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
  padding: '0',
};

const content = {
  backgroundColor: '#1E293B',
  borderRadius: '0 0 12px 12px',
  padding: '24px',
};

const paragraph = {
  color: '#E2E8F0',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const infoBox = {
  backgroundColor: '#0F172A',
  border: '1px solid #334155',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const infoTitle = {
  color: '#FFFFFF',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const infoText = {
  color: '#CBD5E1',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const divider = {
  borderColor: '#334155',
  margin: '16px 0',
};

const list = {
  color: '#E2E8F0',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '16px 0',
  paddingLeft: '20px',
};

const listItem = {
  marginBottom: '8px',
};

const button = {
  backgroundColor: '#3B82F6',
  borderRadius: '8px',
  color: '#FFFFFF',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  padding: '14px 28px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  margin: '24px 0',
};

const footerText = {
  color: '#94A3B8',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '12px 0',
};

const link = {
  color: '#60A5FA',
  textDecoration: 'underline',
};

const footer = {
  textAlign: 'center' as const,
  padding: '20px 0',
};

const footerSmall = {
  color: '#64748B',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0',
};

export default AssinaturaCriadaEmail;
