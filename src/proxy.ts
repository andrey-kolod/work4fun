// src/proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export default async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const pathname = request.nextUrl.pathname;

  // === ПУБЛИЧНЫЕ МАРШРУТЫ ===
  if (
    pathname === '/' || // 🔧 ДОБАВИЛИ главную страницу
    pathname.startsWith('/login') || // Страница логина
    pathname.startsWith('/register') || // Страница регистрации
    pathname.startsWith('/api/auth') || // API авторизации
    pathname.startsWith('/_next') || // Системные файлы Next.js
    pathname.startsWith('/public') || // Публичные файлы
    pathname.startsWith('/favicon.ico') || // Иконка
    pathname === '/no-projects' // Страница "нет проектов"
  ) {
    // 🔧 ВАЖНО: Главная страница должна быть публичной
    // чтобы пользователь мог попасть на / и увидеть что-то (например, приветствие)
    return NextResponse.next();
  }

  // 🔧 УБИРАЕМ редирект с / на /login - теперь / публичная
  // if (pathname === '/') {
  //   if (!token) {
  //     return NextResponse.redirect(new URL('/login', request.url));
  //   }
  //   return NextResponse.redirect(new URL('/project-select', request.url));
  // }

  // === ПРОЕКТ-SELECT - доступен только авторизованным ===
  if (pathname === '/project-select' || pathname.startsWith('/project-select/')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // === DASHBOARD - доступен только авторизованным ===
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const selectedProjectId = request.cookies.get('selectedProjectId')?.value;
    if (!selectedProjectId && pathname === '/dashboard') {
      console.log('[MIDDLEWARE] No project selected, redirecting to /project-select');
      return NextResponse.redirect(new URL('/project-select', request.url));
    }
    return NextResponse.next();
  }

  // === TASKS - доступен только авторизованным ===
  if (pathname.startsWith('/tasks')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // === ПРОВЕРКА ТОКЕНА ДЛЯ ВСЕХ ОСТАЛЬНЫХ МАРШРУТОВ ===
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // === ADMIN ПРАВА ===
  if (pathname.startsWith('/admin')) {
    if (token.role !== 'SUPER_ADMIN' && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // === API ADMIN ПРАВА ===
  if (pathname.startsWith('/api/admin')) {
    if (token.role !== 'SUPER_ADMIN' && token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
