// src/app/projects/ProjectsClient.tsx

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Project {
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
}

interface ProjectSelectorProps {
  projects: Project[];
  userRole: 'SUPER_ADMIN' | 'USER';
  userName: string;
  canCreateProject: boolean;
  userOwnedProjectsCount: number;
}

export default function ProjectsClient({
  projects,
  userRole,
  userName,
  canCreateProject,
  userOwnedProjectsCount,
}: ProjectSelectorProps) {
  const router = useRouter();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects.length === 1 ? projects[0].id : null
  );
  const [isLoading, setIsLoading] = useState(false);

  if (process.env.NODE_ENV === 'development' && projects.length === 1) {
    console.log('🎯 [ProjectsClient] Авто-выбор первого проекта:', projects[0].id);
  }

  const handleGoToProject = () => {
    if (!selectedProjectId) return;
    setIsLoading(true);
    router.push(`/tasks?projectId=${selectedProjectId}`);
  };

  const handleCreateProject = () => {
    if (!canCreateProject && userRole !== 'SUPER_ADMIN') {
      alert(`Лимит проектов: ${userOwnedProjectsCount}/3`);
      return;
    }
    router.push('/admin/projects/create');
  };

  const getProjectRoleDisplay = (role: Project['currentUserRole']) => {
    switch (role) {
      case 'PROJECT_OWNER':
        return '👑 Владелец';
      case 'PROJECT_ADMIN':
        return '🔧 Администратор';
      case 'PROJECT_MEMBER':
        return '👤 Участник';
      case 'SUPER_ADMIN':
        return '🛡️ Супер-админ';
      default:
        return '👤 Участник';
    }
  };

  const getUserRoleDisplay = (role: 'SUPER_ADMIN' | 'USER') => {
    return role === 'SUPER_ADMIN' ? '🔧 Супер-администратор' : '📝 Пользователь';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Добро пожаловать, {userName}!</h1>
          <p className="text-gray-600">Выберите проект для работы</p>
          <div className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mt-2">
            {getUserRoleDisplay(userRole)}
          </div>
        </div>

        {/* Список проектов или сообщение о пустом списке */}
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">У вас пока нет проектов</h3>
            <p className="text-gray-600 mb-6">
              Создайте свой первый проект или попросите приглашение
            </p>

            {userRole === 'SUPER_ADMIN' ? (
              <button
                onClick={() => router.push('/admin')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                aria-label="Перейти в админ-панель"
              >
                В админ-панель
              </button>
            ) : canCreateProject ? (
              <button
                onClick={handleCreateProject}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                aria-label="Создать первый проект"
              >
                ✨ Создать первый проект
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Лимит проектов достигнут ({userOwnedProjectsCount}/3)
                </p>
                <button
                  disabled
                  className="px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed opacity-50"
                  aria-label="Лимит проектов достигнут"
                >
                  Лимит: {userOwnedProjectsCount}/3
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Список карточек проектов */}
            <div className="space-y-4 mb-8">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={cn(
                    'p-4 border-2 rounded-lg cursor-pointer transition-all duration-200',
                    selectedProjectId === project.id
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  )}
                  onClick={() => setSelectedProjectId(project.id)}
                  role="radio"
                  aria-checked={selectedProjectId === project.id}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedProjectId(project.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-600">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                          {getProjectRoleDisplay(project.currentUserRole)}
                        </span>
                        <span>👥 {project._count.members} участников</span>
                        <span>✅ {project._count.tasks} задач</span>
                        <span className="truncate max-w-[160px]">
                          👨‍💼 Владелец: {project.owner.firstName || project.owner.email}
                        </span>
                      </div>
                    </div>

                    {/* Радио-кнопка */}
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200',
                        selectedProjectId === project.id
                          ? 'bg-purple-600 border-purple-600'
                          : 'border-gray-300'
                      )}
                      aria-hidden="true"
                    >
                      {selectedProjectId === project.id && (
                        <div className="w-2.5 h-2.5 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Кнопка "Перейти к проекту" */}
            <button
              onClick={handleGoToProject}
              disabled={!selectedProjectId || isLoading}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6 flex items-center justify-center gap-2"
              aria-label={selectedProjectId ? 'Перейти к выбранному проекту' : 'Выберите проект'}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Переход...
                </>
              ) : (
                'Перейти к проекту'
              )}
            </button>

            {/* Кнопка "Создать новый проект" */}
            <div className="text-center">
              {userRole === 'SUPER_ADMIN' || canCreateProject ? (
                <button
                  onClick={handleCreateProject}
                  className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
                  aria-label="Создать новый проект"
                >
                  Создать новый проект
                </button>
              ) : (
                <p className="text-sm text-gray-500">
                  Лимит проектов достигнут ({userOwnedProjectsCount}/3)
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
