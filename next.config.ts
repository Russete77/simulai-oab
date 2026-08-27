import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import withPWA from "@ducanh2912/next-pwa";
import { assertEnvOrThrow, checkRuntimeWarnings } from "./lib/env";

// Content Security Policy
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://js.stripe.com https://*.clerk.accounts.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.simulaioab.com https://*.clerk.dev https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com;
  worker-src 'self' blob:;
  style-src 'self' 'unsafe-inline' https://*.clerk.accounts.com https://*.clerk.accounts.dev https://*.clerk.com;
  img-src 'self' data: https: blob: https://*.clerk.com https://*.clerk.accounts.com https://*.clerk.accounts.dev https://www.google-analytics.com;
  font-src 'self' data:;
  connect-src 'self' https://api.stripe.com https://merchant-ui-api.stripe.com https://*.clerk.accounts.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.simulaioab.com https://*.clerk.dev https://www.googletagmanager.com https://www.google-analytics.com https://api.openai.com https://challenges.cloudflare.com;
  frame-src https://js.stripe.com https://hooks.stripe.com https://*.clerk.accounts.com https://*.clerk.accounts.dev https://*.clerk.com https://*.clerk.dev https://challenges.cloudflare.com;
  media-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`;

// Security headers
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim(),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'huggingface.co',
      },
    ],
  },
  ...(securityHeaders.length > 0 && {
    async headers() {
      return [
        {
          source: '/:path*',
          headers: securityHeaders,
        },
      ];
    },
  }),
};

export default function config(phase: string) {
  // Falta de env var obrigatória quebra o BUILD — nada mal configurado chega
  // em produção. Só na fase de build: nunca em `next dev` nem em `next start`,
  // pra não repetir o incidente em que a validação derrubou o servidor no boot.
  if (phase === PHASE_PRODUCTION_BUILD) {
    assertEnvOrThrow();

    // Não quebram o build, mas ficam registrados no log da Vercel — é config
    // meio-feita que falha em silêncio (rate limit desligado, paywall
    // desligado, e-mail sem chave).
    for (const warning of checkRuntimeWarnings()) {
      console.warn(`[ENV] ${warning}`);
    }
  }

  return withPWA({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development",
  })(nextConfig);
}
