/**
 * Template D+14 — "Última chance" (urgência)
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

export function InativosD14Email({
  nomeUsuario = 'Estudante',
  linkUpgrade = 'https://simulaioab.com/pricing',
  utmCampaign = 'inactive_d14',
}: Props) {
  const ctaHref = `${linkUpgrade}?plan=pro&utm_source=email&utm_medium=lifecycle&utm_campaign=${utmCampaign}`;

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>⏰ Última chance, {nomeUsuario}</Heading>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>
              Faz <strong>14 dias</strong> que você não estuda no Simulai OAB. A prova
              da OAB não espera — e cada semana sem prática <em>reduz em 15-20% a
              probabilidade</em> de aprovação na 1ª tentativa.
            </Text>

            <Section style={urgencyBox}>
              <Text style={urgencyTitle}>Por que voltar agora?</Text>
              <Text style={urgencyBody}>
                ✓ 5.605 questões FGV oficiais (2010-2025)
                <br />
                ✓ IA corrigindo você em tempo real
                <br />
                ✓ Plano de estudo ajustado aos seus pontos fracos
                <br />✓ Garantia: cancele em 1 clique, a qualquer momento
              </Text>
            </Section>

            <Text style={paragraph}>
              <strong>R$ 89,99/mês</strong> é menos que o valor da inscrição do Exame.
              Não perca o investimento que você já fez no seu sonho.
            </Text>

            <Section style={{ textAlign: 'center', marginTop: 24 }}>
              <Button style={button} href={ctaHref}>
                Quero retomar meus estudos →
              </Button>
            </Section>

            <Text style={tinyNote}>
              Cancele quando quiser. Sem multa, sem letra miúda.
            </Text>

            <Hr style={hr} />
            <Text style={footerNote}>
              Não quer mais receber?{' '}
              <a href="https://simulaioab.com/configuracoes/notificacoes" style={link}>
                Gerenciar preferências
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
const urgencyBox: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(239,68,68,0.1) 100%)',
  border: '1px solid rgba(245,158,11,0.3)',
  borderRadius: '12px',
  padding: '20px',
  margin: '20px 0',
};
const urgencyTitle: React.CSSProperties = {
  color: '#fbbf24',
  fontSize: '14px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '0 0 10px',
};
const urgencyBody: React.CSSProperties = {
  color: '#f1f5f9',
  fontSize: '15px',
  lineHeight: 1.8,
  margin: 0,
};
const button: React.CSSProperties = {
  background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  color: '#fff',
  padding: '16px 36px',
  borderRadius: '10px',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: '16px',
  display: 'inline-block',
};
const tinyNote: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '11px',
  textAlign: 'center',
  margin: '12px 0 0',
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
