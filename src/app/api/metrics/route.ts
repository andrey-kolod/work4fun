// src/app/api/metrics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getMetrics } from '@/lib/metrics';
import { log } from '@/lib/logger';

const isDev = process.env.NODE_ENV === 'development';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const expectedToken = process.env.METRICS_PROMETHEUS_TOKEN;

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    log.warn('[Metrics API] Unauthorized access attempt detected', {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      requestedUrl: request.url,
    });
    return NextResponse.json(
      { error: 'Unauthorized - invalid or missing Bearer token' },
      { status: 401 }
    );
  }

  try {
    let metricsText = await getMetrics();
    metricsText = metricsText.trim() + '\n';

    if (isDev) {
      const testMatch = metricsText.match(/app_test_counter (\d+)/);
      const testValue = testMatch ? testMatch[1] : 'not found';

      log.debug('[Metrics API] Preparing to send metrics to Prometheus', {
        metricsLengthBytes: metricsText.length,
        testCounterValue: testValue,
        firstFewChars: metricsText.substring(0, 100) + '...',
      });

      return new NextResponse(metricsText, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
    }
  } catch (error: any) {
    log.error('[Metrics API] Failed to generate metrics', {
      errorMessage: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString(),
    });

    return new NextResponse('# ERROR generating metrics\n', { status: 500 });
  }
}
