// src/app/projects/ProjectsClient.tsx

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  maxAllowedProjects: number;
  errorParams?: {
    error: string;
    owned: string;
    max: string;
  } | null;
}

export default function ProjectsClient({
  projects = [],
  userRole,
  userName,
  canCreateProject,
  userOwnedProjectsCount,
  maxAllowedProjects,
  errorParams,
}: ProjectSelectorProps) {
  const router = useRouter();

  const projectsArray = useMemo(() => (Array.isArray(projects) ? projects : []), [projects]);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projectsArray.length === 1 ? projectsArray[0]?.id || null : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 [ProjectsClient] Получены props:', {
        projectsCount: projectsArray.length,
        userRole,
        userName,
        canCreateProject,
        userOwnedProjectsCount,
        maxAllowedProjects,
        errorParams,
      });
    }
  }, [
    projectsArray,
    userRole,
    userName,
    canCreateProject,
    userOwnedProjectsCount,
    maxAllowedProjects,
    errorParams,
  ]);

  useEffect(() => {
    let errorTimer: NodeJS.Timeout;
    let infoTimer: NodeJS.Timeout;

    const handleError = () => {
      if (errorParams?.error === 'project_limit_reached') {
        const message = `Достигнут лимит проектов. У вас уже ${errorParams.owned} из ${errorParams.max} возможных проектов.`;

        errorTimer = setTimeout(() => {
          setErrorMessage(message);
          setInfoMessage(
            'Для создания нового проекта передайте владение одним из существующих проектов.'
          );
        }, 0);

        infoTimer = setTimeout(() => {
          setInfoMessage(null);
        }, 5000);
      }
    };

    handleError();

    return () => {
      if (errorTimer) clearTimeout(errorTimer);
      if (infoTimer) clearTimeout(infoTimer);
    };
  }, [errorParams]);

  const handleGoToProject = useCallback(() => {
    if (!selectedProjectId) {
      const errorTimer = setTimeout(() => {
        setErrorMessage('Пожалуйста, выберите проект');
      }, 0);

      const clearTimer = setTimeout(() => {
        setErrorMessage(null);
      }, 3000);

      return () => {
        clearTimeout(errorTimer);
        clearTimeout(clearTimer);
      };
    }

    setIsLoading(true);
    router.push(`/tasks?projectId=${selectedProjectId}`);
  }, [selectedProjectId, router]);

  const handleCreateProject = useCallback(async () => {
    setIsCreating(true);
    const createPath = '/projects/create';
    router.push(createPath);
  }, [router]);

  const getProjectRoleDisplay = useCallback((role: Project['currentUserRole']) => {
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
  }, []);

  const getUserRoleDisplay = useCallback((role: 'SUPER_ADMIN' | 'USER') => {
    return role === 'SUPER_ADMIN' ? '🛡️ Супер-админ' : '👤 Пользователь';
  }, []);

  const handleProjectSelect = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, projectId: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleProjectSelect(projectId);
      }
    },
    [handleProjectSelect]
  );

  // Функция для отображения счетчика проектов
  const renderProjectCounter = () => {
    // Супер-админы не ограничены
    if (userRole === 'SUPER_ADMIN') {
      return (
        <div className="text-sm text-purple-600 mt-2">
          <span className="inline-flex items-center gap-1">
            Неограниченное количество и доступ ко всем проектам
          </span>
        </div>
      );
    }

    // Пользователь достиг лимита
    if (!canCreateProject) {
      return null;
    }
    return (
      <div className={`text-sm text-purple-600 mt-2`}>
        <span className="inline-flex items-center gap-1">
          Доступно проектов: {userOwnedProjectsCount}/{maxAllowedProjects}
        </span>
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Ограничение</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>{errorMessage}</p>
                {infoMessage && (
                  <p className="mt-2 text-sm text-blue-700 bg-blue-50 p-2 rounded">
                    💡 {infoMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Добро пожаловать, {userName}!</h1>
          <p className="text-gray-600">Выберите проект для работы</p>
          <div className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mt-2">
            {getUserRoleDisplay(userRole)}
          </div>

          {renderProjectCounter()}
        </div>

        {projectsArray.length === 0 ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">У вас пока нет проектов</h3>
            <p className="text-gray-600 mb-6">
              Создайте свой первый проект или попросите приглашение
            </p>

            {canCreateProject ? (
              <div className="space-y-4">
                <button
                  onClick={handleCreateProject}
                  disabled={isCreating}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Создать первый проект"
                >
                  {isCreating ? (
                    <>
                      <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Переход...
                    </>
                  ) : (
                    '✨ Создать первый проект'
                  )}
                </button>
                {/* Информация о лимите для первого проекта */}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Лимит проектов достигнут ({userOwnedProjectsCount}/{maxAllowedProjects})
                </p>
                <button
                  disabled
                  className="px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed opacity-50"
                  aria-label="Лимит проектов достигнут"
                >
                  Лимит: {userOwnedProjectsCount}/{maxAllowedProjects}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {projectsArray.map((project) => (
                <div
                  key={project.id}
                  className={cn(
                    'p-4 border-2 rounded-lg cursor-pointer transition-all duration-200',
                    selectedProjectId === project.id
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  )}
                  onClick={() => handleProjectSelect(project.id)}
                  role="radio"
                  aria-checked={selectedProjectId === project.id}
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, project.id)}
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

            <button
              onClick={handleGoToProject}
              disabled={!selectedProjectId || isLoading}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4 flex items-center justify-center gap-2"
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

            <div className="text-center">
              {canCreateProject ? (
                <div className="space-y-2">
                  <button
                    onClick={handleCreateProject}
                    disabled={isCreating}
                    className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 mx-auto"
                    aria-label="Создать новый проект"
                  >
                    {isCreating ? (
                      <>
                        <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        Переход...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Создать новый проект
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-red-600 cursor-default mx-auto">
                    Лимит проектов достигнут ({userOwnedProjectsCount}/{maxAllowedProjects})
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
