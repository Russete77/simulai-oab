import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import { Toaster } from "sonner";
import { FreeAccessBanner } from "@/components/layout/free-access-banner";
import { CookieConsent } from "@/components/layout/cookie-consent";
import { logger } from "@/lib/logger";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://simulaioab.com'),
  title: {
    default: "Simulado OAB Online Grátis 2026 — 5.605 Questões com IA | Simulai OAB",
    template: "%s | Simulai OAB",
  },
  description: "Simulados OAB online grátis com 5.605 questões oficiais FGV (2010-2025). Explicações por IA, cronômetro real, 5 modos de estudo e predição de aprovação. A plataforma #1 para passar na OAB.",
  applicationName: "Simulai OAB",
  keywords: [
    "OAB",
    "Exame da OAB",
    "Simulado OAB",
    "Preparação OAB",
    "Questões OAB",
    "Direito",
    "Advocacia",
    "Simulado Jurídico",
    "IA OAB",
  ],
  authors: [{ name: "Simulai OAB" }],
  creator: "Simulai OAB",
  publisher: "Simulai OAB",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Simulai OAB",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://simulaioab.com',
    siteName: 'Simulai OAB',
    title: 'Simulai OAB - Preparação Inteligente para o Exame da OAB',
    description: 'Plataforma completa de preparação para o Exame da OAB com 5.605 questões reais de 2010 a 2025, revisão comentada e chatbot com IA integrado.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Simulai OAB - Preparação Inteligente para o Exame da OAB',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Simulai OAB - Preparação Inteligente para o Exame da OAB',
    description: 'Plataforma completa com 5.605 questões reais, revisão comentada e IA integrada.',
    images: ['/og-image.png'],
    creator: '@simulaioab',
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

/**
 * Body compartilhado — usado com e sem Clerk
 * GA4 NÃO é mais carregado no <head>. Ele é injetado
 * dinamicamente pelo <CookieConsent> após consentimento LGPD.
 */
function RootBody({ children }: { children: React.ReactNode }) {
  return (
    <body
      className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} font-sans antialiased bg-navy-950 text-white`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Organization',
                '@id': 'https://simulaioab.com/#organization',
                name: 'Simulai OAB',
                url: 'https://simulaioab.com',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://simulaioab.com/logo.png',
                },
                sameAs: [],
                description: 'Plataforma de preparação para o Exame da OAB com simulados, questões comentadas e IA integrada.',
              },
              {
                '@type': 'WebSite',
                '@id': 'https://simulaioab.com/#website',
                url: 'https://simulaioab.com',
                name: 'Simulai OAB',
                publisher: { '@id': 'https://simulaioab.com/#organization' },
                inLanguage: 'pt-BR',
              },
              {
                '@type': 'EducationalOrganization',
                '@id': 'https://simulaioab.com/#edu',
                name: 'Simulai OAB',
                url: 'https://simulaioab.com',
                description: 'Plataforma EdTech de preparação para o Exame da OAB com mais de 5.605 questões reais, simulados adaptativos e inteligência artificial.',
              },
            ],
          }),
        }}
      />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-blue-600 focus:text-white focus:rounded-md focus:top-4 focus:left-1/2 focus:-translate-x-1/2"
      >
        Pular para o conteúdo principal
      </a>

      <FreeAccessBanner />

      <main id="main-content">{children}</main>

      <Toaster
        position="top-right"
        theme="dark"
        richColors
        closeButton
        toastOptions={{
          className: "bg-navy-900 border-navy-800 text-white",
        }}
      />

      <CookieConsent />
    </body>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Durante o build, se a chave não estiver disponível, renderizar sem Clerk
  if (!publishableKey) {
    logger.warn("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY não encontrada durante o build");
    return (
      <html lang="pt-BR" className="dark">
        <RootBody>{children}</RootBody>
      </html>
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      localization={ptBR}
      telemetry={false}
      afterSignOutUrl="/"
      appearance={{
        baseTheme: undefined,
      }}
    >
      <html lang="pt-BR" className="dark">
        <RootBody>{children}</RootBody>
      </html>
    </ClerkProvider>
  );
}
