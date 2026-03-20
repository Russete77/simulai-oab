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
  '/api/webhooks(.*)',
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
    // Proteger rotas privadas
    if (!isPublicRoute(req)) {
      const { userId } = await auth()
      if (!userId) {
        const url = new URL('/login', req.url)
        return NextResponse.redirect(url)
      }
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
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml|txt)).*)',
    '/(api|trpc)(.*)',
  ],
}
