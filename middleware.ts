import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/register(.*)',
  '/forgot-password(.*)',
  '/terms',
  '/privacy',
  '/api/webhooks(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Proteger rotas privadas
  if (!isPublicRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      const url = new URL('/login', req.url)
      return NextResponse.redirect(url)
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
