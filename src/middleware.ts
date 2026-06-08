import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'

const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/pdv/webhook',
  '/api/setup',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // Extract token from Authorization header or cookie
  const authHeader = request.headers.get('authorization')
  const cookieToken = request.cookies.get('gastrocontrol_token')?.value

  const token =
    authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken

  // For API routes: return 401 if no valid token
  if (pathname.startsWith('/api/')) {
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 })
    }

    // Attach user context via headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.userId)
    requestHeaders.set('x-user-email', payload.email)
    requestHeaders.set('x-user-name', payload.name)
    requestHeaders.set('x-user-role', payload.role)
    requestHeaders.set('x-user-group-id', payload.groupId ?? '')
    requestHeaders.set('x-user-brand-id', payload.brandId ?? '')
    requestHeaders.set('x-user-unit-id', payload.unitId ?? '')

    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // For page routes: redirect to login if not authenticated
  if (!token || !verifyToken(token)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
