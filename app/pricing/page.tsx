import type { Metadata } from 'next';
import { PricingClient } from './pricing-client';

export const metadata: Metadata = {
  title: 'Planos e Preços - Simulai OAB',
  description: 'Compare os planos do Simulai OAB: Gratuito, Básico (R$49,90/mês), Pro (R$89,90/mês) e Premium (R$129,90/mês). Simulados ilimitados, IA integrada e analytics completos para aprovação na OAB.',
  keywords: ['preço simulado oab', 'planos simulado oab', 'quanto custa simulai oab', 'assinatura oab', 'simulado oab preço'],
  openGraph: {
    title: 'Planos e Preços - Simulai OAB',
    description: 'Compare os planos do Simulai OAB. A partir de R$0. Simulados ilimitados, IA integrada e analytics.',
    url: 'https://simulaioab.com/pricing',
    type: 'website',
  },
  twitter: {
    title: 'Planos e Preços - Simulai OAB',
    description: 'Compare os planos do Simulai OAB. A partir de R$0.',
    card: 'summary_large_image',
  },
};

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Planos e Preços - Simulai OAB',
            description: 'Compare os planos do Simulai OAB: Gratuito, Básico, Pro e Premium.',
            url: 'https://simulaioab.com/pricing',
            offers: [
              {
                '@type': 'Offer',
                name: 'Plano Gratuito',
                description: 'Acesso básico com questões limitadas',
                price: '0',
                priceCurrency: 'BRL',
                url: 'https://simulaioab.com/pricing',
              },
              {
                '@type': 'Offer',
                name: 'Plano Básico',
                description: 'Acesso a simulados com limite de questões por mês',
                price: '49.90',
                priceCurrency: 'BRL',
                billingDuration: 'P1M',
                url: 'https://simulaioab.com/pricing',
              },
              {
                '@type': 'Offer',
                name: 'Plano Pro',
                description: 'Simulados ilimitados com IA integrada e analytics',
                price: '89.90',
                priceCurrency: 'BRL',
                billingDuration: 'P1M',
                url: 'https://simulaioab.com/pricing',
              },
              {
                '@type': 'Offer',
                name: 'Plano Premium',
                description: 'Acesso completo com tudo incluído, suporte prioritário e recursos avançados',
                price: '129.90',
                priceCurrency: 'BRL',
                billingDuration: 'P1M',
                url: 'https://simulaioab.com/pricing',
              },
            ],
          }),
        }}
      />
      <PricingClient />
    </>
  );
}
