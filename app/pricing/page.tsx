import type { Metadata } from 'next';
import { PricingClient } from './pricing-client';

export const metadata: Metadata = {
  title: 'Planos e Preços - Simulai OAB',
  description: 'Compare os planos do Simulai OAB: Essencial (R$19,90/mês) e Pro com IA (R$89,90/mês). Simulados ilimitados, IA integrada e analytics completos para aprovação na OAB. Garantia de 7 dias.',
  keywords: ['preço simulado oab', 'planos simulado oab', 'quanto custa simulai oab', 'assinatura oab', 'simulado oab preço'],
  alternates: {
    canonical: 'https://www.simulaioab.com/pricing',
  },
  openGraph: {
    title: 'Planos e Preços - Simulai OAB',
    description: 'Compare os planos do Simulai OAB. Simulados ilimitados, IA integrada e analytics. Garantia 7 dias.',
    url: 'https://www.simulaioab.com/pricing',
    type: 'website',
  },
  twitter: {
    title: 'Planos e Preços - Simulai OAB',
    description: 'Compare os planos do Simulai OAB. Mensal direto, garantia 7 dias.',
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
            description: 'Compare os planos do Simulai OAB: Essencial e Pro. Mensalidade direta, garantia 7 dias.',
            url: 'https://www.simulaioab.com/pricing',
            offers: [
              {
                '@type': 'Offer',
                name: 'Plano Essencial',
                description: 'Tudo liberado: simulados ilimitados, 5.875 questões, analytics avançado, flashcards + 3 explicações de IA por dia.',
                price: '19.90',
                priceCurrency: 'BRL',
                billingDuration: 'P1M',
                url: 'https://www.simulaioab.com/pricing',
              },
              {
                '@type': 'Offer',
                name: 'Plano Pro',
                description: 'Tudo do Essencial + IA: explicações ilimitadas, chat com IA, coaching virtual, relatórios em PDF.',
                price: '89.90',
                priceCurrency: 'BRL',
                billingDuration: 'P1M',
                url: 'https://www.simulaioab.com/pricing',
              },
            ],
          }),
        }}
      />
      <PricingClient />
    </>
  );
}
