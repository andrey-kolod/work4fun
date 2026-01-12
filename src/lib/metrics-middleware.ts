// src/lib/metrics-middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { httpRequestCounter, httpRequestDuration, errorCounter } from './metrics';
import { logger } from './logger';

export async function metricsMiddleware(request: NextRequest, next: () => Promise<NextResponse>) {
  const startTime = Date.now();
  let response: NextResponse;
  let statusCode = 200;

  try {
    response = await next();

    if (response.status) {
      statusCode = response.status;
    }
  } catch (error: any) {
    logger.error(error, '❌ Ошибка в запросе');
    errorCounter.inc({ type: 'REQUEST_ERROR', route: request.nextUrl.pathname });

    throw error;
  } finally {
    const duration = Date.now() - startTime;
    const pathname = request.nextUrl.pathname;

    if (!pathname.includes('/api/metrics')) {
      httpRequestCounter.inc({
        method: request.method,
        route: pathname,
        status_code: statusCode.toString(),
      });

      httpRequestDuration.observe(
        {
          method: request.method,
          route: pathname,
          status_code: statusCode.toString(),
        },
        duration
      );
    }
  }

  return response;
}
