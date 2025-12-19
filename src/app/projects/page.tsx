import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProjectClient from './ProjectsClient';
import type { Project, ProjectMembership } from '@prisma/client';

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
    redirect('/login');
  }

  const currentUserId = session.user.id as string;
  let projects: ProjectWithRole[] = [];

  if (session.user.role === 'SUPER_ADMIN') {
    // SUPER_ADMIN видит все проекты
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

    // Добавляем роль SUPER_ADMIN ко всем проектам (Prisma уже возвращает _count)
    projects = rawProjects.map(
      (project): ProjectWithRole => ({
        ...project,
        currentUserRole: 'SUPER_ADMIN' as const,
      })
    );
  } else {
    // Обычный пользователь — только свои проекты через ProjectMembership
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

    // Формируем массив проектов с ролью (Prisma уже возвращает _count)
    projects = userMemberships.map(
      (membership): ProjectWithRole => ({
        ...membership.project,
        currentUserRole: membership.role,
      })
    );
  }

  // Автоматический редирект, если только один проект
  if (session.user.role !== 'SUPER_ADMIN' && projects.length === 1) {
    redirect(`/tasks?projectId=${projects[0].id}`);
  }

  // Подсчёт своих проектов (где пользователь — владелец) и проверка лимита
  let userOwnedProjectsCount = 0;
  let canCreateProject = true;

  if (session.user.role !== 'SUPER_ADMIN') {
    userOwnedProjectsCount = await prisma.projectMembership.count({
      where: {
        userId: currentUserId,
        role: 'PROJECT_OWNER',
        project: { status: 'ACTIVE' },
      },
    });

    canCreateProject = userOwnedProjectsCount < 3;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
      <ProjectClient
        projects={projects}
        userRole={session.user.role as 'SUPER_ADMIN' | 'USER'}
        userName={
          (session.user as any).firstName || session.user.email?.split('@')[0] || 'Пользователь'
        }
        canCreateProject={canCreateProject}
        userOwnedProjectsCount={userOwnedProjectsCount}
      />
    </div>
  );
}
