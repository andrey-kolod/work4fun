// src/lib/prisma.ts

import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

// Расширяем глобальный тип для хранения Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Создаём экземпляр Prisma Client с улучшенной конфигурацией для продакшена
const createPrismaClient = () => {
  const prisma = new PrismaClient({
    // Логирование только в development
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],

    // Оптимизации для продакшена
    ...(process.env.NODE_ENV === 'production' && {
      // Более агрессивное отключение соединений для уменьшения нагрузки
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    }),
  });

  // Middleware для логирования длинных запросов
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();

    const duration = after - before;
    if (duration > 2000 && process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ [Prisma Slow Query] ${params.model}.${params.action} took ${duration}ms`);
    }

    return result;
  });

  return prisma;
};

// Singleton паттерн для Prisma Client
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// В development сохраняем в global для горячей перезагрузки
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Экспортируем типы для использования в приложении
export type { Prisma };
