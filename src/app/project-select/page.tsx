// ============================================================================
// ФАЙЛ: src/app/project-select/page.tsx
// НАЗНАЧЕНИЕ: Серверная страница выбора проекта
// ----------------------------------------------------------------------------
// Что здесь происходит (для новичка):
// 1. Это серверный компонент — работает на сервере (безопасно и быстро)
// 2. Получаем сессию (кто залогинен)
// 3. Загружаем проекты:
//    - Супер-админ видит все активные
//    - Обычный пользователь видит только свои (через таблицу UserProject)
// 4. Автоматический редирект:
//    - 0 проектов → /no-projects
//    - 1 проект → сразу на /tasks этого проекта
//    - >1 проект → показываем список
// ============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProjectSelectorClient from './ProjectSelectorClient';

export default async function ProjectSelectPage() {
  // Получаем сессию на сервере
  const session = await getServerSession(authOptions);

  // Если не залогинен — кидаем на вход
  if (!session || !session.user) {
    redirect('/login');
  }

  let projects: any[] = [];

  if (session.user.role === 'SUPER_ADMIN') {
    // Супер-админ видит все проекты
    projects = await prisma.project.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        description: true,
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  } else {
    // Обычный пользователь видит только свои проекты
    const userProjects = await prisma.userProject.findMany({
      where: {
        userId: session.user.id as string, // ID пользователя из сессии
        project: { status: 'ACTIVE' },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            owner: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    projects = userProjects.map((up) => up.project);
  }

  // Автоматический редирект по количеству проектов
  if (projects.length === 0) {
    redirect('/no-projects');
  } else if (projects.length === 1) {
    redirect(`/tasks?projectId=${projects[0].id}`);
  }

  // Если больше одного — показываем выбор
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
      <ProjectSelectorClient
        projects={projects}
        userRole={session.user.role}
        userName={
          (session.user as any).firstName || session.user.email?.split('@')[0] || 'Пользователь'
        }
      />
    </div>
  );
}
