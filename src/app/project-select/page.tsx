// src/app/project-select/page.tsx

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import ProjectSelectorClient from './ProjectSelectorClient';

export default async function ProjectSelectPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  let userProjects;

  if (session.user.role === 'SUPER_ADMIN') {
    userProjects = await prisma.project.findMany({
      where: { status: 'ACTIVE' },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            userProjects: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  } else {
    userProjects = await prisma.project.findMany({
      where: {
        status: 'ACTIVE',
        userProjects: {
          some: {
            userId: parseInt(session.user.id),
          },
        },
      },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            userProjects: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
      <ProjectSelectorClient
        projects={userProjects}
        userRole={session.user.role}
        userName={session.user.name || ''}></ProjectSelectorClient>
    </div>
  );
}

// // Импорты для серверной части
// import { getServerSession } from 'next-auth';
// // Функция для получения данных сессии на СЕРВЕРЕ (не в браузере)
// // Работает через cookies которые браузер отправляет на сервер

// import { authOptions } from '@/lib/auth';
// // Наш конфигурационный файл NextAuth который мы создали отдельно
// // Содержит провайдеры, callbacks, секретный ключ и настройки сессии

// import { redirect } from 'next/navigation';
// // Функция для ПЕРЕНАПРАВЛЕНИЯ на другую страницу
// // СЕРВЕРНЫЙ редирект - происходит до отправки HTML в браузер

// import { prisma } from '@/lib/db';
// // Наш клиент для работы с базой данных PostgreSQL
// // Prisma генерирует этот клиент на основе нашей schema.prisma

// import { ProjectSelectorClient } from './ProjectSelectorClient';
// // Клиентский компонент который будет отображать интерфейс выбора проектов
// // Серверный компонент подготавливает данные, клиентский - показывает UI

// // Асинхронный серверный компонент - выполняется на сервере
// // Ключевое слово 'async' потому что внутри есть await запросы к БД
// export default async function ProjectSelectPage() {
//   // ↓ ШАГ 1: ПОЛУЧАЕМ СЕССИЮ ПОЛЬЗОВАТЕЛЯ
//   // await - ждем пока запрос к NextAuth выполнится
//   const session = await getServerSession(authOptions);
//   // session содержит данные пользователя ИЛИ null если не авторизован

//   // ↓ ШАГ 2: ПРОВЕРЯЕМ АВТОРИЗАЦИЮ (ЗАЩИТА МАРШРУТА)
//   if (!session) {
//     // Если session = null (пользователь не вошел в систему)
//     redirect('/auth/login');
//     // Сервер отправляет браузеру команду перенаправить на /auth/login
//     // Дальнейший код НЕ выполняется для неавторизованных пользователей
//   }

//   // ↓ ШАГ 3: ПОЛУЧАЕМ ПРОЕКТЫ ИЗ БАЗЫ ДАННЫХ
//   let userProjects; // Создаем переменную для хранения проектов

//   // РАЗДЕЛЯЕМ ПРАВА ДОСТУПА ПО РОЛЯМ:
//   if (session.user.role === 'SUPER_ADMIN') {
//     // ↓ ЕСЛИ ПОЛЬЗОВАТЕЛЬ СУПЕР-АДМИН:
//     userProjects = await prisma.project.findMany({
//       // Получаем ВСЕ активные проекты из базы данных
//       where: { status: 'ACTIVE' },
//       // Фильтр: только проекты со статусом 'ACTIVE'
//       // Защита от показа удаленных/заблокированных проектов

//       include: {
//         // ПОДГРУЖАЕМ СВЯЗАННЫЕ ДАННЫЕ:
//         owner: {
//           // Связь с таблицей User (владелец проекта)
//           select: {
//             firstName: true,   // Только имя владельца
//             lastName: true,    // Только фамилия владельца
//             email: true        // Только email владельца
//             // НЕ включаем чувствительные данные (пароль и т.д.)
//           },
//         },
//         _count: {
//           // АГРЕГАЦИЯ: подсчет количества связанных записей
//           select: {
//             tasks: true,        // Количество задач в проекте
//             userProjects: true  // Количество участников проекта
//           },
//         },
//       },

//       orderBy: { name: 'asc' },
//       // СОРТИРОВКА: по имени проекта в алфавитном порядке (A-Z)
//     });

//   } else {
//     // ↓ ЕСЛИ ПОЛЬЗОВАТЕЛЬ НЕ СУПЕР-АДМИН:
//     userProjects = await prisma.project.findMany({
//       where: {
//         status: 'ACTIVE', // Только активные проекты

//         userProjects: {
//           // ФИЛЬТР ЧЕРЕЗ СВЯЗЬ МНОГИЕ-КО-МНОГИМ:
//           // Таблица userProjects связывает пользователей и проекты
//           some: {
//             // SOME: условие что ХОТЯ БЫ ОДНА связь удовлетворяет
//             userId: parseInt(session.user.id),
//             // Ищем связи где userId = ID текущего пользователя
//             // parseInt - преобразуем string ID из сессии в number ID БД
//           },
//         },
//       },

//       include: {
//         // ТЕ ЖЕ ВКЛЮЧЕНИЯ ЧТО И ДЛЯ СУПЕР-АДМИНА:
//         // Чтобы у всех пользователей был одинаковый интерфейс
//         owner: {
//           select: { firstName: true, lastName: true, email: true },
//         },
//         _count: {
//           select: {
//             tasks: true,
//             userProjects: true,
//           },
//         },
//       },

//       orderBy: { name: 'asc' }, // Такая же сортировка
//     });
//   }

//   // ↓ ШАГ 4: РЕНДЕРИМ СТРАНИЦУ С ПЕРЕДАЧЕЙ ДАННЫХ
//   return (
//     // ОСНОВНОЙ КОНТЕЙНЕР СТРАНИЦЫ:
//     <div className="
//       min-h-screen           /* Минимальная высота = 100% высоты экрана */
//       bg-gradient-to-br     /* Градиентный фон от левого-верхнего к правому-нижнему */
//       from-primary-50       /* Начальный цвет: светло-лиловый (50% opacity) */
//       to-accent-50          /* Конечный цвет: светло-акцентный (50% opacity) */
//       flex                  /* Включаем flexbox для центрирования */
//       items-center          /* Центрируем по вертикали */
//       justify-center        /* Центрируем по горизонтали */
//       p-4                   /* Padding 1rem (16px) со всех сторон для отступов от краев */
//     ">
//       {/*
//         КЛИЕНТСКИЙ КОМПОНЕНТ ДЛЯ ИНТЕРФЕЙСА:
//         Серверный компонент подготавливает данные, клиентский - показывает UI
//         Передаем данные как props (свойства)
//       */}
//       <ProjectSelectorClient
//         projects={userProjects}
//         /* Массив проектов из базы данных */

//         userRole={session.user.role}
//         /* Роль пользователя для определения прав доступа */

//         userName={session.user.name || ''}
//         /* Имя пользователя ИЛИ пустая строка если name не определено */
//       />
//     </div>
//   );
// }
