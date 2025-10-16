import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import { Toaster } from "sonner";
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
    default: "Simulai OAB - Preparação Inteligente para o Exame da OAB",
    template: "%s | Simulai OAB",
  },
  description: "Plataforma completa de preparação para o Exame da OAB com IA, simulados adaptativos e análise de desempenho. Mais de 2.469 questões reais de 2010 a 2025.",
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
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Obter a chave publicável do Clerk
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Durante o build, se a chave não estiver disponível, renderizar sem Clerk
  // Isso permite que o build seja concluído, mas o Clerk funcionará em runtime
  if (!publishableKey) {
    console.warn('⚠️ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY não encontrada durante o build. Configure no Vercel para produção.');
    return (
      <html lang="pt-BR" className="dark">
        <body className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} font-sans antialiased bg-navy-950 text-white`}>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-blue-600 focus:text-white focus:rounded-md focus:top-4 focus:left-1/2 focus:-translate-x-1/2">
            Pular para o conteúdo principal
          </a>
          {children}
          <Toaster
            position="top-right"
            theme="dark"
            richColors
            closeButton
            toastOptions={{
              className: "bg-navy-900 border-navy-800 text-white",
            }}
          />
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} localization={ptBR}>
      <html lang="pt-BR" className="dark">
        <body className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} font-sans antialiased bg-navy-950 text-white`}>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-blue-600 focus:text-white focus:rounded-md focus:top-4 focus:left-1/2 focus:-translate-x-1/2">
            Pular para o conteúdo principal
          </a>
          {children}
          <Toaster
            position="top-right"
            theme="dark"
            richColors
            closeButton
            toastOptions={{
              className: "bg-navy-900 border-navy-800 text-white",
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
