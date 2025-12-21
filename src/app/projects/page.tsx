// src/app/projects/page.tsx
// ПОЛНОСТЬЮ ИСПРАВЛЕННЫЙ ФАЙЛ
// Почему была ошибка (объяснение как новичку):
// 1. В Next.js App Router (твоя версия) searchParams — это **Promise** (асинхронный объект).
//    Нельзя писать searchParams.fromLogin напрямую — нужно await searchParams.
//    Ошибка: "searchParams is a Promise and must be unwrapped with `await`".
//    Это новая фича Next.js 15+ — searchParams асинхронный для лучшей производительности (можно загружать параллельно).
// 2. Решение: Добавляем await перед searchParams (async function уже есть).
//    const { fromLogin } = await searchParams;
//    Теперь fromLogin — string | undefined.
// 3. Для чего этот файл: Серверный компонент страницы выбора проектов (/projects).
//    Загружает доступные проекты напрямую из Prisma (без API — быстрее и безопасно).
//    Рендерит клиентский ProjectClient с данными.
//    По PRD: Авто-редирект после логина при 1 проекте (fromLogin=true); ручной переход — всегда список.
// 4. Лучшая практика продакшена:
//    - searchParams — await (асинхронно) — стандарт Next.js 15+.
//    - Dev-логи: process.env.NODE_ENV === 'development' — в проде тихо.
//    - Безопасно: Нет утечек данных (Prisma на сервере).
//    - UX: Авто-редирект после логина, свобода навигации в системе.

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProjectClient from './ProjectsClient';

// Тип проекта с ролью пользователя в проекте
type ProjectWithRole = {
  id: string;
  name: string;
  description: string | null;
  owner: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  _count: {
    members: number;
    tasks: number;
  };
  currentUserRole: 'PROJECT_OWNER' | 'PROJECT_ADMIN' | 'PROJECT_MEMBER' | 'SUPER_ADMIN';
};

export default async function ProjectSelectPage({
  searchParams,
}: {
  searchParams: Promise<{ fromLogin?: string }>; // ИСПРАВЛЕНО: searchParams — Promise
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 [projects/page] Нет сессии — редирект на /login');
    }
    redirect('/login');
  }

  const currentUserId = session.user.id as string;
  const userEmail = session.user.email || 'unknown';
  const userRole = session.user.role;

  if (process.env.NODE_ENV === 'development') {
    console.log(
      `👤 [projects/page] Пользователь: ${userEmail} (ID: ${currentUserId}, роль: ${userRole})`
    );
  }

  let projects: ProjectWithRole[] = [];

  try {
    if (userRole === 'SUPER_ADMIN') {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [projects/page] SUPER_ADMIN: загрузка всех проектов');
      }

      const rawProjects = await prisma.project.findMany({
        where: { status: 'ACTIVE' },
        include: {
          _count: { select: { members: true, tasks: true } },
          owner: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { name: 'asc' },
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ [projects/page] Найдено проектов: ${rawProjects.length}`);
      }

      projects = rawProjects.map((project) => ({
        ...project,
        currentUserRole: 'SUPER_ADMIN' as const,
      }));
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 [projects/page] Загрузка проектов для пользователя ${userEmail}`);
      }

      const userMemberships = await prisma.projectMembership.findMany({
        where: {
          userId: currentUserId,
          project: { status: 'ACTIVE' },
        },
        select: {
          role: true,
          project: {
            include: {
              _count: { select: { members: true, tasks: true } },
              owner: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
        orderBy: { project: { name: 'asc' } },
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ [projects/page] Найдено членств в проектах: ${userMemberships.length}`);
      }

      projects = userMemberships.map((membership) => ({
        ...membership.project,
        currentUserRole: membership.role,
      }));
    }
  } catch (error) {
    console.error('💥 [projects/page] Ошибка загрузки проектов:', error);
    projects = [];
  }

  // ИСПРАВЛЕНИЕ: await searchParams (Promise) — теперь fromLogin доступен
  const resolvedSearchParams = await searchParams;
  const fromLogin = resolvedSearchParams.fromLogin === 'true';

  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 [projects/page] fromLogin: ${fromLogin}`);
  }

  // Авто-редирект при 1 проекте ТОЛЬКО если fromLogin=true (после логина)
  if (userRole !== 'SUPER_ADMIN' && projects.length === 1 && fromLogin) {
    const projectId = projects[0].id;
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `➡️ [projects/page] После логина 1 проект — редирект в /tasks?projectId=${projectId}`
      );
    }
    redirect(`/tasks?projectId=${projectId}`);
  }

  // Подсчёт проектов, где пользователь — владелец (для кнопки создания)
  let userOwnedProjectsCount = 0;
  let canCreateProject = true;

  if (userRole !== 'SUPER_ADMIN') {
    try {
      userOwnedProjectsCount = await prisma.project.count({
        where: { ownerId: currentUserId },
      });
      canCreateProject = userOwnedProjectsCount < 3;

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `📊 [projects/page] Пользователь владеет ${userOwnedProjectsCount}/3 проектами — может создать: ${canCreateProject}`
        );
      }
    } catch (error) {
      console.error('💥 [projects/page] Ошибка подсчёта проектов:', error);
      canCreateProject = false;
    }
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.log('👑 [projects/page] SUPER_ADMIN — может создавать без ограничений');
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`🎯 [projects/page] Рендерим страницу с ${projects.length} проектами`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
      <ProjectClient
        projects={projects}
        userRole={userRole as 'SUPER_ADMIN' | 'USER'}
        userName={
          (session.user as any).firstName || session.user.email?.split('@')[0] || 'Пользователь'
        }
        canCreateProject={canCreateProject}
        userOwnedProjectsCount={userOwnedProjectsCount}
      />
    </div>
  );
}
