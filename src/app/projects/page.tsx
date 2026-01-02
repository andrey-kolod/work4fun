// src/app/projects/page.tsx

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PermissionService } from '@/lib/services/permissionService';
import ProjectsClient from './ProjectsClient';

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
  searchParams: Promise<{
    fromLogin?: string;
    error?: string;
    owned?: string;
    max?: string;
    direct?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);

  // Проверка авторизации
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
    // SUPER_ADMIN видит все проекты
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

      // SELECT
      //   p.*,
      //   (SELECT COUNT(*) FROM "ProjectMembership" pm WHERE pm."projectId" = p.id) as members_count,
      //   (SELECT COUNT(*) FROM "Task" t WHERE t."projectId" = p.id) as tasks_count,
      //   u."firstName", u."lastName", u.email
      // FROM "Project" p
      // LEFT JOIN "User" u ON p."ownerId" = u.id
      // WHERE p.status = 'ACTIVE'
      // ORDER BY p.name ASC;

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ [projects/page] Найдено проектов: ${rawProjects.length}`);
      }

      projects = rawProjects.map((project) => ({
        ...project,
        currentUserRole: 'SUPER_ADMIN' as const,
      }));
    } else {
      // Обычный пользователь видит только свои проекты
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

      // SELECT
      //   pm.role,
      //   p.*,
      //   (SELECT COUNT(*) FROM "ProjectMembership" pm2 WHERE pm2."projectId" = p.id) as members_count,
      //   (SELECT COUNT(*) FROM "Task" t WHERE t."projectId" = p.id) as tasks_count,
      //   u."firstName", u."lastName", u.email
      // FROM "ProjectMembership" pm
      // JOIN "Project" p ON pm."projectId" = p.id
      // LEFT JOIN "User" u ON p."ownerId" = u.id
      // WHERE pm."userId" = 'user-id-here'
      //   AND p.status = 'ACTIVE'
      // ORDER BY p.name ASC;

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

  // Получить параметры из URL
  const resolvedSearchParams = await searchParams;
  const fromLogin = resolvedSearchParams.fromLogin === 'true';
  const directAccess = resolvedSearchParams.direct === 'true';
  const errorType = resolvedSearchParams.error;
  const ownedProjectsParam = resolvedSearchParams.owned;
  const maxProjectsParam = resolvedSearchParams.max;

  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 [projects/page] Параметры:`, {
      fromLogin,
      directAccess,
      errorType,
      ownedProjectsParam,
      maxProjectsParam,
    });
  }

  const shouldRedirectToOneProject =
    userRole !== 'SUPER_ADMIN' && projects.length === 1 && (fromLogin || directAccess);

  if (shouldRedirectToOneProject) {
    const projectId = projects[0].id;
    if (process.env.NODE_ENV === 'development') {
      console.log(`➡️ [projects/page] Автоматический редирект в /tasks?projectId=${projectId}`);
      console.log(`   Причина: ${fromLogin ? 'после логина' : 'прямая ссылка'}`);
    }

    const tasksUrl = new URL('/tasks', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    tasksUrl.searchParams.set('projectId', projectId);

    if (errorType) tasksUrl.searchParams.set('error', errorType);
    if (ownedProjectsParam) tasksUrl.searchParams.set('owned', ownedProjectsParam);
    if (maxProjectsParam) tasksUrl.searchParams.set('max', maxProjectsParam);

    redirect(tasksUrl.toString());
  }

  let userOwnedProjectsCount = 0;
  let canCreateProject = false;
  let maxAllowedProjects = 3;

  try {
    const creationInfo = await PermissionService.getProjectCreationInfo(currentUserId);
    userOwnedProjectsCount = creationInfo.ownedCount;
    canCreateProject = creationInfo.canCreate;
    maxAllowedProjects = creationInfo.maxAllowed;

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `📊 [projects/page] Лимит проектов: ${userOwnedProjectsCount}/${maxAllowedProjects}`
      );
      console.log(`📊 [projects/page] Может создать проект: ${canCreateProject}`);
    }
  } catch (error) {
    console.error('💥 [projects/page] Ошибка получения лимита проектов:', error);
    if (ownedProjectsParam) {
      userOwnedProjectsCount = parseInt(ownedProjectsParam, 10) || 0;
    }
    if (maxProjectsParam) {
      maxAllowedProjects = parseInt(maxProjectsParam, 10) || 3;
    }
    canCreateProject = userOwnedProjectsCount < maxAllowedProjects;
  }

  const clientProps = {
    projects,
    userRole: userRole as 'SUPER_ADMIN' | 'USER',
    userName:
      (session.user as any).firstName || session.user.email?.split('@')[0] || 'Пользователь',
    canCreateProject,
    userOwnedProjectsCount,
    maxAllowedProjects,
    errorParams: errorType
      ? {
          error: errorType,
          owned: userOwnedProjectsCount.toString(),
          max: maxAllowedProjects.toString(),
        }
      : null,
  };

  if (process.env.NODE_ENV === 'development') {
    console.log(`🎯 [projects/page] Рендерим страницу с ${projects.length} проектами`);

    console.log(`📋 [projects/page] Статус автоматического редиректа:`);
    console.log(`   - Роль пользователя: ${userRole}`);
    console.log(`   - Количество проектов: ${projects.length}`);
    console.log(`   - Пришел с логина: ${fromLogin}`);
    console.log(`   - Прямая ссылка: ${directAccess}`);
    console.log(`   - Авторедирект: ${shouldRedirectToOneProject ? 'ДА' : 'НЕТ'}`);

    if (shouldRedirectToOneProject) {
      console.log(`   - Проект для редиректа: ${projects[0].id} - "${projects[0].name}"`);
    }
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4"
      role="main"
      aria-label="Страница выбора проектов"
    >
      <ProjectsClient {...clientProps} />
    </div>
  );
}
