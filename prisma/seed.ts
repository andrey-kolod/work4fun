/**
 * ФАЙЛ: prisma/seed.ts
 * ✅ ДЕМО: SUPER_ADMIN + SYSTEM_USER + LEAD_2 + LEAD_3 + MEMBER_3
 */

// npx prisma migrate dev --name demo_data
// npx prisma generate
// npx prisma migrate reset
// npx prisma db seed
// npm run dev

import { prisma } from '../src/lib/prisma';
import { hash } from 'bcryptjs';

async function main() {
  console.log('🌱 Seed: демо данные...');

  // 1. SUPER_ADMIN (видит ВСЕ проекты)
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
        'https://img.freepik.com/premium-photo/confident-nerd-portrait-young-nerd-man-bow-tie-adjusting-his-suspenders-smiling-while-standing-against-grey-background_425904-37096.jpg',
    },
  });

  // 🔥 NextAuth Account
  await prisma.account.upsert({
    where: {
      provider_providerAccountId: { provider: 'credentials', providerAccountId: superAdmin.id },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      type: 'credentials',
      provider: 'credentials',
      providerAccountId: superAdmin.id,
    },
  });

  // 2. SYSTEM_USER (0 проектов → "Создать первый")
  const systemUser = await prisma.user.upsert({
    where: { email: 'system@w4f.com' },
    update: {},
    create: {
      email: 'system@w4f.com',
      firstName: 'Новый',
      lastName: 'Пользователь',
      passwordHash: await hash('demo123', 12),
      role: 'SYSTEM_USER',
      emailVerified: true,
      avatar: '/avatars/user.svg',
    },
  });

  await prisma.account.upsert({
    where: {
      provider_providerAccountId: { provider: 'credentials', providerAccountId: systemUser.id },
    },
    update: {},
    create: {
      userId: systemUser.id,
      type: 'credentials',
      provider: 'credentials',
      providerAccountId: systemUser.id,
    },
  });

  // 3. LEAD_2 (2 своих проекта + 1 участник = всего 3)
  const lead2 = await prisma.user.upsert({
    where: { email: 'lead2@w4f.com' },
    update: {},
    create: {
      email: 'lead2@w4f.com',
      firstName: 'Андрей',
      lastName: 'Иванов',
      passwordHash: await hash('demo123', 12),
      role: 'PROJECT_LEAD',
      emailVerified: true,
      avatar: '/avatars/user.svg',
    },
  });

  await prisma.account.upsert({
    where: { provider_providerAccountId: { provider: 'credentials', providerAccountId: lead2.id } },
    update: {},
    create: {
      userId: lead2.id,
      type: 'credentials',
      provider: 'credentials',
      providerAccountId: lead2.id,
    },
  });

  // 4. LEAD_3 (3 своих проекта + 1 участник = всего 4)
  const lead3 = await prisma.user.upsert({
    where: { email: 'lead3@w4f.com' },
    update: {},
    create: {
      email: 'lead3@w4f.com',
      firstName: 'Мария',
      lastName: 'Смирнова',
      passwordHash: await hash('demo123', 12),
      role: 'PROJECT_LEAD',
      emailVerified: true,
      avatar: '/avatars/user.svg',
    },
  });

  await prisma.account.upsert({
    where: { provider_providerAccountId: { provider: 'credentials', providerAccountId: lead3.id } },
    update: {},
    create: {
      userId: lead3.id,
      type: 'credentials',
      provider: 'credentials',
      providerAccountId: lead3.id,
    },
  });

  // 5. MEMBER_3 (0 своих + 3 участник → лимит)
  const member3 = await prisma.user.upsert({
    where: { email: 'member3@w4f.com' },
    update: {},
    create: {
      email: 'member3@w4f.com',
      firstName: 'Елена',
      lastName: 'Козлова',
      passwordHash: await hash('demo123', 12),
      role: 'PROJECT_MEMBER',
      emailVerified: true,
      avatar: '/avatars/user.svg',
    },
  });

  await prisma.account.upsert({
    where: {
      provider_providerAccountId: { provider: 'credentials', providerAccountId: member3.id },
    },
    update: {},
    create: {
      userId: member3.id,
      type: 'credentials',
      provider: 'credentials',
      providerAccountId: member3.id,
    },
  });

  // 🔥 6. ПРОЕКТЫ (8 штук)
  const projCommon = await prisma.project.upsert({
    where: { id: 'proj-common' },
    update: {},
    create: {
      id: 'proj-common',
      name: '🚀 Командный проект',
      description: 'Общий проект для всех ролей',
      ownerId: superAdmin.id,
      status: 'ACTIVE',
    },
  });

  const projLead2_1 = await prisma.project.upsert({
    where: { id: 'proj-lead2-1' },
    update: {},
    create: {
      id: 'proj-lead2-1',
      name: '🌐 Веб-сайт',
      description: 'Собственный проект Андрея #1 (2/3)',
      ownerId: lead2.id,
      status: 'ACTIVE',
    },
  });

  const projLead2_2 = await prisma.project.upsert({
    where: { id: 'proj-lead2-2' },
    update: {},
    create: {
      id: 'proj-lead2-2',
      name: '📱 Мобильное app',
      description: 'Собственный проект Андрея #2 (2/3)',
      ownerId: lead2.id,
      status: 'ACTIVE',
    },
  });

  const projLead3_1 = await prisma.project.upsert({
    where: { id: 'proj-lead3-1' },
    update: {},
    create: {
      id: 'proj-lead3-1',
      name: '💼 CRM система',
      description: 'Собственный проект Марии #1 (3/3)',
      ownerId: lead3.id,
      status: 'ACTIVE',
    },
  });

  const projLead3_2 = await prisma.project.upsert({
    where: { id: 'proj-lead3-2' },
    update: {},
    create: {
      id: 'proj-lead3-2',
      name: '⚙️ ERP система',
      description: 'Собственный проект Марии #2 (3/3)',
      ownerId: lead3.id,
      status: 'ACTIVE',
    },
  });

  const projLead3_3 = await prisma.project.upsert({
    where: { id: 'proj-lead3-3' },
    update: {},
    create: {
      id: 'proj-lead3-3',
      name: '📊 Dashboard',
      description: 'Собственный проект Марии #3 (ЛИМИТ)',
      ownerId: lead3.id,
      status: 'ACTIVE',
    },
  });

  // 🔥 7. СВЯЗИ User ↔ Project (UserProject)
  await prisma.userProject.createMany({
    data: [
      // SUPER_ADMIN: LEAD во всех
      { userId: superAdmin.id, projectId: projCommon.id, role: 'PROJECT_LEAD' },

      // LEAD_2: владелец 2 своих + участник общего
      { userId: lead2.id, projectId: projLead2_1.id, role: 'PROJECT_LEAD' },
      { userId: lead2.id, projectId: projLead2_2.id, role: 'PROJECT_LEAD' },
      { userId: lead2.id, projectId: projCommon.id, role: 'PROJECT_MEMBER' },

      // LEAD_3: владелец 3 своих + участник общего
      { userId: lead3.id, projectId: projLead3_1.id, role: 'PROJECT_LEAD' },
      { userId: lead3.id, projectId: projLead3_2.id, role: 'PROJECT_LEAD' },
      { userId: lead3.id, projectId: projLead3_3.id, role: 'PROJECT_LEAD' },
      { userId: lead3.id, projectId: projCommon.id, role: 'PROJECT_MEMBER' },

      // MEMBER_3: участник 3 проектов (0 своих)
      { userId: member3.id, projectId: projCommon.id, role: 'PROJECT_MEMBER' },
      { userId: member3.id, projectId: projLead2_1.id, role: 'PROJECT_MEMBER' },
      { userId: member3.id, projectId: projLead3_1.id, role: 'PROJECT_MEMBER' },
    ],
    skipDuplicates: true,
  });

  // 🔥 8. ТЕСТОВЫЕ ЗАДАЧИ
  await prisma.task.createMany({
    data: [
      {
        id: 'task-common-1',
        title: 'Создать дизайн',
        projectId: projCommon.id,
        assignerId: superAdmin.id,
        assigneeId: member3.id,
        status: 'IN_PROGRESS',
        priority: 'HIGH',
      },
      {
        id: 'task-common-2',
        title: 'Настроить сервер',
        projectId: projCommon.id,
        assignerId: superAdmin.id,
        assigneeId: lead2.id,
        status: 'TODO',
        priority: 'MEDIUM',
      },
    ],
    skipDuplicates: true,
  });

  console.log('🎉 ДЕМО ДАННЫЕ СОЗДАНЫ!');
  console.log('👑 SUPER_ADMIN: superadmin@w4f.com / demo123');
  console.log('🔹 SYSTEM_USER (0): system@w4f.com / demo123');
  console.log('👨‍💼 LEAD 2/3: lead2@w4f.com / demo123');
  console.log('👨‍💼 LEAD 3/3: lead3@w4f.com / demo123');
  console.log('👥 MEMBER (3): member3@w4f.com / demo123');
}

main()
  .catch((e) => {
    console.error('💥 Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
