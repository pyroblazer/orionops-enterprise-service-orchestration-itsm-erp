import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and AI proxy
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/ai/')
  ) {
    return NextResponse.next();
  }

  // Allow public paths and login callback
  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/login/callback')) {
    return NextResponse.next();
  }

  // Let client-side handle auth protection via token validation
  // Middleware only needs to handle public/protected path routing
  // Client will check localStorage for JWT token and redirect to /login if missing
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|ai/).*)'],
};
