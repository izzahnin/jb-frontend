import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes - allow everyone
  if (pathname === '/login' || 
      pathname === '/' || 
      pathname.startsWith('/track')) {
    return NextResponse.next();
  }

  // Admin routes - require auth
  if (pathname.startsWith('/orders') || 
      pathname.startsWith('/trucks') || 
      pathname.startsWith('/users')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
