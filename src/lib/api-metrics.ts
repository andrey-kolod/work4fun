// src/lib/api-metrics.ts
import { NextRequest, NextResponse } from 'next/server';
import { prismaQueryCounter, prismaQueryDuration } from './metrics';

// Декоратор для отслеживания Prisma запросов
export function trackPrismaQuery(model: string, operation: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        prismaQueryCounter.inc({ model, operation });
        prismaQueryDuration.observe({ model, operation }, duration);

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        prismaQueryCounter.inc({ model, operation });
        prismaQueryDuration.observe({ model, operation }, duration);
        throw error;
      }
    };

    return descriptor;
  };
}

// Middleware для API маршрутов
export async function apiMetricsMiddleware(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  const startTime = Date.now();
  let response: NextResponse;

  try {
    response = await handler(request);
  } catch (error: any) {
    throw error;
  }

  const duration = Date.now() - startTime;

  // Логирование длительности API вызовов
  console.log(`📊 [API] ${request.method} ${request.nextUrl.pathname} - ${duration}ms`);

  return response;
}
