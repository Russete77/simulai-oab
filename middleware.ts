import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/register(.*)',
  '/forgot-password(.*)',
  '/terms',
  '/privacy',
  '/pricing',
  '/diagnostico',          // Funil: simulado diagnóstico grátis
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
  '/questoes(.*)',           // Questões individuais (5.605 páginas)
  '/materias(.*)',           // Páginas por matéria (17 páginas)
  '/blog(.*)',               // Blog posts
  '/gabarito(.*)',           // Gabaritos de exames (43+ páginas)
  '/simulado(.*)',           // Simulados por exame (43+ páginas)
  '/simulado-oab-online',   // Landing page SEO principal
  '/questao-do-dia',        // Questão do dia (engajamento + SEO)
  '/leaderboard',           // Ranking público (social proof)
  '/como-funciona',         // Página institucional SEO
  '/questoes-oab(.*)',      // Hub de questões por matéria
  '/simulados-oab(.*)',     // Hub de simulados
])

export default clerkMiddleware(
  async (auth, req) => {
    // auth() precisa ser chamado em toda requisição — inclusive rotas públicas —
    // para que o contexto do Clerk fique disponível a getCurrentUser()/auth() em
    // Server Components dessas páginas (ex: /diagnostico chama getCurrentUser()).
    const { userId } = await auth()

    // Proteger rotas privadas
    if (!isPublicRoute(req) && !userId) {
      const url = new URL('/login', req.url)
      return NextResponse.redirect(url)
    }
  },
  {
    // Necessário para permitir CORS quando usando domínio customizado (clerk.simulaioab.com)
    // Em desenvolvimento (localhost), não precisa de authorizedParties
    ...(process.env.NODE_ENV === 'production' && {
      authorizedParties: ['https://www.simulaioab.com'],
    }),
  }
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
