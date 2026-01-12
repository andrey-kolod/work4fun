// /src/app/api/metrics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getMetrics } from '@/lib/metrics';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // ТОЛЬКО Bearer токен (для Prometheus)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.METRICS_PROMETHEUS_TOKEN;

    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    if (!expectedToken) {
      logger.error('METRICS_PROMETHEUS_TOKEN не настроен в .env');
      return NextResponse.json({ error: 'Metrics not configured' }, { status: 500 });
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      logger.warn(
        { ip, userAgent: request.headers.get('user-agent') || 'unknown' },
        '⛔️ Неавторизованный запрос к метрикам'
      );

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="Metrics"' } }
      );
    }

    logger.debug('✅ Авторизованный запрос метрик');
    const metrics = await getMetrics();

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    logger.error(error, '❌ Ошибка при сборе метрик');
    return NextResponse.json({ error: 'Failed to collect metrics' }, { status: 500 });
  }
}
