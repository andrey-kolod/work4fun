// ФАЙЛ: src/app/project-select/page.tsx
// НАЗНАЧЕНИЕ: Серверная страница выбора проекта

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProjectSelectorClient from './ProjectSelectorClient';

export default async function ProjectSelectPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  let projects: any[] = [];

  if (session.user.role === 'SUPER_ADMIN') {
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
    const userProjects = await prisma.userProject.findMany({
      where: {
        userId: session.user.id as string,
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

  if (projects.length === 0) {
    redirect('/no-projects');
  } else if (projects.length === 1) {
    redirect(`/tasks?projectId=${projects[0].id}`);
  }

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
