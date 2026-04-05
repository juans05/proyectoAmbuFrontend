import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register']
const DASHBOARD_PREFIX = '/dashboard'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('accessToken')?.value

  const isPublicRoute = PUBLIC_ROUTES.some(r => pathname.startsWith(r))
  const isDashboardRoute = pathname.startsWith(DASHBOARD_PREFIX) || pathname === '/'

  const hasValidToken = token && token !== 'undefined'
  
  // Sin token (o token inválido) intentando acceder a dashboard → redirigir a login
  if (!hasValidToken && isDashboardRoute && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Con token intentando acceder a login → redirigir a dashboard
  if (hasValidToken && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}
