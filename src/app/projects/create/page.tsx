// src/app/projects/create/page.tsx
// МЕНЯЕМ ТОЛЬКО div с фоном

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProjectForm } from '@/components/forms/ProjectForm';
import { PermissionService } from '@/lib/services/permissionService';

export default async function CreateProjectPage() {
  const session = await getServerSession(authOptions);

  // Если сессия не получена — редирект на логин
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

  // Проверка лимита проектов
  const creationInfo = await PermissionService.getProjectCreationInfo(userId);

  if (!creationInfo.canCreate) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `🚫 [projects/create/page] Пользователь ${userId} не может создать проект:`,
        creationInfo.reason
      );
    }

    // Редирект с параметрами ошибки
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
    // ⚠️ ИЗМЕНЯЕМ ЭТОТ DIV - такой же фон как на /projects
    <div
      className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4"
      role="main"
      aria-label="Создание нового проекта"
    >
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Создание нового проекта</h1>
          <p className="mt-2 text-gray-600">
            Заполните информацию. После создания вы станете владельцем (PROJECT_OWNER).
          </p>

          {/* Информация о лимите проектов */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  <strong>Ваш лимит проектов:</strong> {creationInfo.ownedCount} из{' '}
                  {creationInfo.maxAllowed} возможных
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Лимит считается по проектам, где вы являетесь владельцем (PROJECT_OWNER)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-6 md:p-8">
          <ProjectForm redirectPath="/projects" showCancelButton={true} />
        </div>
      </div>
    </div>
  );
}
