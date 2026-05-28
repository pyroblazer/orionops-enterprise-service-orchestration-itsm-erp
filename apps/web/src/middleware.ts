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

  // Protected routes: check auth cookie (set by /login/callback after token exchange)
  const authCookie = request.cookies.get('orionops_authenticated');
  if (!authCookie || authCookie.value !== 'true') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    const response = NextResponse.redirect(loginUrl);
    // Store the destination path in a response cookie so /login/callback can retrieve it
    response.cookies.set('orionops_redirect_after_auth', pathname, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|ai/).*)'],
};
