/**
 * Template de email: Pagamento falhou
 */

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Heading,
} from '@react-email/components';

interface PagamentoFalhouEmailProps {
  nomeUsuario: string;
  nomePlano: string;
  valor: string;
  linkAtualizar: string;
}

export function PagamentoFalhouEmail({
  nomeUsuario = 'Estudante',
  nomePlano = 'Pro Anual',
  valor = 'R$ 649,90',
  linkAtualizar = 'https://simulaioab.com/dashboard/assinatura',
}: PagamentoFalhouEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>⚠️ Problema com seu Pagamento</Heading>
          </Section>

          {/* Conteúdo */}
          <Section style={content}>
            <Text style={paragraph}>
              Olá, <strong>{nomeUsuario}</strong>!
            </Text>

            <Text style={paragraph}>
              Tentamos processar o pagamento da sua assinatura <strong>{nomePlano}</strong>,
              mas infelizmente não foi possível concluir a cobrança de <strong>{valor}</strong>.
            </Text>

            <Section style={warningBox}>
              <Text style={warningTitle}>⏰ Ação necessária</Text>
              <Text style={warningText}>
                Para continuar aproveitando todos os benefícios do Simulai OAB,
                por favor atualize sua forma de pagamento o quanto antes.
              </Text>
            </Section>

            <Text style={paragraph}>
              <strong>Motivos comuns:</strong>
            </Text>

            <ul style={list}>
              <li style={listItem}>Cartão vencido ou cancelado</li>
              <li style={listItem}>Saldo insuficiente</li>
              <li style={listItem}>Dados do cartão incorretos</li>
              <li style={listItem}>Bloqueio pelo banco emissor</li>
            </ul>

            <Button style={button} href={linkAtualizar}>
              Atualizar Forma de Pagamento
            </Button>

            <Text style={footerText}>
              Se você tiver dúvidas, entre em contato com{' '}
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
  color: '#FCA5A5',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
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

const warningBox = {
  backgroundColor: '#7C2D12',
  border: '1px solid #DC2626',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const warningTitle = {
  color: '#FCA5A5',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const warningText = {
  color: '#FEE2E2',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
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
  backgroundColor: '#EF4444',
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

export default PagamentoFalhouEmail;
