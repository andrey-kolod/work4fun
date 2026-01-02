// src/app/projects/create/page.tsx

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProjectForm } from '@/components/forms/ProjectForm';
import { PermissionService } from '@/lib/services/permissionService';

export default async function CreateProjectPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 [projects/create/page] Нет сессии — редирект на /login');
    }
    redirect('/login');
  }

  const userId = session.user.id as string;
  const userEmail = session.user.email || 'unknown';
  const userRole = session.user.role;

  if (process.env.NODE_ENV === 'development') {
    console.log(
      `👤 [projects/create/page] Пользователь: ${userEmail} (ID: ${userId}, роль: ${userRole})`
    );
  }

  const creationInfo = await PermissionService.getProjectCreationInfo(userId);

  if (!creationInfo.canCreate) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `🚫 [projects/create/page] Пользователь ${userId} не может создать проект:`,
        creationInfo.reason
      );
    }

    const params = new URLSearchParams({
      error: 'project_limit_reached',
      owned: creationInfo.ownedCount.toString(),
      max: creationInfo.maxAllowed.toString(),
    });

    redirect(`/projects?${params.toString()}`);
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ [projects/create/page] Пользователь ${userId} может создавать проект`);
    console.log(
      `📊 [projects/create/page] Проектов: ${creationInfo.ownedCount}/${creationInfo.maxAllowed}`
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4"
      role="main"
      aria-label="Создание нового проекта"
    >
      <div className="w-full max-w-3xl">
        <div className="mb-8 ">
          <h1 className="text-3xl font-bold text-gray-900">Создание нового проекта</h1>
          <p className="mt-2 text-gray-600">
            Заполните информацию. После создания вы станете владельцем проекта.
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-6 md:p-8">
          <ProjectForm redirectPath="/projects" showCancelButton={true} />
        </div>
      </div>
    </div>
  );
}
