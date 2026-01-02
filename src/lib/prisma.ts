// src/lib/prisma.ts

import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

const createPrismaClient = () => {
  const basePrisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],

    ...(process.env.NODE_ENV === 'production' && {
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    }),
  });

  const prisma = basePrisma.$extends({
    query: {
      async $allOperations({ operation, model, args, query }) {
        const before = Date.now();
        const result = await query(args);
        const after = Date.now();

        const duration = after - before;

        if (duration > 2000 && process.env.NODE_ENV === 'development') {
          console.warn(
            `⚠️ [Prisma Slow Query] ${model ? `${model}.` : ''}${operation} took ${duration}ms`
          );
        }

        return result;
      },
    },
  });

  return prisma;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export type { Prisma };
