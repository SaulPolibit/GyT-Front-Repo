import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl

  // Handle Supabase password recovery redirect
  // Supabase redirects to site URL with hash fragment, but Next.js doesn't see hash on server
  // Check if this is coming from Supabase auth verify endpoint
  const token = searchParams.get('token')
  const type = searchParams.get('type')

  // If this is a recovery token at root, redirect to reset-password page
  if (pathname === '/' && token && type === 'recovery') {
    const url = request.nextUrl.clone()
    url.pathname = '/reset-password'
    // Keep all query params and hash will be preserved by browser
    return NextResponse.redirect(url)
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
