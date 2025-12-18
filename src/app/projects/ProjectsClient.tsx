// ФАЙЛ: src/app/project-select/ProjectSelectorClient.tsx
// ✅ СТАРЫЙ ДИЗАЙН + SYSTEM_USER + ЛИМИТЫ + РОЛИ В ПРОЕКТЕ

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string; // ✅ cuid() = string
  name: string;
  description: string | null;
  owner: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  _count: {
    userProjects: number;
    Task: number; // ✅ Prisma naming
  };
  userProjectRole?: string; // Опционально для SUPER_ADMIN
}

interface ProjectSelectorProps {
  projects: Project[];
  userRole: string;
  userName: string;
  canCreateProject: boolean;
  userOwnedProjectsCount: number;
}

export default function ProjectSelectorClient({
  projects,
  userRole,
  userName,
  canCreateProject,
  userOwnedProjectsCount,
}: ProjectSelectorProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleProjectSelect = async () => {
    if (!selectedProject) return;
    setIsLoading(true);
    try {
      router.push(`/tasks?projectId=${selectedProject}`);
    } catch (error) {
      console.error('Ошибка при выборе проекта:', error);
      alert('Не получилось перейти к проекту');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = () => {
    if (!canCreateProject) {
      alert(`Лимит проектов: ${userOwnedProjectsCount}/3`);
      return;
    }
    router.push('/admin/projects/create');
  };

  // ✅ Роль в проекте
  const getProjectRoleDisplay = (role?: string) => {
    if (!role) return '—';
    switch (role) {
      case 'PROJECT_LEAD':
        return '👑 Руководитель';
      case 'PROJECT_MEMBER':
        return '👤 Участник';
      default:
        return role;
    }
  };

  // ✅ Глобальная роль
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return '🔧 Супер-администратор';
      case 'SYSTEM_USER':
        return '📝 Новый пользователь';
      case 'PROJECT_LEAD':
        return '👨‍💼 Руководитель';
      case 'PROJECT_MEMBER':
        return '👥 Участник';
      default:
        return role;
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Заголовок — СТАРЫЙ ДИЗАЙН */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Добро пожаловать, {userName}!</h1>
          <p className="text-gray-600">Выберите проект для работы</p>
          <div className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mt-2">
            {getRoleDisplay(userRole)}
          </div>
        </div>

        {/* 0 ПРОЕКТОВ — НОВЫЕ СЦЕНАРИИ */}
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет доступных проектов</h3>

            {userRole === 'SUPER_ADMIN' ? (
              <div className="space-y-3">
                <p className="text-gray-600">Перейдите в админ-панель</p>
                <button
                  onClick={() => router.push('/admin')}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  В админ-панель
                </button>
              </div>
            ) : canCreateProject ? (
              <div className="space-y-3">
                <p className="text-gray-600">Создайте свой первый проект (лимит: 3)</p>
                <button
                  onClick={handleCreateProject}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  ✨ Создать первый проект
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-600">Лимит проектов ({userOwnedProjectsCount}/3)</p>
                <button
                  disabled
                  className="px-6 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed opacity-50"
                >
                  Лимит: {userOwnedProjectsCount}/3
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Список проектов — СТАРЫЙ ДИЗАЙН */}
            <div className="space-y-4 mb-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedProject === project.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedProject(project.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {/* ✅ НОВОЕ: Роль в проекте */}
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {getProjectRoleDisplay(project.userProjectRole)}
                        </span>
                        <span>👥 {project._count.userProjects} участников</span>
                        <span>✅ {project._count.Task} задач</span>
                        <span className="truncate max-w-[140px]">
                          👨‍💼 {project.owner.firstName || project.owner.email}
                        </span>
                      </div>
                    </div>

                    {/* Кружок "выбран" — СТАРЫЙ ДИЗАЙН */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedProject === project.id
                          ? 'bg-purple-500 border-purple-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedProject === project.id && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Кнопка "Перейти к проекту" — СТАРЫЙ ДИЗАЙН */}
            <button
              onClick={handleProjectSelect}
              disabled={!selectedProject || isLoading}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Переход...
                </div>
              ) : (
                'Перейти к проекту'
              )}
            </button>

            {/* Кнопка создания — НОВЫЕ СЦЕНАРИИ */}
            {(userRole === 'SUPER_ADMIN' || canCreateProject) && (
              <div className="text-center">
                <button
                  onClick={handleCreateProject}
                  disabled={!canCreateProject}
                  className={`text-sm font-medium transition-colors ${
                    !canCreateProject
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-purple-600 hover:text-purple-800'
                  }`}
                  title={!canCreateProject ? `Лимит: ${userOwnedProjectsCount}/3` : ''}
                >
                  {canCreateProject ? 'Создать новый проект' : `Лимит: ${userOwnedProjectsCount}/3`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
