import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import withPWA from "@ducanh2912/next-pwa";
import { assertEnvOrThrow, checkRuntimeWarnings } from "./lib/env";

// Content Security Policy
//
// ATENCAO ao mexer: js.stripe.com precisa estar em script-src E em
// connect-src. O service worker do next-pwa intercepta a tag <script> e
// refaz a requisicao com fetch(), que e governado por connect-src — sem
// ele, o Stripe.js falha so para quem tem o SW registrado, e o sintoma
// ("Failed to load Stripe.js") nao aponta para a CSP.
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://js.stripe.com https://*.clerk.accounts.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.simulaioab.com https://*.clerk.dev https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com;
  worker-src 'self' blob:;
  style-src 'self' 'unsafe-inline' https://*.clerk.accounts.com https://*.clerk.accounts.dev https://*.clerk.com;
  img-src 'self' data: https: blob: https://*.clerk.com https://*.clerk.accounts.com https://*.clerk.accounts.dev https://www.google-analytics.com;
  font-src 'self' data:;
  connect-src 'self' https://js.stripe.com https://api.stripe.com https://merchant-ui-api.stripe.com https://m.stripe.network https://q.stripe.com https://*.clerk.accounts.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.simulaioab.com https://*.clerk.dev https://www.googletagmanager.com https://www.google-analytics.com https://api.openai.com https://challenges.cloudflare.com;
  frame-src https://js.stripe.com https://hooks.stripe.com https://m.stripe.network https://*.clerk.accounts.com https://*.clerk.accounts.dev https://*.clerk.com https://*.clerk.dev https://challenges.cloudflare.com;
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
        {
          // simulai-oab.vercel.app respondia 200 com "index, follow": uma
          // cópia inteira do site, indexável, competindo com o www por
          // conteúdo duplicado. O mesmo vale para toda URL de preview.
          //
          // Só o domínio de verdade deve ser indexado, e ele não casa aqui.
          source: '/:path*',
          has: [{ type: 'host', value: '.*\\.vercel\\.app' }],
          headers: [
            { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          ],
        },
      ];
    },
  }),
};

export default function config(phase: string) {
  // Falta de env var obrigatória quebra o BUILD — nada mal configurado chega
  // em produção. Só na fase de build: nunca em `next dev` nem em `next start`,
  // pra não repetir o incidente em que a validação derrubou o servidor no boot.
  //
  // Fora no GitHub Actions. Lá não existe segredo nenhum e nada é publicado:
  // o CI só roda typecheck, lint e testes. Como `next lint` carrega este
  // arquivo, a trava derrubava o CI — vermelho desde julho, escondendo
  // qualquer falha de verdade. Quem guarda o deploy é o build da Vercel, que
  // roda com o env real em toda PR e em todo push na main.
  if (phase === PHASE_PRODUCTION_BUILD && !process.env.GITHUB_ACTIONS) {
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
