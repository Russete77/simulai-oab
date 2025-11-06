/**
 * Robots.txt dinâmico
 *
 * Define regras para crawlers e bots
 */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://simulaioab.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/practice/',
          '/simulations/',
          '/analytics/',
          '/review/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
