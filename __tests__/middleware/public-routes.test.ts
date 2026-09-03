import { describe, it, expect } from 'vitest';
import { createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { PUBLIC_ROUTES } from '@/lib/public-routes';

/**
 * Bug real que motivou este teste: o `/diagnostico` (CTA principal do
 * funil gratuito) ficou fora do matcher do Next.js por semanas — o
 * middleware nunca rodava pra essa rota e a página quebrava com 500 ao
 * chamar getCurrentUser() sem contexto do Clerk. Este teste garante que
 * toda rota que precisa ser pública continua classificada como pública
 * pelo matcher de verdade usado em produção (não uma reimplementação).
 */
describe('isPublicRoute (middleware)', () => {
  const isPublicRoute = createRouteMatcher([...PUBLIC_ROUTES]);

  function pub(path: string) {
    return isPublicRoute(new NextRequest(new URL(path, 'http://localhost')));
  }

  it('classifica o funil gratuito e páginas institucionais como públicas', () => {
    expect(pub('/')).toBe(true);
    expect(pub('/diagnostico')).toBe(true);
    expect(pub('/pricing')).toBe(true);
    expect(pub('/login')).toBe(true);
    expect(pub('/register')).toBe(true);
    expect(pub('/como-funciona')).toBe(true);
  });

  it('classifica páginas SEO de questões/simulados como públicas', () => {
    expect(pub('/questoes/abc123')).toBe(true);
    expect(pub('/simulado/2024-01')).toBe(true);
    expect(pub('/blog/algum-post')).toBe(true);
    expect(pub('/leaderboard')).toBe(true);
  });

  it('classifica assets estáticos do PWA como públicos (regressão do middleware)', () => {
    expect(pub('/sw.js')).toBe(true);
    expect(pub('/manifest.json')).toBe(true);
    // O next/image busca estes no servidor, sem cookie: se caírem no /login
    // ele recebe HTML e responde 400, e o logo quebra para todo mundo.
    expect(pub('/logo.png')).toBe(true);
    expect(pub('/logo-wordmark.png')).toBe(true);
    expect(pub('/logo-badge.png')).toBe(true);
    // Googlebot é visitante anônimo: se estes caírem no /login, o sitemap
    // com as páginas de SEO nunca é indexado.
    expect(pub('/sitemap.xml')).toBe(true);
    expect(pub('/robots.txt')).toBe(true);
    expect(pub('/workbox-f1770938.js')).toBe(true);
  });

  it('mantém rotas privadas fora da lista pública', () => {
    expect(pub('/dashboard')).toBe(false);
    expect(pub('/practice')).toBe(false);
    expect(pub('/perfil')).toBe(false);
    expect(pub('/admin')).toBe(false);
    expect(pub('/simulations/abc/result')).toBe(false);
  });

  it('webhooks (Asaas, Clerk) são públicos pro Clerk — se autenticam por assinatura/token próprio, não sessão', () => {
    expect(pub('/api/webhooks/asaas')).toBe(true);
    expect(pub('/api/webhooks/clerk')).toBe(true);
  });
});
