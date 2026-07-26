import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import { Toaster } from "sonner";
import { FreeAccessBanner } from "@/components/layout/free-access-banner";
import { CookieConsent } from "@/components/layout/cookie-consent";
import { SessionHeartbeat } from "@/components/tracking/session-heartbeat";
import { UtmCapture } from "@/components/tracking/utm-capture";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeScript } from "@/components/theme/theme-script";
import { logger } from "@/lib/logger";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://simulaioab.com"),
  title: {
    default: "Simulai OAB — 5.875 Questões Oficiais com IA",
    template: "%s | Simulai OAB",
  },
  description:
    "Plataforma de preparação para o Exame da OAB com 5.875 questões oficiais (2010-2026), simulados adaptativos, analytics por matéria e IA integrada (no Pro).",
  applicationName: "Simulai OAB",
  authors: [{ name: "Simulai OAB" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "180x180", type: "image/png" }],
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
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://simulaioab.com",
    siteName: "Simulai OAB",
    title: "Simulai OAB — Preparação Inteligente para a OAB",
    description:
      "5.875 questões oficiais, simulados adaptativos e (no Pro) IA integrada com explicações e chat.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Simulai OAB",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Simulai OAB",
    description: "Plataforma com 5.875 questões oficiais e IA integrada.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBFAF9" },
    { media: "(prefers-color-scheme: dark)", color: "#191919" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

function RootBody({ children }: { children: React.ReactNode }) {
  return (
    <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-accent focus:text-accent-fg focus:rounded-md focus:top-4 focus:left-1/2 focus:-translate-x-1/2"
      >
        Pular para o conteúdo principal
      </a>

      <ThemeProvider>
        <FreeAccessBanner />
        <SessionHeartbeat />
        <Suspense fallback={null}>
          <UtmCapture />
        </Suspense>

        <main id="main-content">{children}</main>

        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            className: "bg-surface border text-ink-1",
          }}
        />

        <CookieConsent />
      </ThemeProvider>
    </body>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    logger.warn("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY não encontrada durante o build");
    return (
      <html lang="pt-BR" suppressHydrationWarning>
        <head>
          <ThemeScript />
        </head>
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
    >
      <html lang="pt-BR" suppressHydrationWarning>
        <head>
          <ThemeScript />
        </head>
        <RootBody>{children}</RootBody>
      </html>
    </ClerkProvider>
  );
}
