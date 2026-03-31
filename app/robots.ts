/**
 * Robots.txt dinâmico
 *
 * Define regras para crawlers e bots
 * Atualizado para permitir indexação de páginas públicas
 */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://simulaioab.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Bloquear apenas rotas privadas e APIs
        disallow: [
          '/api/',           // API routes - sempre privado
          '/dashboard/*',    // Dashboard do usuário - privado
          '/analytics/*',    // Analytics pessoais - privado
          '/checkout/*',     // Checkout - privado
          '/practice/*',     // Practice mode - privado (requer auth)
          '/simulations/*',  // Simulados - privado (requer auth)
          '/review/*',       // Review - privado (requer auth)
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
