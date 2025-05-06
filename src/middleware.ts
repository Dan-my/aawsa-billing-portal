import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userRole = request.cookies.get('userRole')?.value;

  // Handle the login page ('/')
  if (pathname === '/') {
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    if (userRole === 'staff') {
      return NextResponse.redirect(new URL('/staff/dashboard', request.url));
    }
    // If no specific role or not logged in, allow access to login page
    return NextResponse.next();
  }

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'admin') {
      // If user is not admin, redirect to login page
      return NextResponse.redirect(new URL('/', request.url));
    }
    // If user is admin, allow access
    return NextResponse.next();
  }

  // Staff routes protection
  if (pathname.startsWith('/staff')) {
    if (userRole !== 'staff') {
      // If user is not staff, redirect to login page
      return NextResponse.redirect(new URL('/', request.url));
    }
    // If user is staff, allow access
    return NextResponse.next();
  }
  
  // For any other path, if user is not logged in (no userRole cookie), redirect to login.
  // This handles cases where new routes might be added that are not explicitly /admin or /staff but are still protected.
  // If a route is public and not '/', it would need to be excluded from the matcher or handled explicitly here.
  if (!userRole) {
      return NextResponse.redirect(new URL('/', request.url));
  }

  // If none of the above conditions met (e.g., unknown role on an unknown path but cookie exists),
  // or if checks passed, allow access.
  return NextResponse.next();
}

export const config = {
  // Match all request paths except for the ones starting with:
  // - api (API routes)
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  // This ensures middleware runs on all page navigations.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};