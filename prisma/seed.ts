// ============================================================================
// ФАЙЛ: prisma/seed.ts (СУПЕРАДМИН + ПРОЕКТ + АВАТАРКИ)
// ============================================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Создаём тестовых пользователей и проекты...');

  // 1. Супер-админ С АВАТАРКОЙ
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@w4f.com' },
    update: {},
    create: {
      email: 'superadmin@w4f.com',
      passwordHash: await bcrypt.hash('demo123', 12),
      firstName: 'Андрей',
      lastName: 'СуперАдмин',
      role: 'SUPER_ADMIN',
      emailVerified: true,
      avatar: '/avatars/superadmin.svg',
    },
  });
  console.log('✅ Супер-админ:', superAdmin.email);

  // 2. Обычный пользователь С АВАТАРКОЙ
  await prisma.user.upsert({
    where: { email: 'user@w4f.com' },
    update: {},
    create: {
      email: 'user@w4f.com',
      passwordHash: await bcrypt.hash('demo123', 12),
      firstName: 'Тестовый',
      lastName: 'Пользователь',
      role: 'PROJECT_MEMBER',
      emailVerified: true,
      avatar: '/avatars/user.svg',
    },
  });

  // 3. ПРОЕКТ для суперадмина (ownerId = superAdmin.id)
  const superAdminProject = await prisma.project.upsert({
    where: { id: 'superadmin-project-1' }, // фиксированный ID для upsert
    update: {},
    create: {
      id: 'superadmin-project-1', // фиксированный ID
      name: 'Тестовый проект суперадмина',
      description: 'Первый проект для тестирования всех фич',
      status: 'ACTIVE',
      ownerId: superAdmin.id, // владелец — суперадмин
    },
  });
  console.log('✅ Проект суперадмина:', superAdminProject.name);

  // 4. Связываем суперадмина с проектом (через UserProject)
  await prisma.userProject.upsert({
    where: {
      userId_projectId: {
        userId: superAdmin.id,
        projectId: superAdminProject.id,
      },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      projectId: superAdminProject.id,
    },
  });

  console.log('✅ Всё готово!');
  console.log('👑 superadmin@workflow.com / demo123');
  console.log('  → Проект:', superAdminProject.name);
  console.log('  → Аватар: /avatars/superadmin.jpg');
  console.log('');
  console.log('👤 user@workflow.com / demo123');
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
