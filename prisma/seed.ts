// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение демо данных для многопроектной системы...');

  // ==================== СОЗДАЕМ СУПЕР-АДМИНА ====================
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@workflow.com',
      password: await bcrypt.hash('demo123', 12),
      firstName: 'Андрей',
      lastName: 'Ка',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Супер-админ создан');

  // ==================== СОЗДАЕМ АДМИНОВ ПРОЕКТОВ ====================

  const adminOlya = await prisma.user.create({
    data: {
      email: 'admin.olya@workflow.com',
      password: await bcrypt.hash('demo123', 12),
      firstName: 'Ольга',
      lastName: 'Генералова',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const adminSlava = await prisma.user.create({
    data: {
      email: 'admin.slava@workflow.com',
      password: await bcrypt.hash('demo123', 12),
      firstName: 'Славка',
      lastName: 'Юморист',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Админы проектов созданы');

  // ==================== СОЗДАЕМ ПРОЕКТЫ ====================

  // Проект "Успешный бизнес"
  const olyaProject = await prisma.project.create({
    data: {
      name: 'Успешный бизнес',
      description: 'Один успешный бизнес в мире',
      ownerId: adminOlya.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // +180 дней
    },
  });

  // Проект "Домашние дела"
  const olyaProject2 = await prisma.project.create({
    data: {
      name: 'Домашние дела',
      description: 'Командование своим мужичком',
      ownerId: adminOlya.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // +180 дней
    },
  });

  // Проект "Начинающий успешный бизнес"
  const slavaProject = await prisma.project.create({
    data: {
      name: 'Начинающий успешный бизнес',
      description: 'Еще один почти успешный бизнес в мире',
      ownerId: adminSlava.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
    },
  });

  // Проект "Разработка"
  const devProject = await prisma.project.create({
    data: {
      name: 'Разработка',
      description: 'Почти успешная попытка одного мужчины войти в IT',
      ownerId: superAdmin.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Проекты созданы');

  // ==================== СОЗДАЕМ СОТРУДНИКОВ ====================

  // Сотрудники для проектов
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'bussiness.manager@wf.com',
        password: await bcrypt.hash('demo123', 12),
        firstName: 'Алена',
        lastName: 'Рашидбекова',
        role: 'USER',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'bussiness.manager2@wf.com',
        password: await bcrypt.hash('demo123', 12),
        firstName: 'Лена',
        lastName: 'Истеричко',
        role: 'USER',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'bussiness.manager3@wf.com',
        password: await bcrypt.hash('demo123', 12),
        firstName: 'Аня',
        lastName: 'Барнаульская',
        role: 'USER',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'bussiness.manager4@wf.com',
        password: await bcrypt.hash('demo123', 12),
        firstName: 'Боно',
        lastName: 'Махмудова',
        role: 'USER',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'bussiness2.manager1@wf.com',
        password: await bcrypt.hash('demo123', 12),
        firstName: 'Маша',
        lastName: 'Медведева',
        role: 'USER',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'bussiness2.manager2@wf.com',
        password: await bcrypt.hash('demo123', 12),
        firstName: 'Миша',
        lastName: 'Косолапов',
        role: 'USER',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'bussiness2.manager3@wf.com',
        password: await bcrypt.hash('demo123', 12),
        firstName: 'Саша',
        lastName: 'Сушкина',
        role: 'USER',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'super.devochka@wf.com',
        password: await bcrypt.hash('demo123', 12),
        firstName: 'Викуша',
        lastName: 'Лапатуша',
        role: 'USER',
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Сотрудники созданы');

  // ==================== СОЗДАЕМ ГРУППЫ В ПРОЕКТАХ ====================

  // Группы
  const groups = await Promise.all([
    prisma.group.create({
      data: {
        name: 'ОЗОН команда',
        description: 'Специалисты по работе с OZON',
        projectId: olyaProject.id,
      },
    }),
    prisma.group.create({
      data: {
        name: 'WB команда',
        description: 'Специалисты по работе с Wildberries',
        projectId: olyaProject.id,
      },
    }),
    prisma.group.create({
      data: {
        name: 'Дело суетолога',
        description: 'Все дела в одном',
        projectId: slavaProject.id,
      },
    }),
    prisma.group.create({
      data: {
        name: 'Домашние любимки',
        description: 'Самые родные и любимые',
        projectId: olyaProject2.id,
      },
    }),
    prisma.group.create({
      data: {
        name: 'Разработка DirectWorkflow',
        description: 'Рабочее пространство для команды разработки',
        projectId: devProject.id,
      },
    }),
  ]);

  console.log('✅ Группы созданы');

  // ==================== ПРИВЯЗЫВАЕМ ПОЛЬЗОВАТЕЛЕЙ К ПРОЕКТАМ ====================

  // Админы к своим проектам
  await prisma.userProject.createMany({
    data: [
      { userId: adminOlya.id, projectId: olyaProject.id },
      { userId: adminSlava.id, projectId: slavaProject.id },
      { userId: superAdmin.id, projectId: devProject.id },
      { userId: superAdmin.id, projectId: olyaProject2.id },
      { userId: adminOlya.id, projectId: olyaProject2.id }, // Супер-админ тоже в домашних делах
    ],
  });

  // Сотрудники к проектам
  await prisma.userProject.createMany({
    data: [
      // Успешный бизнес (Ольга)
      { userId: users[0].id, projectId: olyaProject.id },
      { userId: users[1].id, projectId: olyaProject.id },
      { userId: users[2].id, projectId: olyaProject.id },
      { userId: users[3].id, projectId: olyaProject.id },

      // Домашние дела
      { userId: users[7].id, projectId: olyaProject2.id },

      // Начинающий бизнес (Славка)
      { userId: users[4].id, projectId: slavaProject.id },
      { userId: users[5].id, projectId: slavaProject.id },
      { userId: users[6].id, projectId: slavaProject.id },
    ],
  });

  // ==================== РАСПРЕДЕЛЯЕМ СОТРУДНИКОВ ПО ГРУППАМ ====================

  await prisma.userGroup.createMany({
    data: [
      // ОЗОН команда
      { userId: users[0].id, groupId: groups[0].id }, // Алена → ОЗОН
      { userId: users[1].id, groupId: groups[0].id }, // Лена → ОЗОН

      // WB команда
      { userId: users[2].id, groupId: groups[1].id }, // Аня → WB
      { userId: users[3].id, groupId: groups[1].id }, // Бону → WB

      // Дело суетолога
      { userId: users[4].id, groupId: groups[2].id }, // Маша → Суетолог
      { userId: users[5].id, groupId: groups[2].id }, // Миша → Суетолог
      { userId: users[6].id, groupId: groups[2].id }, // Саша → Суетолог

      // Домашние любимки
      { userId: superAdmin.id, groupId: groups[3].id }, // Котя → Любимки
      { userId: users[7].id, groupId: groups[3].id }, // Викуша → Любимки

      // Разработка
      { userId: superAdmin.id, groupId: groups[4].id }, // Котя → Разработка
    ],
  });

  console.log('✅ Пользователи распределены по проектам и группам');

  // ==================== СОЗДАЕМ ЗАДАЧИ ====================

  // Задачи для "ОЗОН команда"
  await prisma.task.createMany({
    data: [
      {
        title: 'Принять заказы',
        description: 'Обрабатывать много поступлений',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: olyaProject.id,
        groupId: groups[0].id,
        creatorId: adminOlya.id,
        estimatedHours: 16,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Не пиздеть',
        description: 'Завалить ебало и молить прощения',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: olyaProject.id,
        groupId: groups[0].id,
        creatorId: adminOlya.id,
        estimatedHours: 8,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Задачи для "WB команда"
  await prisma.task.createMany({
    data: [
      {
        title: 'Следить за браками',
        description: 'Проверять браки в заказах',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: olyaProject.id,
        groupId: groups[1].id,
        creatorId: adminOlya.id,
        estimatedHours: 12,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Съебать из города',
        description: 'Чтобы на глаза не попадаться',
        status: 'TODO',
        priority: 'LOW',
        projectId: olyaProject.id,
        groupId: groups[1].id,
        creatorId: adminOlya.id,
        estimatedHours: 4,
      },
    ],
  });

  // Задачи для "Домашние любимки"
  await prisma.task.createMany({
    data: [
      {
        title: 'Поцелуйки и обнимашки',
        description: 'Радоваться мамуле',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: olyaProject2.id,
        groupId: groups[3].id,
        creatorId: adminOlya.id,
        estimatedHours: 24, // Это же круглосуточно!
        dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +365 дней
      },
      {
        title: 'Пожамкать спинку',
        description: 'Легенький массажик',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: olyaProject2.id,
        groupId: groups[3].id,
        creatorId: adminOlya.id,
        estimatedHours: 2,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // +1 день
      },
    ],
  });

  // Задачи для "Дело суетолога"
  await prisma.task.createMany({
    data: [
      {
        title: 'Работать',
        description: 'Работать',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: slavaProject.id,
        groupId: groups[2].id,
        creatorId: adminSlava.id,
        estimatedHours: 40,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Фигачить',
        description: 'Много работать',
        status: 'TODO',
        priority: 'HIGH',
        projectId: slavaProject.id,
        groupId: groups[2].id,
        creatorId: adminSlava.id,
        estimatedHours: 32,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Вкалывать',
        description: 'Ебать как много работать',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: slavaProject.id,
        groupId: groups[2].id,
        creatorId: adminSlava.id,
        estimatedHours: 20,
      },
    ],
  });

  // Задачи для "Разработка"
  await prisma.task.createMany({
    data: [
      {
        title: 'Сделать DirectWorkflow',
        description: 'Создать самую лучшую систему в мире',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: devProject.id,
        groupId: groups[4].id,
        creatorId: superAdmin.id,
        estimatedHours: 100,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Покорить IT',
        description: 'Стать самым крутым разработчиком',
        status: 'TODO',
        priority: 'HIGH',
        projectId: devProject.id,
        groupId: groups[4].id,
        creatorId: superAdmin.id,
        estimatedHours: 1000,
        dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('✅ Задачи созданы');

  // ==================== НАЗНАЧАЕМ ЗАДАЧИ СОТРУДНИКАМ ====================

  await prisma.taskAssignment.createMany({
    data: [
      // ОЗОН команда (задачи 1-2)
      { taskId: 1, userId: users[0].id, assignedBy: adminOlya.id }, // Алена → Принять заказы
      { taskId: 1, userId: users[1].id, assignedBy: adminOlya.id }, // Лена → Принять заказы
      { taskId: 2, userId: users[1].id, assignedBy: adminOlya.id }, // Лена → Не пиздеть

      // WB команда (задачи 3-4)
      { taskId: 3, userId: users[2].id, assignedBy: adminOlya.id }, // Аня → Следить за браками
      { taskId: 3, userId: users[3].id, assignedBy: adminOlya.id }, // Бону → Следить за браками
      { taskId: 4, userId: users[2].id, assignedBy: adminOlya.id }, // Аня → Съебать из города

      // Домашние любимки (задачи 5-6)
      { taskId: 5, userId: superAdmin.id, assignedBy: superAdmin.id }, // Котя → Поцелуйки
      { taskId: 6, userId: users[7].id, assignedBy: superAdmin.id }, // Викуша → Массажик

      // Дело суетолога (задачи 7-9)
      { taskId: 7, userId: users[4].id, assignedBy: adminSlava.id }, // Маша → Работать
      { taskId: 8, userId: users[5].id, assignedBy: adminSlava.id }, // Миша → Фигачить
      { taskId: 9, userId: users[6].id, assignedBy: adminSlava.id }, // Саша → Вкалывать

      // Разработка (задачи 10-11)
      { taskId: 10, userId: superAdmin.id, assignedBy: superAdmin.id }, // Котя → DirectWorkflow
      { taskId: 11, userId: superAdmin.id, assignedBy: superAdmin.id }, // Котя → Покорить IT
    ],
  });

  console.log('✅ Задачи назначены сотрудникам');

  // ==================== СОЗДАЕМ КОММЕНТАРИИ К ЗАДАЧАМ ====================

  await prisma.comment.createMany({
    data: [
      {
        content: 'Уже обработала 50 заказов! Работа кипит!',
        taskId: 1,
        authorId: users[0].id,
      },
      {
        content: 'Стараюсь не пиздеть, но тяжело...',
        taskId: 2,
        authorId: users[1].id,
      },
      {
        content: 'Нашла 3 брака сегодня. Исправляем!',
        taskId: 3,
        authorId: users[2].id,
      },
      {
        content: 'Мамуля, я тебя обожаю! 💖',
        taskId: 5,
        authorId: users[7].id,
      },
      {
        content: 'Я готова к массажу! Когда придёшь? 😊',
        taskId: 6,
        authorId: adminOlya.id,
      },
      {
        content: 'Работаю не покладая рук!',
        taskId: 7,
        authorId: users[4].id,
      },
      {
        content: 'DirectWorkflow уже почти готов! Осталось чуть-чуть!',
        taskId: 10,
        authorId: superAdmin.id,
      },
    ],
  });

  console.log('✅ Комментарии созданы');

  // ==================== ЛОГИРУЕМ ДЕЙСТВИЯ ====================

  await prisma.activityLog.createMany({
    data: [
      {
        userId: superAdmin.id,
        actionType: 'PROJECT_CREATED',
        entityType: 'Project',
        entityId: olyaProject.id,
        newValues: { name: olyaProject.name, status: 'ACTIVE' },
      },
      {
        userId: adminOlya.id,
        actionType: 'TASK_CREATED',
        entityType: 'Task',
        entityId: 1,
        newValues: { title: 'Принять заказы', priority: 'HIGH' },
      },
      {
        userId: users[0].id,
        actionType: 'TASK_STATUS_CHANGED',
        entityType: 'Task',
        entityId: 1,
        oldValues: { status: 'TODO' },
        newValues: { status: 'IN_PROGRESS' },
      },
      {
        userId: superAdmin.id,
        actionType: 'TASK_CREATED',
        entityType: 'Task',
        entityId: 5,
        newValues: { title: 'Поцелуйки и обнимашки', priority: 'HIGH' },
      },
    ],
  });

  console.log('✅ Логи действий созданы');

  // ==================== ВЫВОДИМ ИНФОРМАЦИЮ ДЛЯ ТЕСТИРОВАНИЯ ====================

  console.log('\n🎯 ДЕМО ДОСТУПЫ ДЛЯ ТЕСТИРОВАНИЯ:');
  console.log('=========================================');
  console.log('👑 СУПЕР-АДМИН (все проекты):');
  console.log('   Email: superadmin@workflow.com');
  console.log('   Пароль: demo123');
  console.log('');
  console.log('👨‍💼 АДМИНЫ ПРОЕКТОВ:');
  console.log('   • Успешный бизнес: admin.ecommerce@workflow.com / demo123');
  console.log('   • Начинающий бизнес: admin.logistics@workflow.com / demo123');
  console.log('');
  console.log('👥 СОТРУДНИКИ:');
  console.log('   Успешный бизнес (ОЗОН):');
  console.log('   • Алена: bussiness.manager@wf.com / demo123');
  console.log('   • Лена: bussiness.manager2@wf.com / demo123');
  console.log('');
  console.log('   Успешный бизнес (WB):');
  console.log('   • Аня: bussiness.manager3@wf.com / demo123');
  console.log('   • Боно: bussiness.manager4@wf.com / demo123');
  console.log('');
  console.log('   Начинающий бизнес:');
  console.log('   • Маша: bussiness2.manager1@wf.com / demo123');
  console.log('   • Миша: bussiness2.manager2@wf.com / demo123');
  console.log('   • Саша: bussiness2.manager3@wf.com / demo123');
  console.log('');
  console.log('   Домашние дела:');
  console.log('   • Викуша: super.devochka@wf.com / demo123');
  console.log('');
  console.log('💡 ОСОБЕННОСТИ СИСТЕМЫ:');
  console.log('   • Супер-админ видит ВСЕ проекты и может всё');
  console.log('   • Админы видят ТОЛЬКО свои проекты');
  console.log('   • Сотрудники видят ТОЛЬКО свои проекты и задачи');
  console.log('   • При входе можно выбрать проект для работы');
  console.log('   • Задачи привязаны к группам внутри проектов');
  console.log('');
  console.log('🎪 ВЕСЕЛЫЕ ОСОБЕННОСТИ:');
  console.log('   • "Не пиздеть" - важная бизнес-задача');
  console.log('   • "Съебыть из города" - стратегическое решение');
  console.log('   • Поцелуйки и обнимашки - круглосуточная задача');
  console.log('   • Работать, фигачить и вкалывать - три стадии труда');
  console.log('');
  console.log('✅ Демо данные успешно созданы! Система готова к работе.');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении демо данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/*
ЗАПУСК СЦЕНАРИЯ ЗАПОЛНЕНИЯ ДЕМО ДАННЫХ
# Способ 1: Через наш скрипт
npm run db:seed

# Способ 2: Через Prisma (должен работать после настройки package.json)
npx prisma db seed

# Способ 3: Напрямую через tsx
npx tsx prisma/seed.ts

# Открываем Prisma Studio чтобы посмотреть данные
npx prisma studio

# 1. Добавляем скрипт в package.json (уже показал выше)
{
  "scripts": {
    "dev": "next dev",
    "db:seed": "tsx prisma/seed.ts"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    // ... твои зависимости
  },
  "devDependencies": {
    // ... твои dev зависимости
  }
}
# 2. Устанавливаем tsx
npm install -D tsx

# 3. Создаем файл prisma/seed.ts (уже показал выше)  
# 4. Запускаем seed
npm run db:seed

# 5. Проверяем результат
npx prisma studio

или 


# 1. Удаляем текущую версию Prisma
npm uninstall prisma @prisma/client

# 2. Устанавливаем стабильную версию
npm install prisma@^5.0.0 @prisma/client@^5.0.0

# 3. Перегенерируем клиент
npx prisma generate

# 4. Сбрасываем базу
npx prisma db push --force-reset

# 5. Запускаем seed
npm run db:seed


*/

// // prisma/seed.ts
// import { PrismaClient } from '@prisma/client';
// import bcrypt from 'bcryptjs';

// const prisma = new PrismaClient();

// async function main() {
//   console.log('🌱 Начинаем заполнение демо данных для многопроектной системы...');

//   // ==================== СОЗДАЕМ СУПЕР-АДМИНА ====================
//   const superAdmin = await prisma.user.create({
//     data: {
//       email: 'superadmin@workflow.com',
//       password: 'demo123',
//       firstName: 'Андрей',
//       lastName: 'Главный',
//       role: 'SUPER_ADMIN',
//       isActive: true,
//     },
//   });

//   console.log('✅ Супер-админ создан');

//   // ==================== СОЗДАЕМ ПРОЕКТЫ ====================

//   // Проект "Электронная коммерция"
//   const ecommerceProject = await prisma.project.create({
//     data: {
//       name: 'Электронная коммерция',
//       description: 'Управление маркетплейсами и интернет-магазинами',
//       ownerId: superAdmin.id,
//       status: 'ACTIVE',
//       startDate: new Date(),
//       endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // +180 дней
//     },
//   });

//   // Проект "Логистика"
//   const logisticsProject = await prisma.project.create({
//     data: {
//       name: 'Логистика',
//       description: 'Управление доставкой и складскими операциями',
//       ownerId: superAdmin.id,
//       status: 'ACTIVE',
//       startDate: new Date(),
//       endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
//     },
//   });

//   // Проект "Разработка"
//   const developmentProject = await prisma.project.create({
//     data: {
//       name: 'Разработка',
//       description: 'Внутренние IT проекты и разработка',
//       ownerId: superAdmin.id,
//       status: 'ACTIVE',
//       startDate: new Date(),
//       endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
//     },
//   });

//   console.log('✅ Проекты созданы');

//   // ==================== СОЗДАЕМ АДМИНОВ ПРОЕКТОВ ====================

//   const adminEcommerce = await prisma.user.create({
//     data: {
//       email: 'admin.ecommerce@workflow.com',
//       password: 'demo123',
//       firstName: 'Ольга',
//       lastName: 'Маркетплейсова',
//       role: 'ADMIN',
//       isActive: true,
//     },
//   });

//   const adminLogistics = await prisma.user.create({
//     data: {
//       email: 'admin.logistics@workflow.com',
//       password: 'demo123',
//       firstName: 'Иван',
//       lastName: 'Логистов',
//       role: 'ADMIN',
//       isActive: true,
//     },
//   });

//   const adminDevelopment = await prisma.user.create({
//     data: {
//       email: 'admin.dev@workflow.com',
//       password: 'demo123',
//       firstName: 'Сергей',
//       lastName: 'Разработкин',
//       role: 'ADMIN',
//       isActive: true,
//     },
//   });

//   console.log('✅ Админы проектов созданы');

//   // ==================== СОЗДАЕМ СОТРУДНИКОВ ====================

//   // Сотрудники для проекта "Электронная коммерция"
//   const usersEcommerce = await Promise.all([
//     prisma.user.create({
//       data: {
//         email: 'ozon.manager@workflow.com',
//         password: 'demo123',
//         firstName: 'Анна',
//         lastName: 'Озонова',
//         role: 'USER',
//         isActive: true,
//       },
//     }),
//     prisma.user.create({
//       data: {
//         email: 'wb.specialist@workflow.com',
//         password: 'demo123',
//         firstName: 'Дмитрий',
//         lastName: 'Вайлдберрисов',
//         role: 'USER',
//         isActive: true,
//       },
//     }),
//     prisma.user.create({
//       data: {
//         email: 'content.manager@workflow.com',
//         password: 'demo123',
//         firstName: 'Елена',
//         lastName: 'Контентова',
//         role: 'USER',
//         isActive: true,
//       },
//     }),
//   ]);

//   // Сотрудники для проекта "Логистика"
//   const usersLogistics = await Promise.all([
//     prisma.user.create({
//       data: {
//         email: 'warehouse.manager@workflow.com',
//         password: 'demo123',
//         firstName: 'Алексей',
//         lastName: 'Складов',
//         role: 'USER',
//         isActive: true,
//       },
//     }),
//     prisma.user.create({
//       data: {
//         email: 'delivery.coordinator@workflow.com',
//         password: 'demo123',
//         firstName: 'Мария',
//         lastName: 'Доставкина',
//         role: 'USER',
//         isActive: true,
//       },
//     }),
//     prisma.user.create({
//       data: {
//         email: 'logistics.analyst@workflow.com',
//         password: 'demo123',
//         firstName: 'Павел',
//         lastName: 'Аналитиков',
//         role: 'USER',
//         isActive: true,
//       },
//     }),
//   ]);

//   // Сотрудники для проекта "Разработка"
//   const usersDevelopment = await Promise.all([
//     prisma.user.create({
//       data: {
//         email: 'frontend.dev@workflow.com',
//         password: 'demo123',
//         firstName: 'Артем',
//         lastName: 'Реактов',
//         role: 'USER',
//         isActive: true,
//       },
//     }),
//     prisma.user.create({
//       data: {
//         email: 'backend.dev@workflow.com',
//         password: 'demo123',
//         firstName: 'Виктория',
//         lastName: 'Нодовна',
//         role: 'USER',
//         isActive: true,
//       },
//     }),
//     prisma.user.create({
//       data: {
//         email: 'ui.designer@workflow.com',
//         password: 'demo123',
//         firstName: 'Светлана',
//         lastName: 'Дизайнерова',
//         role: 'USER',
//         isActive: true,
//       },
//     }),
//   ]);

//   console.log('✅ Сотрудники созданы');

//   // ==================== СОЗДАЕМ ГРУППЫ В ПРОЕКТАХ ====================

//   // Группы для "Электронная коммерция"
//   const groupsEcommerce = await Promise.all([
//     prisma.group.create({
//       data: {
//         name: 'ОЗОН команда',
//         description: 'Специалисты по работе с OZON',
//         projectId: ecommerceProject.id,
//       },
//     }),
//     prisma.group.create({
//       data: {
//         name: 'WB команда',
//         description: 'Специалисты по работе с Wildberries',
//         projectId: ecommerceProject.id,
//       },
//     }),
//     prisma.group.create({
//       data: {
//         name: 'Контент менеджеры',
//         description: 'Создание и управление контентом',
//         projectId: ecommerceProject.id,
//       },
//     }),
//   ]);

//   // Группы для "Логистика"
//   const groupsLogistics = await Promise.all([
//     prisma.group.create({
//       data: {
//         name: 'Складская логистика',
//         description: 'Управление складскими операциями',
//         projectId: logisticsProject.id,
//       },
//     }),
//     prisma.group.create({
//       data: {
//         name: 'Доставка',
//         description: 'Координация доставки',
//         projectId: logisticsProject.id,
//       },
//     }),
//     prisma.group.create({
//       data: {
//         name: 'Аналитика логистики',
//         description: 'Анализ и оптимизация логистических процессов',
//         projectId: logisticsProject.id,
//       },
//     }),
//   ]);

//   // Группы для "Разработка"
//   const groupsDevelopment = await Promise.all([
//     prisma.group.create({
//       data: {
//         name: 'Frontend разработка',
//         description: 'Разработка пользовательского интерфейса',
//         projectId: developmentProject.id,
//       },
//     }),
//     prisma.group.create({
//       data: {
//         name: 'Backend разработка',
//         description: 'Разработка серверной части',
//         projectId: developmentProject.id,
//       },
//     }),
//     prisma.group.create({
//       data: {
//         name: 'UI/UX дизайн',
//         description: 'Дизайн интерфейсов и пользовательского опыта',
//         projectId: developmentProject.id,
//       },
//     }),
//   ]);

//   console.log('✅ Группы созданы');

//   // ==================== ПРИВЯЗЫВАЕМ ПОЛЬЗОВАТЕЛЕЙ К ПРОЕКТАМ ====================

//   // Админы к своим проектам
//   await prisma.userProject.createMany({
//     data: [
//       { userId: adminEcommerce.id, projectId: ecommerceProject.id },
//       { userId: adminLogistics.id, projectId: logisticsProject.id },
//       { userId: adminDevelopment.id, projectId: developmentProject.id },
//     ],
//   });

//   // Сотрудники к проектам
//   await prisma.userProject.createMany({
//     data: [
//       // Электронная коммерция
//       { userId: usersEcommerce[0].id, projectId: ecommerceProject.id },
//       { userId: usersEcommerce[1].id, projectId: ecommerceProject.id },
//       { userId: usersEcommerce[2].id, projectId: ecommerceProject.id },
//       // Логистика
//       { userId: usersLogistics[0].id, projectId: logisticsProject.id },
//       { userId: usersLogistics[1].id, projectId: logisticsProject.id },
//       { userId: usersLogistics[2].id, projectId: logisticsProject.id },
//       // Разработка
//       { userId: usersDevelopment[0].id, projectId: developmentProject.id },
//       { userId: usersDevelopment[1].id, projectId: developmentProject.id },
//       { userId: usersDevelopment[2].id, projectId: developmentProject.id },
//     ],
//   });

//   // ==================== РАСПРЕДЕЛЯЕМ СОТРУДНИКОВ ПО ГРУППАМ ====================

//   await prisma.userGroup.createMany({
//     data: [
//       // Электронная коммерция
//       { userId: usersEcommerce[0].id, groupId: groupsEcommerce[0].id }, // Анна → ОЗОН
//       { userId: usersEcommerce[1].id, groupId: groupsEcommerce[1].id }, // Дмитрий → WB
//       { userId: usersEcommerce[2].id, groupId: groupsEcommerce[2].id }, // Елена → Контент

//       // Логистика
//       { userId: usersLogistics[0].id, groupId: groupsLogistics[0].id }, // Алексей → Склад
//       { userId: usersLogistics[1].id, groupId: groupsLogistics[1].id }, // Мария → Доставка
//       { userId: usersLogistics[2].id, groupId: groupsLogistics[2].id }, // Павел → Аналитика

//       // Разработка
//       { userId: usersDevelopment[0].id, groupId: groupsDevelopment[0].id }, // Артем → Frontend
//       { userId: usersDevelopment[1].id, groupId: groupsDevelopment[1].id }, // Виктория → Backend
//       { userId: usersDevelopment[2].id, groupId: groupsDevelopment[2].id }, // Светлана → Дизайн
//     ],
//   });

//   console.log('✅ Пользователи распределены по проектам и группам');

//   // ==================== СОЗДАЕМ ЗАДАЧИ ====================

//   // Задачи для "Электронная коммерция"
//   const tasksEcommerce = await prisma.task.createMany({
//     data: [
//       {
//         title: 'Оптимизация карточек товаров ОЗОН',
//         description: 'Улучшить SEO-параметры и изображения товаров',
//         status: 'IN_PROGRESS',
//         priority: 'HIGH',
//         projectId: ecommerceProject.id,
//         groupId: groupsEcommerce[0].id,
//         creatorId: adminEcommerce.id,
//         estimatedHours: 16,
//         dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//       },
//       {
//         title: 'Анализ цен конкурентов WB',
//         description: 'Сравнить цены с основными конкурентами на Wildberries',
//         status: 'TODO',
//         priority: 'MEDIUM',
//         projectId: ecommerceProject.id,
//         groupId: groupsEcommerce[1].id,
//         creatorId: adminEcommerce.id,
//         estimatedHours: 8,
//         dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
//       },
//       {
//         title: 'Создание контент-плана на месяц',
//         description: 'Разработать план публикаций для социальных сетей',
//         status: 'TODO',
//         priority: 'MEDIUM',
//         projectId: ecommerceProject.id,
//         groupId: groupsEcommerce[2].id,
//         creatorId: adminEcommerce.id,
//         estimatedHours: 12,
//       },
//     ],
//   });

//   // Задачи для "Логистика"
//   const tasksLogistics = await prisma.task.createMany({
//     data: [
//       {
//         title: 'Реорганизация складских зон',
//         description: 'Оптимизировать расположение товаров на складе',
//         status: 'IN_PROGRESS',
//         priority: 'HIGH',
//         projectId: logisticsProject.id,
//         groupId: groupsLogistics[0].id,
//         creatorId: adminLogistics.id,
//         estimatedHours: 24,
//         dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
//       },
//       {
//         title: 'Внедрение системы отслеживания доставки',
//         description: 'Настроить автоматическое уведомление клиентов',
//         status: 'TODO',
//         priority: 'HIGH',
//         projectId: logisticsProject.id,
//         groupId: groupsLogistics[1].id,
//         creatorId: adminLogistics.id,
//         estimatedHours: 20,
//       },
//       {
//         title: 'Анализ логистических затрат',
//         description: 'Выявить возможности для снижения расходов',
//         status: 'REVIEW',
//         priority: 'MEDIUM',
//         projectId: logisticsProject.id,
//         groupId: groupsLogistics[2].id,
//         creatorId: adminLogistics.id,
//         estimatedHours: 10,
//       },
//     ],
//   });

//   // Задачи для "Разработка"
//   const tasksDevelopment = await prisma.task.createMany({
//     data: [
//       {
//         title: 'Разработка нового интерфейса дашборда',
//         description: 'Создать современный и удобный интерфейс',
//         status: 'TODO',
//         priority: 'HIGH',
//         projectId: developmentProject.id,
//         groupId: groupsDevelopment[0].id,
//         creatorId: adminDevelopment.id,
//         estimatedHours: 40,
//         dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//       },
//       {
//         title: 'Оптимизация API endpoints',
//         description: 'Увеличить производительность API',
//         status: 'IN_PROGRESS',
//         priority: 'MEDIUM',
//         projectId: developmentProject.id,
//         groupId: groupsDevelopment[1].id,
//         creatorId: adminDevelopment.id,
//         estimatedHours: 16,
//       },
//       {
//         title: 'Создание дизайн-системы',
//         description: 'Разработать единую систему компонентов',
//         status: 'DONE',
//         priority: 'MEDIUM',
//         projectId: developmentProject.id,
//         groupId: groupsDevelopment[2].id,
//         creatorId: adminDevelopment.id,
//         estimatedHours: 32,
//       },
//     ],
//   });

//   console.log('✅ Задачи созданы');

//   // ==================== НАЗНАЧАЕМ ЗАДАЧИ СОТРУДНИКАМ ====================

//   await prisma.taskAssignment.createMany({
//     data: [
//       // Электронная коммерция
//       { taskId: 1, userId: usersEcommerce[0].id, assignedBy: adminEcommerce.id },
//       { taskId: 2, userId: usersEcommerce[1].id, assignedBy: adminEcommerce.id },
//       { taskId: 3, userId: usersEcommerce[2].id, assignedBy: adminEcommerce.id },

//       // Логистика
//       { taskId: 4, userId: usersLogistics[0].id, assignedBy: adminLogistics.id },
//       { taskId: 5, userId: usersLogistics[1].id, assignedBy: adminLogistics.id },
//       { taskId: 6, userId: usersLogistics[2].id, assignedBy: adminLogistics.id },

//       // Разработка
//       { taskId: 7, userId: usersDevelopment[0].id, assignedBy: adminDevelopment.id },
//       { taskId: 8, userId: usersDevelopment[1].id, assignedBy: adminDevelopment.id },
//       { taskId: 9, userId: usersDevelopment[2].id, assignedBy: adminDevelopment.id },
//     ],
//   });

//   console.log('✅ Задачи назначены сотрудникам');

//   // ==================== СОЗДАЕМ КОММЕНТАРИИ К ЗАДАЧАМ ====================

//   await prisma.comment.createMany({
//     data: [
//       {
//         content: 'Начал работу над SEO-оптимизацией. Уже улучшил 50 карточек.',
//         taskId: 1,
//         authorId: usersEcommerce[0].id,
//       },
//       {
//         content: 'Есть вопросы по мета-тегам. Нужна консультация.',
//         taskId: 1,
//         authorId: usersEcommerce[0].id,
//       },
//       {
//         content: 'API оптимизация идет по плану. Уже достигли 30% прироста производительности.',
//         taskId: 8,
//         authorId: usersDevelopment[1].id,
//       },
//     ],
//   });

//   // ==================== ЛОГИРУЕМ ДЕЙСТВИЯ ====================

//   await prisma.activityLog.createMany({
//     data: [
//       {
//         userId: superAdmin.id,
//         actionType: 'PROJECT_CREATED',
//         entityType: 'Project',
//         entityId: ecommerceProject.id,
//         newValues: { name: ecommerceProject.name, status: 'ACTIVE' },
//       },
//       {
//         userId: adminEcommerce.id,
//         actionType: 'TASK_CREATED',
//         entityType: 'Task',
//         entityId: 1,
//         newValues: { title: 'Оптимизация карточек товаров ОЗОН', priority: 'HIGH' },
//       },
//       {
//         userId: usersEcommerce[0].id,
//         actionType: 'TASK_STATUS_CHANGED',
//         entityType: 'Task',
//         entityId: 1,
//         oldValues: { status: 'TODO' },
//         newValues: { status: 'IN_PROGRESS' },
//       },
//     ],
//   });

//   console.log('✅ Логи действий созданы');

//   // ==================== ВЫВОДИМ ИНФОРМАЦИЮ ДЛЯ ТЕСТИРОВАНИЯ ====================

//   console.log('\n🎯 ДЕМО ДОСТУПЫ ДЛЯ ТЕСТИРОВАНИЯ:');
//   console.log('=========================================');
//   console.log('👑 СУПЕР-АДМИН (все проекты):');
//   console.log('   Email: superadmin@workflow.com');
//   console.log('   Пароль: demo123');
//   console.log('');
//   console.log('👨‍💼 АДМИНЫ ПРОЕКТОВ:');
//   console.log('   • Электронная коммерция: admin.ecommerce@workflow.com / demo123');
//   console.log('   • Логистика: admin.logistics@workflow.com / demo123');
//   console.log('   • Разработка: admin.dev@workflow.com / demo123');
//   console.log('');
//   console.log('👥 СОТРУДНИКИ:');
//   console.log('   Электронная коммерция:');
//   console.log('   • ОЗОН: ozon.manager@workflow.com / demo123');
//   console.log('   • WB: wb.specialist@workflow.com / demo123');
//   console.log('   • Контент: content.manager@workflow.com / demo123');
//   console.log('');
//   console.log('   Логистика:');
//   console.log('   • Склад: warehouse.manager@workflow.com / demo123');
//   console.log('   • Доставка: delivery.coordinator@workflow.com / demo123');
//   console.log('   • Аналитика: logistics.analyst@workflow.com / demo123');
//   console.log('');
//   console.log('   Разработка:');
//   console.log('   • Frontend: frontend.dev@workflow.com / demo123');
//   console.log('   • Backend: backend.dev@workflow.com / demo123');
//   console.log('   • Дизайн: ui.designer@workflow.com / demo123');
//   console.log('');
//   console.log('💡 ОСОБЕННОСТИ СИСТЕМЫ:');
//   console.log('   • Супер-админ видит ВСЕ проекты и может всё');
//   console.log('   • Админы видят ТОЛЬКО свои проекты');
//   console.log('   • Сотрудники видят ТОЛЬКО свои проекты и задачи');
//   console.log('   • При входе можно выбрать проект для работы');
//   console.log('   • Задачи привязаны к группам внутри проектов');
//   console.log('');
//   console.log('✅ Демо данные успешно созданы! Система готова к работе.');
// }

// main()
//   .catch((e) => {
//     console.error('❌ Ошибка при заполнении демо данных:', e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
