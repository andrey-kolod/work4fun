// prisma/seed.ts

import { prisma } from '../src/lib/prisma';
import { hash } from 'bcryptjs';
import { Role, ProjectRole } from '@prisma/client';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

async function makeSlugUnique(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const exists = await prisma.project.findFirst({ where: { slug } });
    if (!exists) return slug;
    slug = `${baseSlug}-${counter++}`;
  }
}

async function main() {
  console.log('🌱 Запуск сида с полным набором тестовых пользователей...');

  // Пароль для всех — demo123
  const passwordHash = await hash('demo123', 12);

  // === ПОЛЬЗОВАТЕЛИ ===
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@w4f.com' },
    update: {},
    create: {
      email: 'superadmin@w4f.com',
      firstName: 'Сергей',
      lastName: 'Админов',
      passwordHash,
      role: Role.SUPER_ADMIN,
      emailVerified: true,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=superadmin',
    },
  });

  const ownerOne = await prisma.user.upsert({
    where: { email: 'owner-one@w4f.com' },
    update: {},
    create: {
      email: 'owner-one@w4f.com',
      firstName: 'Андрей',
      lastName: 'Петров',
      passwordHash,
      role: Role.USER,
      emailVerified: true,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=andrey',
    },
  });

  const ownerThree = await prisma.user.upsert({
    where: { email: 'owner-three@w4f.com' },
    update: {},
    create: {
      email: 'owner-three@w4f.com',
      firstName: 'Мария',
      lastName: 'Сидорова',
      passwordHash,
      role: Role.USER,
      emailVerified: true,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
    },
  });

  const ownerZero = await prisma.user.upsert({
    where: { email: 'owner-zero@w4f.com' },
    update: {},
    create: {
      email: 'owner-zero@w4f.com',
      firstName: 'Дмитрий',
      lastName: 'Кузнецов',
      passwordHash,
      role: Role.USER,
      emailVerified: true,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dmitry',
    },
  });

  const memberZero = await prisma.user.upsert({
    where: { email: 'member-zero@w4f.com' },
    update: {},
    create: {
      email: 'member-zero@w4f.com',
      firstName: 'Ольга',
      lastName: 'Новикова',
      passwordHash,
      role: Role.USER,
      emailVerified: true,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=olga',
    },
  });

  const memberOne = await prisma.user.upsert({
    where: { email: 'member-one@w4f.com' },
    update: {},
    create: {
      email: 'member-one@w4f.com',
      firstName: 'Иван',
      lastName: 'Морозов',
      passwordHash,
      role: Role.USER,
      emailVerified: true,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ivan',
    },
  });

  const memberThree = await prisma.user.upsert({
    where: { email: 'member-three@w4f.com' },
    update: {},
    create: {
      email: 'member-three@w4f.com',
      firstName: 'Екатерина',
      lastName: 'Волкова',
      passwordHash,
      role: Role.USER,
      emailVerified: true,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ekaterina',
    },
  });

  // NextAuth Account для всех
  const allUsers = [
    superAdmin,
    ownerOne,
    ownerThree,
    ownerZero,
    memberZero,
    memberOne,
    memberThree,
  ];
  for (const user of allUsers) {
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: { provider: 'credentials', providerAccountId: user.id },
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
  const projAndrey = await prisma.project.upsert({
    where: { id: 'proj-andrey' },
    update: {},
    create: {
      id: 'proj-andrey',
      name: 'Интернет-магазин Андрея',
      description: 'Основной проект с группами продаж',
      ownerId: ownerOne.id,
      status: 'ACTIVE',
    },
  });

  const projMaria1 = await prisma.project.upsert({
    where: { id: 'proj-maria-1' },
    update: {},
    create: {
      id: 'proj-maria-1',
      name: 'CRM Марии',
      ownerId: ownerThree.id,
      status: 'ACTIVE',
    },
  });

  const projMaria2 = await prisma.project.upsert({
    where: { id: 'proj-maria-2' },
    update: {},
    create: {
      id: 'proj-maria-2',
      name: 'ERP Марии',
      ownerId: ownerThree.id,
      status: 'ACTIVE',
    },
  });

  const projMaria3 = await prisma.project.upsert({
    where: { id: 'proj-maria-3' },
    update: {},
    create: {
      id: 'proj-maria-3',
      name: 'Дашборд Марии',
      ownerId: ownerThree.id,
      status: 'ACTIVE',
    },
  });

  // === РОЛИ В ПРОЕКТАХ ===
  await prisma.projectMembership.createMany({
    data: [
      // Владельцы
      { userId: ownerOne.id, projectId: projAndrey.id, role: ProjectRole.PROJECT_OWNER },
      { userId: ownerThree.id, projectId: projMaria1.id, role: ProjectRole.PROJECT_OWNER },
      { userId: ownerThree.id, projectId: projMaria2.id, role: ProjectRole.PROJECT_OWNER },
      { userId: ownerThree.id, projectId: projMaria3.id, role: ProjectRole.PROJECT_OWNER },

      // Участники
      { userId: memberOne.id, projectId: projAndrey.id, role: ProjectRole.PROJECT_MEMBER },
      { userId: memberThree.id, projectId: projAndrey.id, role: ProjectRole.PROJECT_MEMBER },
      { userId: memberThree.id, projectId: projMaria1.id, role: ProjectRole.PROJECT_MEMBER },
      { userId: memberThree.id, projectId: projMaria2.id, role: ProjectRole.PROJECT_MEMBER },
    ],
    skipDuplicates: true,
  });

  // === ГРУППЫ в проекте Андрея ===
  const groups = await prisma.group.createMany({
    data: [
      { id: 'group-common', name: 'Общие', projectId: projAndrey.id },
      { id: 'group-shop', name: 'Собственный магазин', projectId: projAndrey.id },
      { id: 'group-wb', name: 'Wildberries', projectId: projAndrey.id },
      { id: 'group-ozon', name: 'Ozon', projectId: projAndrey.id },
    ],
    skipDuplicates: true,
  });

  const groupList = await prisma.group.findMany({ where: { projectId: projAndrey.id } });

  // === ЗАДАЧИ в проекте Андрея ===
  await prisma.task.createMany({
    data: [
      {
        title: 'Настроить Яндекс.Метрику',
        projectId: projAndrey.id,
        groupId: groupList.find((g) => g.name === 'Общие')?.id,
        assignerId: ownerOne.id,
      },
      {
        title: 'Обновить баннеры на сайте',
        projectId: projAndrey.id,
        groupId: groupList.find((g) => g.name === 'Собственный магазин')?.id,
        assignerId: ownerOne.id,
        assigneeId: memberOne.id,
      },
      {
        title: 'Загрузить новые товары на WB',
        projectId: projAndrey.id,
        groupId: groupList.find((g) => g.name === 'Wildberries')?.id,
        assignerId: ownerOne.id,
        assigneeId: memberThree.id,
      },
      {
        title: 'Обработать отзывы на Ozon',
        projectId: projAndrey.id,
        groupId: groupList.find((g) => g.name === 'Ozon')?.id,
        assignerId: ownerOne.id,
      },
    ],
    skipDuplicates: true,
  });

  // === ЗАПОЛНЕНИЕ SLUG ДЛЯ СУЩЕСТВУЮЩИХ ПРОЕКТОВ ===
  console.log('🔗 Заполняем slug для существующих проектов...');
  const allProjects = await prisma.project.findMany({
    select: { id: true, name: true, slug: true },
  });

  for (const project of allProjects) {
    if (!project.slug) {
      let slug = generateSlug(project.name);
      slug = await makeSlugUnique(slug);

      await prisma.project.update({
        where: { id: project.id },
        data: { slug },
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Slug для проекта "${project.name}" установлен: ${slug}`);
      }
    }
  }

  console.log('🎉 Демо-данные успешно созданы!');
  console.log('🔑 Пароль для всех: demo123');
  console.log('');
  console.log('👑 superadmin@w4f.com — Супер-админ');
  console.log('👨 owner-one@w4f.com — Владелец 1 проекта');
  console.log('👩 owner-three@w4f.com — Владелец 3 проектов (лимит)');
  console.log('👨 owner-zero@w4f.com — Может создать проект (0/3)');
  console.log('👤 member-zero@w4f.com — Без проектов');
  console.log('👤 member-one@w4f.com — Участник в 1 проекте');
  console.log('👥 member-three@w4f.com — Участник в 3 проектах');
}

main()
  .catch((e) => {
    console.error('💥 Ошибка сида:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
