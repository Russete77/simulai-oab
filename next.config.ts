import type { NextConfig } from "next";
import withPWA from "next-pwa";

// Validar variáveis de ambiente no build
import "./lib/env";

// Content Security Policy
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.com https://*.clerk.com https://clerk.simulaioab.com https://*.clerk.dev;
  style-src 'self' 'unsafe-inline' https://*.clerk.accounts.com https://*.clerk.com;
  img-src 'self' data: https: blob: https://*.clerk.com https://*.clerk.accounts.com;
  font-src 'self' data:;
  connect-src 'self' https://*.clerk.accounts.com https://*.clerk.com https://clerk.simulaioab.com https://*.clerk.dev ${process.env.NEXT_PUBLIC_SUPABASE_URL || ''};
  frame-src https://*.clerk.accounts.com https://*.clerk.com https://*.clerk.dev;
  media-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`;

// Security headers (apenas em produção)
const securityHeaders = process.env.NODE_ENV === 'production' ? [
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
] : [];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    domains: ["huggingface.co"],
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

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
