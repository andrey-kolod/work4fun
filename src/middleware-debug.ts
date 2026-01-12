// src/middleware-debug.ts (временно для теста)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { httpRequestCounter, httpRequestDuration } from '@/lib/metrics';

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;

  // ПРОСТОЙ РЕСПОНС
  const response = NextResponse.next();

  try {
    // ИНКРЕМЕНТИРУЕМ МЕТРИКИ ДЛЯ ЛЮБОГО ЗАПРОСА
    httpRequestCounter.inc({
      method: request.method,
      route: pathname,
      status_code: '200',
    });

    const duration = Date.now() - startTime;
    httpRequestDuration.observe(
      {
        method: request.method,
        route: pathname,
        status_code: '200',
      },
      duration
    );

    console.log(`✅ DEBUG: Метрика инкрементирована для ${request.method} ${pathname}`);
  } catch (error) {
    console.error('❌ DEBUG: Ошибка инкремента метрики:', error);
  }

  return response;
}

export const config = {
  matcher: ['/api/metrics/debug'],
  runtime: 'nodejs',
};
