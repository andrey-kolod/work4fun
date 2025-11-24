// src/app/dashboard/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardService } from '@/lib/services/dashboardService';
import { DashboardClient } from './DashboardClient';
import { cookies } from 'next/headers';
import { Project } from '@/types/dashboard';

export default async function DashboardPage(props: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth/login');
  }

  // 🔧 Ожидаем searchParams
  const { projectId } = await props.searchParams;

  const dashboardService = new DashboardService();
  const userProjects = await dashboardService.getUserProjects(
    parseInt(session.user.id),
    session.user.role
  );

  if (userProjects.length === 0) {
    redirect('/project-select');
  }

  const cookieStore = await cookies();
  const selectedProjectId = getSelectedProjectId(userProjects, projectId, cookieStore);

  const dashboardData = await dashboardService.getDashboardData(
    selectedProjectId,
    parseInt(session.user.id),
    session.user.role
  );

  // 🔧 Приводим типы к нужному формату
  const typedUserProjects: Project[] = userProjects.map((project) => ({
    ...project,
    owner: {
      email: project.owner.email,
      firstName: project.owner.firstName,
      lastName: project.owner.lastName,
    },
  }));

  return (
    <DashboardClient
      dashboardData={dashboardData}
      userProjects={typedUserProjects}
      userRole={session.user.role}
      userName={session.user.name || ''}
      currentProjectId={selectedProjectId}
    />
  );
}

function getSelectedProjectId(
  userProjects: any[],
  urlProjectId: string | undefined,
  cookies: any
): number {
  console.log('🔍 Поиск проекта:', {
    urlProjectId,
    cookieProjectId: cookies.get('selectedProjectId')?.value,
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

  const firstProjectId = userProjects[0].id;
  console.log(`🎯 Project selected as first available: ${firstProjectId}`);
  return firstProjectId;
}
