// src/app/project-select/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProjectSelectorClient from './ProjectSelectorClient';

export default async function ProjectSelectPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  let projects;

  if (session.user.role === 'SUPER_ADMIN') {
    // Супер-админ видит все активные проекты
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
    // Обычный пользователь видит только свои проекты
    const userProjects = await prisma.userProject.findMany({
      where: {
        userId: parseInt(session.user.id),
        project: {
          status: 'ACTIVE',
        },
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
            _count: {
              select: {
                tasks: true,
                userProjects: true,
              },
            },
          },
        },
      },
    });

    projects = userProjects.map((up) => up.project);
  }

  // ===== ВАЖНО: Автоматический редирект если 0 или 1 проект =====
  if (projects.length === 0) {
    redirect('/no-projects');
  } else if (projects.length === 1) {
    // Если только один проект - автоматически перенаправляем на tasks
    redirect(`/tasks?projectId=${projects[0].id}`);
  }

  // Если больше одного проекта - показываем выбор
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
      <ProjectSelectorClient
        projects={projects}
        userRole={session.user.role}
        userName={session.user.name || ''}
      />
    </div>
  );
}
