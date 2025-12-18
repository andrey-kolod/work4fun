// ФАЙЛ: src/middleware.ts
// НАЗНАЧЕНИЕ: Серверная защита маршрутов и умные редиректы

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const isDev = process.env.NODE_ENV === 'development';

  response.headers.set(
    'Content-Security-Policy',
    isDev
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' ws: wss:;"
      : "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self';"
  );

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // ЛОГИРОВАНИЕ ДЛЯ ОТЛАДКИ
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `🔍 Middleware: путь ${pathname}, авторизован: ${!!token}, роль: ${token?.role || 'нет'}`
    );
  }

  if (pathname === '/') {
    if (token) {
      console.log('✅ Авторизован на главной странице → редирект на /projects');
      return NextResponse.redirect(new URL('/projects', request.url));
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/password/reset') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/no-projects'
  ) {
    if (token && pathname.startsWith('/login')) {
      console.log('✅ Уже авторизован на /login — редирект на /projects');
      return NextResponse.redirect(new URL('/projects', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/projects')) {
    if (!token) {
      console.log('❌ Нет токена на /projects — редирект на /login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/tasks')) {
    if (!token) {
      console.log('❌ Нет токена в защищённой зоне — редирект на /login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const selectedProjectId = request.cookies.get('selectedProjectId')?.value;
    if (!selectedProjectId && pathname === '/dashboard') {
      console.log('[MIDDLEWARE] Нет выбранного проекта — редирект на /projects');
      return NextResponse.redirect(new URL('/projects', request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    console.log('❌ Нет токена — редирект на /login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/admin')) {
    if (token.role !== 'SUPER_ADMIN' && token.role !== 'PROJECT_LEAD') {
      console.log(`❌ Недостаточно прав для /admin (роль: ${token.role})`);
      return NextResponse.redirect(new URL('/projects', request.url));
    }
  }

  if (pathname.startsWith('/api/admin')) {
    if (token.role !== 'SUPER_ADMIN' && token.role !== 'PROJECT_LEAD') {
      console.log(`❌ Forbidden для /api/admin (роль: ${token.role})`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
