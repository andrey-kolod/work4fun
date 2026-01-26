// src/proxy.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { $Enums } from '@prisma/client';
import {
  incTestCounter,
  startHttpRequestTimer,
  observeHttpRequest,
  trackUserActivity,
  anonymizeUserId,
} from '@/lib/metrics';
import { log } from '@/lib/logger';

function getHeadersSize(headers: Headers): number {
  try {
    if ('size' in headers) {
      return (headers as any).size || 0;
    }

    let count = 0;

    for (const _ of headers.entries()) {
      count++;
    }
    return count;
  } catch {
    return 0;
  }
}

export async function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';
  const { pathname } = request.nextUrl;
  const { method } = request;

  log.error('[PROXY] 1 Test error');
  const shouldCollectMetrics = process.env.ENABLE_METRICS === 'true';

  const endTimer = shouldCollectMetrics ? startHttpRequestTimer(method, pathname) : () => {};

  const startTime = Date.now();
  let statusCode = 200;
  let response: NextResponse | null = null;

  let accessType = 'unknown';
  let authStatus = 'anonymous';
  let userRole = 'none';
  let isPublicPathFlag = false;

  let token: any = null;

  try {
    if (shouldCollectMetrics) {
      incTestCounter();
    }
    log.error('[PROXY] 2 Test error');
    log.info(`[PROXY] Request: ${method} ${pathname}`, {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      ua: request.headers.get('user-agent')?.substring(0, 100) || 'unknown',
      pathname,
      method,
    });

    if (isDev) {
      log.debug('[PROXY] Request headers', {
        url: request.url,
        headersCount: getHeadersSize(request.headers),
      });
    }

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

    const isPublicPath = publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    isPublicPathFlag = isPublicPath;

    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (shouldCollectMetrics && token?.sub) {
      trackUserActivity(token.sub as string);
    }

    if (isPublicPath) {
      authStatus = token ? 'authenticated' : 'anonymous';
      userRole = (token?.role as string) || 'none';

      if (token && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
        log.info('[PROXY] Authenticated user → redirect /projects', {
          userId: anonymizeUserId(token.sub),
          pathname,
        });

        statusCode = 302;
        response = NextResponse.redirect(new URL('/projects', request.url));
        accessType = 'authenticated_redirect';
      }

      if (isDev && !response) {
        log.debug('[PROXY] Public path → missing token', {
          pathname,
          hasToken: !!token,
        });
      }
    } else {
      if (!token || !token.sub) {
        log.warn('[PROXY] Unauthenticated user → redirect /login', {
          pathname,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
        });

        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', encodeURIComponent(pathname));

        statusCode = 302;
        response = NextResponse.redirect(loginUrl);
        accessType = 'unauthenticated_redirect';
        authStatus = 'anonymous';
      } else {
        const userId = token.sub as string;
        const role = token.role as $Enums.Role;

        authStatus = 'authenticated';
        userRole = role;

        if (isDev) {
          log.debug('[PROXY] Authenticated user', {
            userId: anonymizeUserId(userId),
            role: role,
            pathname,
          });
        }
      }
    }

    if (response) {
      const durationMs = Date.now() - startTime;

      if (shouldCollectMetrics) {
        endTimer();
        observeHttpRequest(method, pathname, statusCode, durationMs / 1000);
      }

      log.info('[PROXY] Request aborted', {
        method,
        pathname,
        status: statusCode,
        durationMs,
        accessType,
        authStatus,
        userRole,
        isPublicPath: isPublicPathFlag,
      });

      return response;
    }

    response = NextResponse.next();

    if (token?.maxAge) {
      const sessionCookie = request.cookies.get('next-auth.session-token');
      if (sessionCookie) {
        response.cookies.set('next-auth.session-token', sessionCookie.value, {
          maxAge: Number(token.maxAge),
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
        });

        if (isDev) {
          const hours = Math.round(Number(token.maxAge) / 3600);
          log.debug('[PROXY] Session cookie refreshed', {
            hours,
            rememberMe: !!token.rememberMe,
          });
        }
      }
    }

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
          "style-src 'self'",
          "img-src 'self' data: blob:",
          "font-src 'self'",
          "connect-src 'self' https://www.google.com https://www.gstatic.com",
          "frame-src 'self' https://www.gstatic.com https://www.google.com",
          "frame-ancestors 'self'",
        ];

    response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

    if (isDev) {
      log.debug('[PROXY] Установлен CSP заголовок', {
        directivesCount: cspDirectives.length,
        hasUnsafeEval: cspDirectives.some((d) => d.includes('unsafe-eval')),
      });
    }

    if (pathname === '/') {
      log.info('[PROXY] Request / → redirect /projects');
      statusCode = 302;
      response = NextResponse.redirect(new URL('/projects', request.url));
      accessType = 'home_redirect';
    } else if (pathname.startsWith('/projects')) {
      if (isDev) log.debug('[PROXY] Project access allowed');
      response.headers.set('X-Proxy-Status', 'projects-allowed');
      accessType = 'projects';
    } else if (pathname.startsWith('/dashboard') || pathname.startsWith('/tasks')) {
      const projectId = request.nextUrl.searchParams.get('projectId');
      if (!projectId) {
        log.warn('[PROXY] Redirecting: projectId not found for dashboard/tasks', {
          pathname,
          userId: anonymizeUserId(token?.sub),
        });

        statusCode = 302;
        response = NextResponse.redirect(new URL('/projects', request.url));
        accessType = 'missing_project_id';
      } else {
        if (isDev)
          log.debug('[PROXY] projectId found → Access allowed', {
            projectId: projectId.substring(0, 8) + '...',
          });
        response.headers.set('X-Proxy-Status', 'tasks-allowed');
        accessType = 'tasks_with_project';
      }
    } else if (pathname.startsWith('/admin')) {
      const adminToken = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });
      const role = adminToken?.role as $Enums.Role;

      if (role !== $Enums.Role.SUPER_ADMIN) {
        log.warn('[PROXY] Admin access denied: SUPER_ADMIN role required', {
          userId: anonymizeUserId(adminToken?.sub),
          role,
          pathname,
        });

        statusCode = 302;
        response = NextResponse.redirect(new URL('/projects', request.url));
        accessType = 'admin_denied';
      } else {
        if (isDev) log.debug('Admin authorized: SUPER_ADMIN role required');
        response.headers.set('X-Proxy-Status', 'admin-allowed');
        accessType = 'admin_allowed';
      }
    } else if (pathname.startsWith('/api/admin')) {
      const adminToken = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (adminToken?.role !== $Enums.Role.SUPER_ADMIN) {
        log.warn('[PROXY] Forbidden admin API access', {
          userId: anonymizeUserId(adminToken?.sub),
          pathname,
        });

        statusCode = 403;
        response = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        accessType = 'api_admin_denied';
      } else {
        accessType = 'api_admin_allowed';
      }
    } else {
      if (isDev) log.debug('[PROXY] Unknown protected route → final check passed');
      response.headers.set('X-Proxy-Status', 'final-pass');
      accessType = 'other_protected';
    }

    const durationMs = Date.now() - startTime;

    if (shouldCollectMetrics) {
      endTimer();
      observeHttpRequest(method, pathname, statusCode, durationMs / 1000);
    }

    log.info('[PROXY] Request finished', {
      method,
      pathname,
      status: statusCode,
      durationMs,
      userId: anonymizeUserId(token?.sub),
      accessType,
      authStatus,
      userRole,
      isPublicPath: isPublicPathFlag,
    });

    if (isDev && !pathname.includes('/api/metrics')) {
      const performanceLevel =
        durationMs < 100
          ? 'fast'
          : durationMs < 500
            ? 'normal'
            : durationMs < 1000
              ? 'slow'
              : 'very_slow';

      log.debug(`[PROXY] Request: ${method} ${pathname}: ${durationMs}ms (${performanceLevel})`, {
        performanceLevel,
        durationMs,
      });
    }

    return response!;
  } catch (err: any) {
    statusCode = 500;
    const errorDurationMs = Date.now() - startTime;

    log.error('[PROXY] Critical error in proxy', {
      error: err.message,
      stack: isDev ? err.stack?.split('\n')[0] : undefined,
      method,
      pathname,
      durationMs: errorDurationMs,
      userId: anonymizeUserId(token?.sub),
      timestamp: new Date().toISOString(),
    });

    if (shouldCollectMetrics) {
      endTimer();
      observeHttpRequest(method, pathname, statusCode, errorDurationMs / 1000);
    }

    const errorMessage = isDev ? `Internal Server Error: ${err.message}` : 'Internal Server Error';

    return NextResponse.json(
      {
        error: errorMessage,
        requestId: `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      },
      {
        status: 500,
        headers: {
          'X-Error-Type': 'proxy_middleware_failure',
        },
      }
    );
  } finally {
    if (shouldCollectMetrics) {
      try {
        endTimer();
      } catch (timerErr) {
        const errorMessage = timerErr instanceof Error ? timerErr.message : String(timerErr);

        log.warn('[PROXY] Error stopping metrics timer', {
          error: errorMessage,
          pathname,
        });
      }
    }
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/metrics).*)'],
};
