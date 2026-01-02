// src/lib/prisma-raw.ts
// [НОВЫЙ ФАЙЛ] Чистый PrismaClient без расширений
// Назначение:
//   • NextAuth PrismaAdapter требует стандартный PrismaClient (без $extends)
//   • Текущий prisma в src/lib/prisma.ts расширен (с логированием медленных запросов)
//   • Расширенный клиент имеет тип DynamicClientExtensionThis — это вызывает ошибку типизации в PrismaAdapter
//   • Этот файл экспортирует "сырой" PrismaClient для использования только в NextAuth
// Где используется:
//   • Только в src/lib/auth.ts (в PrismaAdapter(prismaRaw))
//   • Везде остальном в проекте продолжай использовать расширенный prisma из '@/lib/prisma'
// Почему так лучше (лучшая практика):
//   • Не меняем основной prisma — сохраняем логирование медленных запросов
//   • NextAuth получает то, что ожидает — нет ошибок типизации
//   • Чистое разделение: расширенный клиент для приложения, чистый для адаптера

import { PrismaClient } from '@prisma/client';

const globalForPrismaRaw = globalThis as unknown as {
  prismaRaw: PrismaClient | undefined;
};

// Создаём обычный PrismaClient без расширений
const createPrismaRaw = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // В продакшене используем DATABASE_URL из env
    ...(process.env.NODE_ENV === 'production' && {
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    }),
  });
};

export const prismaRaw = globalForPrismaRaw.prismaRaw ?? createPrismaRaw();

if (process.env.NODE_ENV !== 'production') {
  globalForPrismaRaw.prismaRaw = prismaRaw;
}
