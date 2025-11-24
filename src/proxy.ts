// directworkflow/middleware.ts
// Защищает маршруты и API с помощью next-auth и настраивает доступ на основе ролей пользователей.

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(request) {
    const token = request.nextauth?.token;
    const pathname = request.nextUrl.pathname;

    if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    if (pathname.startsWith('/admin')) {
      if (token?.role === 'SUPER_ADMIN') {
        return NextResponse.next();
      }

      if (token?.role === 'ADMIN') {
        if (pathname.startsWith('/admin/system')) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.next();
      }

      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (pathname.startsWith('/api')) {
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (
        pathname.startsWith('/api/admin') &&
        token.role !== 'SUPER_ADMIN' &&
        token.role !== 'ADMIN'
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        const publicRoutes = ['/', '/auth/login', '/auth/register', '/api/auth', '/project-select'];

        if (publicRoutes.some((route) => pathname === route || pathname.startsWith(route))) {
          return true;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
