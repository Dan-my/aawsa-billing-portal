import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userRole = request.cookies.get('userRole')?.value; // Placeholder, use actual auth

  // Allow access to the login page
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Staff routes protection
  if (pathname.startsWith('/staff')) {
    if (userRole !== 'staff') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // If no role and not on login page, redirect to login
  if (!userRole && pathname !== '/') {
      return NextResponse.redirect(new URL('/', request.url));
  }


  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
