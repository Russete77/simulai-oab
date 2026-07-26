import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { PUBLIC_ROUTES } from '@/lib/public-routes'

const isPublicRoute = createRouteMatcher([...PUBLIC_ROUTES])

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
