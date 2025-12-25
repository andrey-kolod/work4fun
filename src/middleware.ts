// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { $Enums } from '@prisma/client';

export async function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';
  const { pathname } = request.nextUrl;

  // ============================================
  // 🛡️ 1. Установка заголовков безопасности (CSP)
  // ============================================
  const response = NextResponse.next();

  const cspDirectives = isDev
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self' ws: wss: https://www.google.com https://www.gstatic.com",
        "frame-src 'self' https://www.google.com https://www.gstatic.com",
        "frame-ancestors 'self'",
      ]
    : [
        "default-src 'self'",
        "script-src 'self' https://www.google.com https://www.gstatic.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self' https://www.google.com https://www.gstatic.com",
        "frame-src 'self' https://www.gstatic.com https://www.google.com",
        "frame-ancestors 'self'",
      ];

  if (isDev) {
    console.log('🔒 [Middleware] CSP применён:', cspDirectives.join('; '));
  }

  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // ============================================
  // 📍 2. Логирование запроса (только dev)
  // ============================================
  if (isDev) {
    console.log(`🔍 [Middleware] ${request.method} ${pathname}`);
  }

  // ============================================
  // 🆓 3. Публичные пути (без авторизации)
  // ============================================
  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/password/reset',
    '/api/auth',
    '/_next',
    '/public',
    '/favicon.ico',
    '/no-projects',
    '/demo',
    '/terms',
    '/privacy-policy',
  ];

  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isPublicPath) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    // Если пользователь уже авторизован и пытается зайти на главную/логин/регистрацию
    if (token && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
      if (isDev) {
        console.log(`↳ [Middleware] Авторизован на публичной странице — редирект на /projects`);
      }
      return NextResponse.redirect(new URL('/projects', request.url));
    }

    if (isDev) {
      console.log(`↳ [Middleware] Публичный путь ${pathname} — пропуск`);
    }
    return response;
  }

  // ============================================
  // 🔐 4. Проверка авторизации
  // ============================================
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.sub) {
    if (isDev) {
      console.log(`↳ [Middleware] Нет токена — редирект на /login`);
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURIComponent(pathname));
    return NextResponse.redirect(loginUrl);
  }

  const userId = token.sub as string;
  const userRole = token.role as $Enums.Role;

  if (isDev) {
    console.log(`↳ [Middleware] Пользователь ID: ${userId}, Роль: ${userRole}`);
  }

  // ============================================
  // 🎯 5. Корневой путь (/) - упрощённая логика
  // ============================================
  if (pathname === '/') {
    if (isDev) {
      console.log(`↳ [Middleware] Корневой путь — редирект на /projects`);
    }
    return NextResponse.redirect(new URL('/projects', request.url));
  }

  // ============================================
  // 📋 6. Страница проектов (/projects*) - упрощённая проверка
  // ============================================
  if (pathname.startsWith('/projects')) {
    if (isDev) {
      console.log(`↳ [Middleware] Доступ к /projects разрешён`);
    }

    // Разрешаем доступ к созданию проекта всем авторизованным
    if (pathname === '/projects/create') {
      if (isDev) {
        console.log(`✅ [Middleware] Разрешаем создание проекта для ${userRole}`);
      }
      return response;
    }

    return response;
  }

  // ============================================
  // 📊 7. Дашборд и задачи - упрощённая проверка
  // ============================================
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/tasks')) {
    const projectId = request.nextUrl.searchParams.get('projectId');

    if (!projectId) {
      if (isDev) {
        console.log(`↳ [Middleware] Нет projectId — редирект на /projects`);
      }
      return NextResponse.redirect(new URL('/projects', request.url));
    }

    if (isDev) {
      console.log(`↳ [Middleware] ProjectId найден: ${projectId}, доступ к ${pathname} разрешён`);
    }

    return response;
  }

  // ============================================
  // 👑 8. Админка - проверка роли
  // ============================================
  if (pathname.startsWith('/admin')) {
    // Только SUPER_ADMIN может создавать проекты через админку
    if (pathname === '/admin/projects/create' && userRole !== $Enums.Role.SUPER_ADMIN) {
      if (isDev) {
        console.log(
          `❌ [Middleware] Доступ к админскому созданию проекта запрещён для ${userRole}`
        );
      }
      return NextResponse.redirect(new URL('/projects/create', request.url));
    }

    // Все остальные админские пути только для SUPER_ADMIN
    if (userRole !== $Enums.Role.SUPER_ADMIN) {
      if (isDev) {
        console.log(`❌ [Middleware] Доступ к админке запрещён (роль: ${userRole})`);
      }
      return NextResponse.redirect(new URL('/projects', request.url));
    }
    return response;
  }

  // ============================================
  // 🔌 9. API админки
  // ============================================
  if (pathname.startsWith('/api/admin')) {
    if (userRole !== $Enums.Role.SUPER_ADMIN) {
      if (isDev) {
        console.log(`❌ [Middleware] Доступ к API админки запрещён (роль: ${userRole})`);
      }
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return response;
  }

  // ============================================
  // 🔧 10. API проектов - упрощённая проверка
  // ============================================
  if (pathname.startsWith('/api/projects') && request.method === 'POST') {
    if (isDev) {
      console.log(`↳ [Middleware] Запрос на создание проекта от пользователя ${userId}`);
    }
    return response;
  }

  // ============================================
  // ✅ 11. Всё остальное
  // ============================================
  if (isDev) {
    console.log(`✅ [Middleware] Разрешён доступ к ${pathname}`);
  }
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
  // Указываем, что middleware должен работать в Node.js runtime, а не Edge
  runtime: 'nodejs',
};
