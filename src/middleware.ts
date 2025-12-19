import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const isDev = process.env.NODE_ENV === 'development';

  // CSP заголовки
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

  // Логи в dev-режиме
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `🔍 Middleware: путь ${pathname}, авторизован: ${!!token}, роль: ${token?.role || 'нет'}`
    );
  }

  // Пути, доступные без авторизации
  if (
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/password/reset') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname === '/favicon.ico' ||
    pathname === '/no-projects'
  ) {
    // Если уже авторизован и зашёл на /login — редирект на проекты
    if (token && pathname === '/login') {
      return NextResponse.redirect(new URL('/projects', request.url));
    }
    return NextResponse.next();
  }

  // Если нет токена — на логин
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Корневой путь — редирект на выбор проекта
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/projects', request.url));
  }

  // Страница выбора проектов — доступна всем авторизованным
  if (pathname.startsWith('/projects')) {
    return NextResponse.next();
  }

  // Дашборд и задачи — проверяем, выбран ли проект (по куке)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/tasks')) {
    const selectedProjectId = request.cookies.get('selectedProjectId')?.value;
    if (!selectedProjectId && pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/projects', request.url));
    }
    return NextResponse.next();
  }

  // Админка (/admin и /admin/projects/create) — только для SUPER_ADMIN
  if (pathname.startsWith('/admin')) {
    if (token.role !== 'SUPER_ADMIN') {
      console.log(`❌ Недостаточно прав для /admin (роль: ${token.role})`);
      return NextResponse.redirect(new URL('/projects', request.url));
    }
    return NextResponse.next();
  }

  // API админки — только SUPER_ADMIN
  if (pathname.startsWith('/api/admin')) {
    if (token.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.next();
  }

  // Всё остальное — пропускаем
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
