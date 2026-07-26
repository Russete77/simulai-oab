/**
 * Lista de rotas públicas usada pelo middleware (via createRouteMatcher do
 * Clerk). Extraída pra um módulo próprio pra poder ser testada sem precisar
 * importar middleware.ts (que puxa APIs do Clerk específicas de edge
 * runtime, incompatíveis com o ambiente de teste do vitest).
 */
export const PUBLIC_ROUTES = [
  '/',
  '/login(.*)',
  '/register(.*)',
  '/forgot-password(.*)',
  '/terms',
  '/privacy',
  '/pricing',
  '/diagnostico', // Funil: simulado diagnóstico grátis
  '/api/webhooks(.*)',
  // ===== ARQUIVOS ESTÁTICOS PÚBLICOS (public/) =====
  // O matcher do Next só pula _next/static, _next/image e favicon.ico —
  // qualquer outro arquivo em public/ passa pelo middleware e, sem isso,
  // é redirecionado pro /login pra visitante anônimo (quebra o service
  // worker do PWA e o push, que dependem de sw.js/push-sw.js/manifest.json).
  '/manifest.json',
  '/sw.js',
  '/push-sw.js',
  '/workbox-(.*)',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.png',
  '/og-image.png',
  // ===== PÁGINAS PÚBLICAS PARA SEO =====
  // Todas as páginas que devem ser indexadas pelo Google
  '/questoes(.*)', // Questões individuais (5.605 páginas)
  '/materias(.*)', // Páginas por matéria (17 páginas)
  '/blog(.*)', // Blog posts
  '/gabarito(.*)', // Gabaritos de exames (43+ páginas)
  '/simulado(.*)', // Simulados por exame (43+ páginas)
  '/simulado-oab-online', // Landing page SEO principal
  '/questao-do-dia', // Questão do dia (engajamento + SEO)
  '/leaderboard', // Ranking público (social proof)
  '/como-funciona', // Página institucional SEO
  '/questoes-oab(.*)', // Hub de questões por matéria
  '/simulados-oab(.*)', // Hub de simulados
] as const;
