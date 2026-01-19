// src/proxy.ts - 🔥 ИСПРАВЛЕН: типизация для cookie + Number()
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { $Enums } from '@prisma/client';
import { incTestCounter, incHttpRequest } from '@/lib/metrics';
import { log } from '@/lib/logger';

export async function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';
  const { pathname } = request.nextUrl;
  const startTime = Date.now();
  let statusCode = 200;

  // LOGGER
  log.debug('Proxy test logs', {
    userId: 123,
    projectId: 456,
    projectName: 'New Project',
  });
  log.info('Proxy test logs', {
    userId: 123,
    projectId: 456,
    projectName: 'New Project',
  });
  log.warn('Proxy test logs', {
    userId: 123,
    projectId: 456,
    projectName: 'New Project',
  });
  log.error('Proxy test logs', {
    userId: 123,
    projectId: 456,
    projectName: 'New Project',
  });
  log.fatal('Proxy test logs', {
    userId: 123,
    amount: 1000,
    transactionId: 'txn_123',
    location: 'src/proxy.ts:45',
  });
  // LOGGER

  console.log(`🔍 [Proxy] ${request.method} ${pathname} → начало обработки`);

  try {
    // Метрики — первыми, всегда
    await incTestCounter();

    // Безопасный endpoint для Prometheus
    let safeEndpoint =
      pathname
        .replace(/^\/+/, '')
        .replace(/\/+/g, '__')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/^_+|_+$/g, '') || 'root';

    if (safeEndpoint.length > 100) {
      safeEndpoint = safeEndpoint.substring(0, 97) + '___';
    }

    await incHttpRequest(request.method, safeEndpoint);

    if (isDev) {
      console.log(`📈 [Proxy] Метрика добавлена → ${request.method}_${safeEndpoint}`);
    }

    const response = NextResponse.next();

    // 🔥 ИСПРАВЛЕНО: обновляем cookie срок жизни при каждом запросе (с типизацией)
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (token?.maxAge) {
      const sessionCookie = request.cookies.get('next-auth.session-token');
      if (sessionCookie) {
        // ✅ Number() + as number решает TS ошибку
        response.cookies.set('next-auth.session-token', sessionCookie.value, {
          maxAge: Number(token.maxAge) as number, // 🔥 ФИКС: явное приведение
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
        });

        if (isDev) {
          const hours = Math.round(Number(token.maxAge) / 3600); // 🔥 ФИКС: арифметика
          console.log(`🔧 [Proxy] Cookie обновлён → ${hours}ч (rememberMe: ${token.rememberMe})`);
        }
      }
    }

    // CSP — без изменений
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
      console.log('🔒 [Proxy] CSP применён');
    }
    response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

    // Публичные пути — без изменений
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
      '/api/metrics',
    ];

    const isPublicPath = publicPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

    if (isPublicPath) {
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

      if (token && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
        if (isDev) {
          console.log('↳ [Proxy] Авторизован на публичной → редирект /projects');
        }
        statusCode = 302;
        return NextResponse.redirect(new URL('/projects', request.url));
      }

      if (isDev) {
        console.log(`↳ [Proxy] Публичный путь ${pathname} → пропуск`);
      }

      response.headers.set('X-Proxy-Status', 'public-pass');
      return response;
    }

    // Проверка токена — без изменений (переименован для избежания конфликта)
    const authToken = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!authToken || !authToken.sub) {
      if (isDev) {
        console.log('↳ [Proxy] Нет токена → редирект /login');
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', encodeURIComponent(pathname));
      statusCode = 302;
      return NextResponse.redirect(loginUrl);
    }

    const userId = authToken.sub as string;
    const userRole = authToken.role as $Enums.Role;

    if (isDev) {
      console.log(`↳ [Proxy] Авторизован → ID: ${userId}, роль: ${userRole}`);
    }

    // Корень — без изменений
    if (pathname === '/') {
      if (isDev) {
        console.log('↳ [Proxy] / → редирект /projects');
      }
      statusCode = 302;
      return NextResponse.redirect(new URL('/projects', request.url));
    }

    // Проекты — без изменений
    if (pathname.startsWith('/projects')) {
      if (isDev) {
        console.log('↳ [Proxy] /projects* → разрешено');
      }
      if (pathname === '/projects/create') {
        if (isDev) {
          console.log(`✅ [Proxy] Создание проекта → разрешено для ${userRole}`);
        }
      }
      response.headers.set('X-Proxy-Status', 'projects-allowed');
      return response;
    }

    // Дашборд и задачи — без изменений
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/tasks')) {
      const projectId = request.nextUrl.searchParams.get('projectId');
      if (!projectId) {
        if (isDev) {
          console.log('↳ [Proxy] Нет projectId → редирект /projects');
        }
        statusCode = 302;
        return NextResponse.redirect(new URL('/projects', request.url));
      }
      if (isDev) {
        console.log(`↳ [Proxy] projectId=${projectId} → разрешено`);
      }
      response.headers.set('X-Proxy-Status', 'tasks-allowed');
      return response;
    }

    // Админка — без изменений
    if (pathname.startsWith('/admin')) {
      if (pathname === '/admin/projects/create' && userRole !== $Enums.Role.SUPER_ADMIN) {
        if (isDev) {
          console.log(`❌ [Proxy] /admin/projects/create запрещено для ${userRole}`);
        }
        statusCode = 302;
        return NextResponse.redirect(new URL('/projects/create', request.url));
      }

      if (userRole !== $Enums.Role.SUPER_ADMIN) {
        if (isDev) {
          console.log(`❌ [Proxy] /admin запрещено (роль ${userRole})`);
        }
        statusCode = 302;
        return NextResponse.redirect(new URL('/projects', request.url));
      }

      response.headers.set('X-Proxy-Status', 'admin-allowed');
      return response;
    }

    // API админки — без изменений
    if (pathname.startsWith('/api/admin')) {
      if (userRole !== $Enums.Role.SUPER_ADMIN) {
        if (isDev) {
          console.log(`❌ [Proxy] /api/admin запрещено (роль ${userRole})`);
        }
        statusCode = 403;
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return response;
    }

    // API проектов POST — без изменений
    if (pathname.startsWith('/api/projects') && request.method === 'POST') {
      if (isDev) {
        console.log(`↳ [Proxy] /api/projects POST → разрешено`);
      }
      return response;
    }

    // Всё остальное — разрешено
    if (isDev) {
      console.log(`✅ [Proxy] ${pathname} → финальный пропуск`);
    }

    response.headers.set('X-Proxy-Status', 'final-pass');

    const duration = Date.now() - startTime;
    if (isDev && !pathname.includes('/api/metrics')) {
      console.log(
        `📊 [Proxy] ${request.method} ${pathname} → ${duration}ms (status ${statusCode})`
      );
    }

    return response;
  } catch (error: any) {
    console.error('❌ [Proxy] Ошибка:', error);
    statusCode = 500;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/metrics).*)'],
};
