// src/app/admin/projects/create/page.tsx

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProjectForm } from '@/components/forms/ProjectForm';

export default async function AdminCreateProjectPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id as string;
  const userRole = session.user.role;

  // Только SUPER_ADMIN может создавать проекты через админку
  if (userRole !== 'SUPER_ADMIN') {
    redirect('/projects');
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`👑 [admin/projects/create] SUPER_ADMIN создает проект (ID: ${userId})`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Создание проекта (Админ)</h1>
          <p className="mt-2 text-gray-600">Создание проекта с правами администратора системы.</p>

          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
            <p className="text-sm text-purple-800">
              <strong>SUPER_ADMIN:</strong> Вы можете создавать неограниченное количество проектов.
            </p>
          </div>
        </div>

        {/* [ИСПРАВЛЕНИЕ] Только простые пропсы */}
        <div className="bg-white shadow-lg rounded-xl p-6 md:p-8">
          <ProjectForm
            redirectPath="/admin/projects" // Перенаправляем в админку проектов
            showCancelButton={true}
          />
        </div>
      </div>
    </div>
  );
}
