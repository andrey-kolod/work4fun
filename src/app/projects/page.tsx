// path: src/app/projects/page.tsx
// ✅ SUPER_ADMIN видит ВСЕ проекты БЕЗ редиректа

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProjectClient from './ProjectsClient';

export default async function ProjectSelectPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  let projects: any[] = [];

  if (session.user.role === 'SUPER_ADMIN') {
    // 🔥 SUPER_ADMIN: видит ВСЕ проекты (НЕ редиректит!)
    projects = await prisma.project.findMany({
      where: { status: 'ACTIVE' },
      include: {
        _count: {
          select: {
            userProjects: true,
            Task: true,
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
  } else {
    // 🔥 ОБЫЧНЫЕ пользователи: через UserProject
    const userProjects = await prisma.userProject.findMany({
      where: {
        userId: session.user.id as string,
        project: { status: 'ACTIVE' },
      },
      select: {
        role: true,
        project: {
          include: {
            _count: {
              select: {
                userProjects: true,
                Task: true,
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
    });

    projects = userProjects.map((up) => ({
      ...up.project,
      userProjectRole: up.role,
    }));
  }

  // 🎯 РЕДИРЕКТ ТОЛЬКО ДЛЯ ОБЫЧНЫХ пользователей (НЕ SUPER_ADMIN!)
  if (session.user.role !== 'SUPER_ADMIN' && projects.length === 1) {
    redirect(`/tasks?projectId=${projects[0].id}`);
  }

  // 📊 ЛИМИТ проектов (только для обычных пользователей)
  const userOwnedProjectsCount = await prisma.project.count({
    where: {
      ownerId: session.user.id as string,
      status: 'ACTIVE',
    },
  });

  const canCreateProject = userOwnedProjectsCount < 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
      <ProjectClient
        projects={projects}
        userRole={session.user.role}
        userName={
          (session.user as any).firstName || session.user.email?.split('@')[0] || 'Пользователь'
        }
        canCreateProject={canCreateProject}
        userOwnedProjectsCount={userOwnedProjectsCount}
      />
    </div>
  );
}
