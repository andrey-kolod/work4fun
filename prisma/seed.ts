/**
 * ФАЙЛ: prisma/seed.ts
 * ✅ АВАТАРЫ: добавлены SVG аватары для всех пользователей
 */

import { prisma } from '../src/lib/prisma';
import { hash } from 'bcryptjs';

async function main() {
  console.log('🌱 Seed: создание тестовых данных с аватарами...');

  // 1. Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@w4f.com' },
    update: {},
    create: {
      email: 'superadmin@w4f.com',
      firstName: 'Супер',
      lastName: 'Админ',
      passwordHash: await hash('demo123', 12),
      role: 'SUPER_ADMIN',
      emailVerified: true,
      avatar:
        'https://img.freepik.com/premium-photo/confident-nerd-portrait-young-nerd-man-bow-tie-adjusting-his-suspenders-smiling-while-standing-against-grey-background_425904-37096.jpg', // ← АВАТАР
    },
  });
  console.log('👑 Super Admin:', superAdmin.email);

  // 2. Project Lead
  const projectLead = await prisma.user.upsert({
    where: { email: 'lead@w4f.com' },
    update: {},
    create: {
      email: 'lead@w4f.com',
      firstName: 'Иван',
      lastName: 'Петров',
      passwordHash: await hash('demo123', 12),
      role: 'PROJECT_LEAD',
      emailVerified: true,
      avatar: '/avatars/user.svg', // ← АВАТАР
    },
  });

  const projectLead2 = await prisma.user.upsert({
    where: { email: 'lead2@w4f.com' },
    update: {},
    create: {
      email: 'lead2@w4f.com',
      firstName: 'Андрей',
      lastName: 'Иванов',
      passwordHash: await hash('demo123', 12),
      role: 'PROJECT_LEAD',
      emailVerified: true,
      avatar: '/avatars/user.svg', // ← АВАТАР
    },
  });

  // 3. Project Member
  const member = await prisma.user.upsert({
    where: { email: 'member@w4f.com' },
    update: {},
    create: {
      email: 'member@w4f.com',
      firstName: 'Анна',
      lastName: 'Сидорова',
      passwordHash: await hash('demo123', 12),
      role: 'PROJECT_MEMBER',
      emailVerified: true,
      avatar: '/avatars/user.svg', // ← АВАТАР
    },
  });

  // 4. Проект 1
  const project1 = await prisma.project.upsert({
    where: { id: 'proj1' },
    update: {},
    create: {
      id: 'proj1',
      name: 'Домашние дела', // ← Твой проект
      description: 'Личные задачи и дела по дому',
      ownerId: superAdmin.id,
      status: 'ACTIVE',
    },
  });

  // 5. Проект 2
  const project2 = await prisma.project.upsert({
    where: { id: 'proj2' },
    update: {},
    create: {
      id: 'proj2',
      name: 'Канбан Доска v1.0',
      description: 'Система управления задачами для команды разработчиков',
      ownerId: projectLead.id,
      status: 'ACTIVE',
    },
  });

  // 6. Связи User ↔ Project
  await prisma.userProject.createMany({
    data: [
      { userId: superAdmin.id, projectId: project1.id, role: 'PROJECT_LEAD' },
      { userId: projectLead.id, projectId: project1.id, role: 'PROJECT_LEAD' },
      { userId: member.id, projectId: project1.id, role: 'PROJECT_MEMBER' },
      { userId: projectLead.id, projectId: project2.id, role: 'PROJECT_LEAD' },
      { userId: member.id, projectId: project2.id, role: 'PROJECT_MEMBER' },
    ],
    skipDuplicates: true,
  });

  // 7. Тестовые задачи для "Домашние дела"
  await prisma.task.createMany({
    data: [
      {
        id: 'task1',
        title: 'Купить продукты',
        description: 'Молоко, хлеб, яйца, овощи на неделю',
        status: 'TODO',
        priority: 'HIGH',
        projectId: project1.id,
        assignerId: superAdmin.id,
        assigneeId: superAdmin.id,
      },
      {
        id: 'task2',
        title: 'Убраться в квартире',
        description: 'Пылесос, мытьё полов, протирка пыли',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        projectId: project1.id,
        assignerId: superAdmin.id,
        assigneeId: member.id,
      },
      {
        id: 'task3',
        title: 'Заплатить коммуналку',
        description: 'Электричество, вода, интернет до 20 числа',
        status: 'TODO',
        priority: 'HIGH',
        projectId: project1.id,
        assignerId: superAdmin.id,
        assigneeId: superAdmin.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log('🎉 Seed завершён!');
  console.log('👤 Пользователи:');
  console.log('   superadmin@w4f.com / demo123');
  console.log('   lead@w4f.com / demo123');
  console.log('   member@w4f.com / demo123');
  console.log('📁 Проекты: Домашние дела, Канбан Доска v1.0');
}

main()
  .catch((e) => {
    console.error('💥 Seed ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
