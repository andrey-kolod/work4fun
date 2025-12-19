// ФАЙЛ: prisma/seed.ts
// Обновлён под твои требования: 5 ключевых пользователей для тестирования ролевой модели

import { prisma } from '../src/lib/prisma';
import { hash } from 'bcryptjs';
import { Role, ProjectRole } from '@prisma/client';

async function main() {
  console.log('🌱 Запуск сида с 5 ключевыми пользователями...');

  // 1. SUPER_ADMIN
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@w4f.com' },
    update: {},
    create: {
      email: 'superadmin@w4f.com',
      firstName: 'Супер',
      lastName: 'Админ',
      passwordHash: await hash('demo123', 12),
      role: Role.SUPER_ADMIN,
      emailVerified: true,
    },
  });

  // 2. Владелец 1 проекта (Андрей)
  const owner1 = await prisma.user.upsert({
    where: { email: 'owner1@w4f.com' },
    update: {},
    create: {
      email: 'owner1@w4f.com',
      firstName: 'Андрей',
      lastName: 'Иванов',
      passwordHash: await hash('demo123', 12),
      role: Role.USER,
      emailVerified: true,
    },
  });

  // 3. Владелец 3 проектов (Мария — на лимите)
  const owner3 = await prisma.user.upsert({
    where: { email: 'owner3@w4f.com' },
    update: {},
    create: {
      email: 'owner3@w4f.com',
      firstName: 'Мария',
      lastName: 'Смирнова',
      passwordHash: await hash('demo123', 12),
      role: Role.USER,
      emailVerified: true,
    },
  });

  // 4. Участник в 3 проектах (Елена)
  const memberIn3 = await prisma.user.upsert({
    where: { email: 'member@w4f.com' },
    update: {},
    create: {
      email: 'member@w4f.com',
      firstName: 'Елена',
      lastName: 'Козлова',
      passwordHash: await hash('demo123', 12),
      role: Role.USER,
      emailVerified: true,
    },
  });

  // 5. Простой пользователь без проектов
  const simpleUser = await prisma.user.upsert({
    where: { email: 'simple-user@w4f.com' },
    update: {},
    create: {
      email: 'simple-user@w4f.com',
      firstName: 'Простой',
      lastName: 'Юзер',
      passwordHash: await hash('demo123', 12),
      role: Role.USER,
      emailVerified: true,
    },
  });

  // Создаём Account для NextAuth (обязательно для входа по credentials)
  const allUsers = [superAdmin, owner1, owner3, memberIn3, simpleUser];
  for (const user of allUsers) {
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'credentials',
          providerAccountId: user.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        type: 'credentials',
        provider: 'credentials',
        providerAccountId: user.id,
      },
    });
  }

  // === ПРОЕКТЫ ===
  // Проект Андрея (с группами для демонстрации)
  const projAndrey = await prisma.project.upsert({
    where: { id: 'proj-andrey' },
    update: {},
    create: {
      id: 'proj-andrey',
      name: '🏪 Интернет-магазин Андрея',
      description: 'Один проект владельца с группами',
      ownerId: owner1.id,
      status: 'ACTIVE',
    },
  });

  // 3 проекта Марии (лимит)
  const projMaria1 = await prisma.project.upsert({
    where: { id: 'proj-maria-1' },
    update: {},
    create: {
      id: 'proj-maria-1',
      name: '💼 CRM Марии',
      ownerId: owner3.id,
      status: 'ACTIVE',
    },
  });

  const projMaria2 = await prisma.project.upsert({
    where: { id: 'proj-maria-2' },
    update: {},
    create: {
      id: 'proj-maria-2',
      name: '⚙️ ERP Марии',
      ownerId: owner3.id,
      status: 'ACTIVE',
    },
  });

  const projMaria3 = await prisma.project.upsert({
    where: { id: 'proj-maria-3' },
    update: {},
    create: {
      id: 'proj-maria-3',
      name: '📊 Dashboard Марии',
      ownerId: owner3.id,
      status: 'ACTIVE',
    },
  });

  // === РОЛИ В ПРОЕКТАХ ===
  await prisma.projectMembership.createMany({
    data: [
      // Владельцы
      { userId: owner1.id, projectId: projAndrey.id, role: ProjectRole.PROJECT_OWNER },
      { userId: owner3.id, projectId: projMaria1.id, role: ProjectRole.PROJECT_OWNER },
      { userId: owner3.id, projectId: projMaria2.id, role: ProjectRole.PROJECT_OWNER },
      { userId: owner3.id, projectId: projMaria3.id, role: ProjectRole.PROJECT_OWNER },

      // Елена — участник в 3 проектах
      { userId: memberIn3.id, projectId: projAndrey.id, role: ProjectRole.PROJECT_MEMBER },
      { userId: memberIn3.id, projectId: projMaria1.id, role: ProjectRole.PROJECT_MEMBER },
      { userId: memberIn3.id, projectId: projMaria2.id, role: ProjectRole.PROJECT_MEMBER },
    ],
    skipDuplicates: true,
  });

  // === ГРУППЫ только в проекте Андрея (для демонстрации разделения) ===
  const groups = await prisma.group.createMany({
    data: [
      { id: 'group-common', name: 'Общие', projectId: projAndrey.id },
      { id: 'group-shop', name: 'Магазин', projectId: projAndrey.id },
      { id: 'group-wb', name: 'Wildberries', projectId: projAndrey.id },
      { id: 'group-ozon', name: 'Ozon', projectId: projAndrey.id },
    ],
    skipDuplicates: true,
  });

  // === ПРИМЕРЫ ЗАДАЧ в проекте Андрея ===
  const groupIds = await prisma.group.findMany({
    where: { projectId: projAndrey.id },
    select: { id: true, name: true },
  });

  const commonGroupId = groupIds.find((g) => g.name === 'Общие')?.id;

  await prisma.task.createMany({
    data: [
      // Общая задача
      {
        title: 'Настроить аналитику',
        projectId: projAndrey.id,
        groupId: commonGroupId,
        assignerId: owner1.id,
      },
      // Задачи по группам
      {
        title: 'Обновить баннеры',
        projectId: projAndrey.id,
        groupId: groupIds.find((g) => g.name === 'Магазин')?.id,
        assignerId: owner1.id,
      },
      {
        title: 'Загрузить товары на WB',
        projectId: projAndrey.id,
        groupId: groupIds.find((g) => g.name === 'Wildberries')?.id,
        assignerId: owner1.id,
      },
      {
        title: 'Ответить на отзывы Ozon',
        projectId: projAndrey.id,
        groupId: groupIds.find((g) => g.name === 'Ozon')?.id,
        assignerId: owner1.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log('🎉 Сид успешно завершён!');
  console.log('Все пароли: demo123');
  console.log('👑 superadmin@w4f.com — Супер-админ');
  console.log('👨‍💼 owner1@w4f.com — Владелец 1 проекта (с группами)');
  console.log('👩‍💼 owner3@w4f.com — Владелец 3 проектов (лимит)');
  console.log('👥 member@w4f.com — Участник в 3 проектах');
  console.log('👤 simple-user@w4f.com — Пользователь без проектов');
}

main()
  .catch((e) => {
    console.error('💥 Ошибка сида:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
