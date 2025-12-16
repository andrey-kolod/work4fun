// ============================================================================
// ФАЙЛ: prisma/seed.ts (МИНИМАЛЬНАЯ ВЕРСИЯ ДЛЯ ТЕСТА)
// ============================================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Создаём тестовых пользователей...');

  // Супер-админ
  await prisma.user.upsert({
    // upsert — создаст если нет, обновит если есть
    where: { email: 'superadmin@workflow.com' },
    update: {},
    create: {
      email: 'superadmin@workflow.com',
      passwordHash: await bcrypt.hash('demo123', 12),
      firstName: 'Андрей',
      lastName: 'СуперАдмин',
      role: 'SUPER_ADMIN',
      emailVerified: true, // Чтобы сразу можно было войти
    },
  });

  // Обычный пользователь
  await prisma.user.upsert({
    where: { email: 'user@workflow.com' },
    update: {},
    create: {
      email: 'user@workflow.com',
      passwordHash: await bcrypt.hash('demo123', 12),
      firstName: 'Тестовый',
      lastName: 'Пользователь',
      role: 'PROJECT_MEMBER',
      emailVerified: true,
    },
  });

  console.log('✅ Пользователи созданы!');
  console.log('Войди как:');
  console.log('superadmin@workflow.com / demo123');
  console.log('user@workflow.com / demo123');
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
