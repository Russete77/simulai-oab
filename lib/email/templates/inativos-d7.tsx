/**
 * Template D+7 — "Comece o plano PRO por R$89,99" (oferta)
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
  Hr,
} from '@react-email/components';

interface Props {
  nomeUsuario?: string;
  linkUpgrade?: string;
  utmCampaign?: string;
}

export function InativosD7Email({
  nomeUsuario = 'Estudante',
  linkUpgrade = 'https://simulaioab.com/pricing',
  utmCampaign = 'inactive_d7',
}: Props) {
  const ctaHref = `${linkUpgrade}?plan=pro&utm_source=email&utm_medium=lifecycle&utm_campaign=${utmCampaign}`;

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>Hora de acelerar, {nomeUsuario} 🚀</Heading>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>
              Passou uma semana sem você praticar. A OAB está cada vez mais perto — e
              candidatos que estudam com <strong>IA</strong> têm vantagem real no dia da prova.
            </Text>

            <Text style={{ ...paragraph, marginBottom: 8 }}>
              <strong>No plano PRO você destrava:</strong>
            </Text>
            <ul style={list}>
              <li style={listItem}>
                🤖 <strong>IA explicando</strong> cada questão como um professor particular
              </li>
              <li style={listItem}>
                💬 <strong>Chat com IA</strong> pra tirar dúvidas de doutrina e jurisprudência
              </li>
              <li style={listItem}>
                🎯 Revisão inteligente dos <strong>seus</strong> erros
              </li>
              <li style={listItem}>📊 Predição de aprovação e analytics completo</li>
              <li style={listItem}>⚡ Simulados adaptativos ilimitados (5.605 questões)</li>
            </ul>

            <Section style={priceBox}>
              <Text style={priceLabel}>Plano PRO</Text>
              <Text style={priceAmount}>
                <span style={priceCurrency}>R$</span>89<span style={priceCents}>,99</span>
                <span style={priceUnit}>/mês</span>
              </Text>
              <Text style={priceHint}>Cancele quando quiser. PIX, boleto ou cartão.</Text>
            </Section>

            <Section style={{ textAlign: 'center', marginTop: 20 }}>
              <Button style={button} href={ctaHref}>
                Assinar o PRO agora →
              </Button>
            </Section>

            <Hr style={hr} />
            <Text style={footerNote}>
              Gerencie preferências em{' '}
              <a href="https://simulaioab.com/configuracoes/notificacoes" style={link}>
                simulaioab.com/configuracoes
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: '#0F172A',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  color: '#f8fafc',
};
const container: React.CSSProperties = {
  margin: '0 auto',
  padding: '32px 24px',
  maxWidth: '580px',
};
const header: React.CSSProperties = { padding: '0 0 24px' };
const h1: React.CSSProperties = {
  color: '#fff',
  fontSize: '28px',
  fontWeight: 700,
  margin: 0,
  lineHeight: 1.2,
};
const content: React.CSSProperties = {
  backgroundColor: '#1e293b',
  borderRadius: '12px',
  padding: '28px 24px',
  border: '1px solid rgba(255,255,255,0.06)',
};
const paragraph: React.CSSProperties = {
  color: '#cbd5e1',
  fontSize: '16px',
  lineHeight: 1.6,
  margin: '0 0 16px',
};
const list: React.CSSProperties = {
  color: '#cbd5e1',
  fontSize: '15px',
  lineHeight: 1.7,
  margin: '0 0 20px',
  paddingLeft: '18px',
};
const listItem: React.CSSProperties = { marginBottom: '6px' };
const priceBox: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(124,58,237,0.1) 100%)',
  border: '1px solid rgba(37,99,235,0.3)',
  borderRadius: '12px',
  padding: '20px',
  textAlign: 'center',
  margin: '20px 0',
};
const priceLabel: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  margin: 0,
};
const priceAmount: React.CSSProperties = {
  color: '#fff',
  fontSize: '40px',
  fontWeight: 800,
  margin: '4px 0 0',
  lineHeight: 1,
};
const priceCurrency: React.CSSProperties = { fontSize: '20px', marginRight: '4px' };
const priceCents: React.CSSProperties = { fontSize: '26px' };
const priceUnit: React.CSSProperties = {
  fontSize: '14px',
  color: '#94a3b8',
  fontWeight: 500,
  marginLeft: '6px',
};
const priceHint: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '12px',
  margin: '8px 0 0',
};
const button: React.CSSProperties = {
  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
  color: '#fff',
  padding: '16px 36px',
  borderRadius: '10px',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: '16px',
  display: 'inline-block',
};
const hr: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid rgba(255,255,255,0.08)',
  margin: '28px 0 16px',
};
const footerNote: React.CSSProperties = {
  color: '#64748b',
  fontSize: '12px',
  lineHeight: 1.5,
  textAlign: 'center',
};
const link: React.CSSProperties = { color: '#60a5fa', textDecoration: 'underline' };
