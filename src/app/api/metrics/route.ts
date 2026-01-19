// src/app/api/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMetrics } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.METRICS_PROMETHEUS_TOKEN || 'prometheus-secret-token-2024';

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    console.warn('[Metrics API] Unauthorized attempt', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let metrics = await getMetrics();

    // Чистим возможные лишние пробелы/переносы
    metrics = metrics.trim() + '\n';

    console.log(
      `[Metrics API] Отдаём Prometheus → длина: ${metrics.length} байт, ` +
        `testCounter: ${metrics.match(/app_test_counter (\d+)/)?.[1] || 'не найден'}`
    );

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (err) {
    console.error('[Metrics API] Ошибка генерации:', err);
    return new NextResponse('# ERROR generating metrics\n', { status: 500 });
  }
}
