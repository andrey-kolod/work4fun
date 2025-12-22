// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
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
        "frame-src 'self' https://www.google.com https://www.gstatic.com",
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
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userId = token.sub as string;
  const userRole = token.role as $Enums.Role;

  if (isDev) {
    console.log(`↳ [Middleware] Пользователь ID: ${userId}, Роль: ${userRole}`);
  }

  // ============================================
  // 🎯 5. Корневой путь (/)
  // ============================================
  if (pathname === '/') {
    try {
      const projectCount = await prisma.projectMembership.count({
        where: { userId },
      });

      if (isDev) {
        console.log(`↳ [Middleware] Проектов у пользователя: ${projectCount}`);
      }

      if (projectCount === 0) {
        if (isDev) {
          console.log(`↳ [Middleware] Нет проектов — редирект на /no-projects`);
        }
        return NextResponse.redirect(new URL('/no-projects', request.url));
      }

      if (projectCount === 1) {
        const membership = await prisma.projectMembership.findFirst({
          where: { userId },
          select: { projectId: true },
        });

        if (membership?.projectId) {
          const tasksUrl = new URL('/tasks', request.url);
          tasksUrl.searchParams.set('projectId', membership.projectId);
          if (isDev) {
            console.log(
              `↳ [Middleware] Один проект — редирект в /tasks?projectId=${membership.projectId}`
            );
          }
          return NextResponse.redirect(tasksUrl);
        }
      }

      if (isDev) {
        console.log(`↳ [Middleware] Несколько проектов — редирект на /projects`);
      }
      return NextResponse.redirect(new URL('/projects', request.url));
    } catch (error) {
      console.error('💥 [Middleware] Ошибка проверки проектов:', error);
      return NextResponse.redirect(new URL('/projects', request.url));
    }
  }

  // ============================================
  // 📋 6. Страница проектов (/projects*)
  // ============================================
  if (pathname.startsWith('/projects')) {
    if (isDev) {
      console.log(`↳ [Middleware] Доступ к /projects разрешён (явный запрос пользователя)`);
    }

    // Проверка лимита при создании проекта
    if (pathname === '/projects/create') {
      if (userRole !== $Enums.Role.SUPER_ADMIN) {
        try {
          const ownedCount = await prisma.project.count({
            where: { ownerId: userId },
          });

          if (ownedCount >= 3) {
            if (isDev) {
              console.log(`↳ [Middleware] Лимит проектов достигнут (${ownedCount}/3)`);
            }
            const url = new URL('/projects', request.url);
            url.searchParams.set('error', 'project_limit_reached');
            return NextResponse.redirect(url);
          }
        } catch (error) {
          console.error('💥 [Middleware] Ошибка проверки лимита:', error);
        }
      }
    }

    return response;
  }

  // ============================================
  // 📊 7. Дашборд и задачи
  // ============================================
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/tasks')) {
    const projectId = request.nextUrl.searchParams.get('projectId');

    if (!projectId) {
      if (isDev) {
        console.log(`↳ [Middleware] Нет projectId — редирект на /projects`);
      }
      return NextResponse.redirect(new URL('/projects', request.url));
    }

    if (userRole !== $Enums.Role.SUPER_ADMIN) {
      const hasAccess = await prisma.projectMembership.findFirst({
        where: { userId, projectId },
      });

      if (!hasAccess) {
        if (isDev) {
          console.log(`↳ [Middleware] Нет доступа к проекту ${projectId}`);
        }
        return NextResponse.redirect(new URL('/projects', request.url));
      }
    }

    return response;
  }

  // ============================================
  // 👑 8. Админка
  // ============================================
  if (pathname.startsWith('/admin')) {
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return response;
  }

  // ============================================
  // ✅ 10. Всё остальное
  // ============================================
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
