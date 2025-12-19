// path: src/app/projects/page.tsx
// Страница выбора проекта после входа в систему

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProjectClient from './ProjectsClient';

// Тип для проекта с добавленной ролью текущего пользователя
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

export default async function ProjectSelectPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    console.log('🔒 [projects/page] Нет сессии — редирект на /login');
    redirect('/login');
  }

  const currentUserId = session.user.id as string;
  const userEmail = session.user.email || 'unknown';
  const userRole = session.user.role;

  console.log(
    `👤 [projects/page] Пользователь вошёл: ${userEmail} (ID: ${currentUserId}, роль: ${userRole})`
  );

  let projects: ProjectWithRole[] = [];

  try {
    if (userRole === 'SUPER_ADMIN') {
      console.log('🔍 [projects/page] Загрузка всех проектов для SUPER_ADMIN...');

      const rawProjects = await prisma.project.findMany({
        where: { status: 'ACTIVE' },
        include: {
          _count: {
            select: {
              members: true,
              tasks: true,
            },
          },
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

      console.log(`✅ Найдено проектов: ${rawProjects.length}`);

      projects = rawProjects.map((project) => ({
        ...project,
        currentUserRole: 'SUPER_ADMIN' as const,
      }));
    } else {
      console.log(`🔍 [projects/page] Загрузка проектов для пользователя ${userEmail}...`);

      const userMemberships = await prisma.projectMembership.findMany({
        where: {
          userId: currentUserId,
          project: { status: 'ACTIVE' },
        },
        select: {
          role: true,
          project: {
            include: {
              _count: {
                select: {
                  members: true,
                  tasks: true,
                },
              },
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
        orderBy: {
          project: { name: 'asc' },
        },
      });

      console.log(`✅ Найдено членств в проектах: ${userMemberships.length}`);

      projects = userMemberships.map((membership) => ({
        ...membership.project,
        currentUserRole: membership.role,
      }));
    }
  } catch (error) {
    console.error('💥 [projects/page] ОШИБКА при загрузке проектов:', error);
    projects = [];
  }

  // Автоматический редирект, если только один проект
  if (userRole !== 'SUPER_ADMIN' && projects.length === 1) {
    const projectId = projects[0].id;
    console.log(`➡️ [projects/page] Только один проект — редирект в /tasks?projectId=${projectId}`);
    redirect(`/tasks?projectId=${projectId}`);
  }

  // Подсчёт проектов, где пользователь — владелец
  let userOwnedProjectsCount = 0;
  let canCreateProject = true;

  if (userRole !== 'SUPER_ADMIN') {
    try {
      userOwnedProjectsCount = await prisma.projectMembership.count({
        where: {
          userId: currentUserId,
          role: 'PROJECT_OWNER',
          project: { status: 'ACTIVE' },
        },
      });

      canCreateProject = userOwnedProjectsCount < 3;
      console.log(
        `📊 Пользователь владеет ${userOwnedProjectsCount}/3 проектами → может создать: ${canCreateProject}`
      );
    } catch (error) {
      console.error('💥 Ошибка при подсчёте проектов владельца:', error);
      canCreateProject = false;
    }
  } else {
    console.log('👑 SUPER_ADMIN — может создавать проекты без ограничений');
  }

  console.log(`🎯 [projects/page] Рендерим страницу с ${projects.length} проектами`);

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
