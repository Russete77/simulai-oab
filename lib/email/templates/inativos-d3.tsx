/**
 * Template D+3 — "Sentimos sua falta" (lembrete gentil)
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
  linkContinuar?: string;
  utmCampaign?: string;
  /** Dias até a próxima 1ª fase — null se não houver prova futura conhecida. */
  diasParaProva?: number | null;
}

export function InativosD3Email({
  nomeUsuario = 'Estudante',
  linkContinuar = 'https://simulaioab.com/dashboard',
  utmCampaign = 'inactive_d3',
  diasParaProva = null,
}: Props) {
  const ctaHref = `${linkContinuar}?utm_source=email&utm_medium=lifecycle&utm_campaign=${utmCampaign}`;

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>📚 Sentimos sua falta, {nomeUsuario}!</Heading>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>
              Faz 3 dias que você não entra no Simulai OAB.{' '}
              {diasParaProva !== null ? (
                <>
                  <strong>Faltam {diasParaProva} dias</strong> para a próxima 1ª
                  fase da OAB — cada dia sem praticar é um dia a menos pra
                  fechar seu gap até a aprovação.
                </>
              ) : (
                <>A prova está chegando e cada dia estudando faz diferença.</>
              )}
            </Text>

            <Section style={{ textAlign: 'center', marginTop: 32 }}>
              <Button style={button} href={ctaHref}>
                Continuar de onde parei →
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={footerNote}>
              Se preferir não receber esses lembretes,{' '}
              <a href="https://simulaioab.com/configuracoes/notificacoes" style={link}>
                ajuste suas preferências
              </a>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================================================
const main: React.CSSProperties = {
  backgroundColor: '#0F172A',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
  color: '#f8fafc',
};
const container: React.CSSProperties = {
  margin: '0 auto',
  padding: '32px 24px',
  maxWidth: '580px',
};
const header: React.CSSProperties = { padding: '0 0 24px' };
const h1: React.CSSProperties = {
  color: '#ffffff',
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
const button: React.CSSProperties = {
  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '10px',
  textDecoration: 'none',
  fontWeight: 600,
  display: 'inline-block',
  fontSize: '15px',
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
const link: React.CSSProperties = {
  color: '#60a5fa',
  textDecoration: 'underline',
};
