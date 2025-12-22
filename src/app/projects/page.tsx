// src/app/projects/page.tsx

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProjectClient from './ProjectsClient';

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
  searchParams: Promise<{ fromLogin?: string }>;
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

  const resolvedSearchParams = await searchParams;
  const fromLogin = resolvedSearchParams.fromLogin === 'true';

  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 [projects/page] fromLogin: ${fromLogin}`);
  }

  if (userRole !== 'SUPER_ADMIN' && projects.length === 1 && fromLogin) {
    const projectId = projects[0].id;
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `➡️ [projects/page] После логина 1 проект — редирект в /tasks?projectId=${projectId}`
      );
    }
    redirect(`/tasks?projectId=${projectId}`);
  }

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
    <div
      className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4"
      role="main"
      aria-label="Страница выбора проектов"
    >
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
