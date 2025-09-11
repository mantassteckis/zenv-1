import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Handle Vite client requests that may come from browser dev tools or extensions
  // This prevents 404 errors in development when tools expect Vite's HMR client
  if (request.nextUrl.pathname === '/@vite/client') {
    return new NextResponse('', { status: 204 }) // No Content
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Also specifically match /@vite/client requests
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/@vite/client',
  ],
}