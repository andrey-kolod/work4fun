// src/app/dashboard/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardService } from '@/lib/services/dashboardService';
import { DashboardClient } from './DashboardClient';
import { cookies } from 'next/headers';
import { SimpleProject } from '@/types/project';

export default async function DashboardPage(props: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const { projectId } = await props.searchParams;

  const dashboardService = new DashboardService();
  const userProjectsRaw = await dashboardService.getUserProjects(
    parseInt(session.user.id),
    session.user.role
  );

  // 🔧 Преобразуем в SimpleProject
  const userProjects: SimpleProject[] = userProjectsRaw.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description ?? undefined, // null → undefined
    owner: {
      email: project.owner.email,
      firstName: project.owner.firstName,
      lastName: project.owner.lastName,
    },
  }));

  // Если нет проектов
  if (userProjects.length === 0) {
    return (
      <DashboardClient
        dashboardData={{
          taskStats: [],
          recentTasks: [],
          userCount: 0,
          groupCount: 0,
        }}
        userProjects={[]}
        userRole={session.user.role}
        userName={session.user.name || session.user.email || 'Пользователь'}
        currentProjectId={0}
      />
    );
  }

  const cookieStore = await cookies();
  const selectedProjectId = getSelectedProjectId(userProjectsRaw, projectId, cookieStore);

  const dashboardData = await dashboardService.getDashboardData(
    selectedProjectId,
    parseInt(session.user.id),
    session.user.role
  );

  // Добавляем информацию о проекте в данные
  const currentProject = userProjects.find((p) => p.id === selectedProjectId);
  if (currentProject) {
    dashboardData.project = currentProject;
  }

  return (
    <DashboardClient
      dashboardData={dashboardData}
      userProjects={userProjects}
      userRole={session.user.role}
      userName={session.user.name || session.user.email || 'Пользователь'}
      currentProjectId={selectedProjectId}
    />
  );
}

function getSelectedProjectId(
  userProjects: any[],
  urlProjectId: string | undefined,
  cookies: any
): number {
  console.log('🔍 Поиск проекта для дашборда:', {
    urlProjectId,
    cookieProjectId: cookies.get('selectedProjectId')?.value,
    availableProjects: userProjects.map((p) => ({ id: p.id, name: p.name })),
  });

  if (urlProjectId) {
    const projectId = parseInt(urlProjectId);
    const hasAccess = userProjects.some((project) => project.id === projectId);
    if (hasAccess) {
      console.log(`🎯 Project selected from URL: ${projectId}`);
      return projectId;
    }
    console.log(`⚠️ User doesn't have access to project from URL: ${projectId}`);
  }

  const cookieProjectId = cookies.get('selectedProjectId');
  if (cookieProjectId) {
    const projectId = parseInt(cookieProjectId.value);
    const hasAccess = userProjects.some((project) => project.id === projectId);
    if (hasAccess) {
      console.log(`🎯 Project selected from cookies: ${projectId}`);
      return projectId;
    }
    console.log(`⚠️ User doesn't have access to project from cookies: ${projectId}`);
  }

  if (userProjects.length > 0) {
    const firstProjectId = userProjects[0].id;
    console.log(`🎯 Project selected as first available: ${firstProjectId}`);
    return firstProjectId;
  }

  console.log(`⚠️ No projects available for user`);
  return 0;
}
