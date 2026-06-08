import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/pdv/webhook',
  '/api/setup',
]

// Edge-compatible JWT decode (no signature verification — used only for routing/headers)
function decodeJWT(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    if (payload.exp && payload.exp < Date.now() / 1000) return null
    return payload
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  const authHeader = request.headers.get('authorization')
  const cookieToken = request.cookies.get('gastrocontrol_token')?.value
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken

  if (pathname.startsWith('/api/')) {
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const payload = decodeJWT(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 })
    }
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.userId ?? '')
    requestHeaders.set('x-user-email', payload.email ?? '')
    requestHeaders.set('x-user-name', payload.name ?? '')
    requestHeaders.set('x-user-role', payload.role ?? '')
    requestHeaders.set('x-user-group-id', payload.groupId ?? '')
    requestHeaders.set('x-user-brand-id', payload.brandId ?? '')
    requestHeaders.set('x-user-unit-id', payload.unitId ?? '')
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  if (!token || !decodeJWT(token)) {
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
