import { NextRequest, NextResponse } from 'next/server';

// Routes that require specific roles. Paths not listed here are accessible to all authenticated users.
const ROLE_ROUTES: Record<string, string[]> = {
  '/dashboard/customers': ['super_admin', 'admin_sales'],
  '/dashboard/orders':    ['super_admin', 'admin_sales'],
  '/dashboard/trucks':    ['super_admin', 'admin_ops'],
  '/dashboard/drivers':   ['super_admin', 'admin_ops'],
  '/dashboard/dispatch':  ['super_admin', 'admin_ops'],
  '/dashboard/users':     ['super_admin'],
};

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const role  = request.cookies.get('role')?.value;
  const { pathname } = request.nextUrl;

  // Public routes — allow everyone
  if (pathname === '/login' || pathname === '/') {
    return NextResponse.next();
  }

  // Dashboard routes — require auth first
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Role-based access check
    if (role) {
      for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
        if (pathname.startsWith(route) && !allowedRoles.includes(role)) {
          return NextResponse.redirect(new URL('/dashboard?denied=1', request.url));
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
