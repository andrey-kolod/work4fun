// src/app/dashboard/DashboardClient.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { DashboardClientProps, Project, Task, TaskStat } from '@/types/dashboard';

export function DashboardClient({
  dashboardData,
  userProjects,
  userRole,
  userName,
  currentProjectId,
}: DashboardClientProps) {
  const [activeProjectId, setActiveProjectId] = useState(currentProjectId);
  const [dashboardDataState, setDashboardDataState] = useState(dashboardData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addToast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const dataCacheRef = useRef<Map<number, typeof dashboardData>>(new Map());
  const router = useRouter();

  // 🔧 Инициализируем кэш начальными данными
  useEffect(() => {
    if (currentProjectId && dashboardData) {
      dataCacheRef.current.set(currentProjectId, dashboardData);
    }
  }, [currentProjectId, dashboardData]);

  // 🔧 Функция сохранения проекта в cookies
  const saveProjectToCookies = async (projectId: number) => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedProjectId: projectId }),
      });

      if (!response.ok) {
        throw new Error('Не удалось сохранить настройки');
      }

      console.log(`💾 Project preference saved: ${projectId}`);
    } catch (err) {
      console.warn('⚠️ Не удалось сохранить проект в настройках:', err);
    }
  };

  // 🔧 Функция повторной попытки
  const handleRetry = useCallback(() => {
    if (error) {
      addToast({
        type: 'info',
        title: 'Повторная загрузка',
        description: 'Пытаемся загрузить данные снова...',
        duration: 3000,
      });
      handleProjectChange(activeProjectId);
    }
  }, [error, activeProjectId]);

  // 🔧 Функция очистки кэша
  const clearCache = useCallback(() => {
    const cacheSize = dataCacheRef.current.size;
    dataCacheRef.current.clear();

    addToast({
      type: 'info',
      title: 'Кэш очищен',
      description: `Удалено ${cacheSize} проектов из кэша`,
      duration: 3000,
    });

    console.log('🧹 Кэш данных очищен');
  }, [addToast]);

  // 🔧 Основная функция смены проекта
  const handleProjectChange = useCallback(
    async (projectId: number) => {
      if (projectId === activeProjectId) return;

      try {
        // 🚫 Отменяем предыдущий запрос
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        setActiveProjectId(projectId);
        setError(null);

        // 🔍 Проверяем кэш
        const cachedData = dataCacheRef.current.get(projectId);
        if (cachedData) {
          console.log(`📦 Используем кэшированные данные для проекта ${projectId}`);
          setDashboardDataState(cachedData);

          addToast({
            type: 'success',
            title: 'Данные загружены из кэша',
            description: `Проект "${userProjects.find((p: Project) => p.id === projectId)?.name}"`,
            duration: 3000,
          });

          await saveProjectToCookies(projectId);
          return;
        }

        setIsLoading(true);

        addToast({
          type: 'info',
          title: 'Загружаем данные...',
          description: `Проект "${userProjects.find((p: Project) => p.id === projectId)?.name}"`,
          duration: 0,
        });

        // 🎯 Создаем AbortController
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        // 🎯 Таймаут запроса
        const timeoutId = setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            throw new Error('Таймаут запроса: превышено время ожидания');
          }
        }, 10000);

        const response = await fetch(`/api/dashboard?projectId=${projectId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (signal.aborted) {
            addToast({
              type: 'warning',
              title: 'Запрос отменен',
              duration: 3000,
            });
            return;
          }

          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Ошибка ${response.status}`);
        }

        const newDashboardData = await response.json();
        dataCacheRef.current.set(projectId, newDashboardData);

        setDashboardDataState(newDashboardData);

        addToast({
          type: 'success',
          title: 'Данные загружены',
          description: `Проект "${
            userProjects.find((p: Project) => p.id === projectId)?.name
          }" успешно загружен`,
          duration: 4000,
        });

        await saveProjectToCookies(projectId);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          addToast({
            type: 'info',
            title: 'Запрос отменен',
            description: 'Вы выбрали другой проект',
            duration: 3000,
          });
          return;
        }

        console.error('❌ Ошибка при загрузке данных:', err);
        const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
        setError(errorMessage);

        setActiveProjectId(currentProjectId);

        addToast({
          type: 'error',
          title: 'Ошибка загрузки',
          description: errorMessage,
          duration: 6000,
        });
      } finally {
        abortControllerRef.current = null;
        setIsLoading(false);
      }
    },
    [activeProjectId, currentProjectId, userProjects, addToast],
  );

  // 🔧 Функция предзагрузки соседних проектов
  const preloadNextProject = useCallback(
    async (currentProjectId: number) => {
      const currentIndex = userProjects.findIndex((p: Project) => p.id === currentProjectId);
      if (currentIndex === -1) return;

      const projectsToPreload = [
        userProjects[currentIndex - 1]?.id,
        userProjects[currentIndex + 1]?.id,
      ].filter((id): id is number => id !== undefined);

      for (const projectId of projectsToPreload) {
        if (dataCacheRef.current.has(projectId)) continue;

        try {
          const response = await fetch(`/api/dashboard?projectId=${projectId}`);
          if (response.ok) {
            const data = await response.json();
            dataCacheRef.current.set(projectId, data);

            if (process.env.NODE_ENV === 'development') {
              console.log(`🔮 Предзагружены данные для проекта ${projectId}`);
            }
          }
        } catch (err) {
          console.log(`⚠️ Не удалось предзагрузить проект ${projectId}`);
        }
      }
    },
    [userProjects],
  );

  // 🔧 Вспомогательная функция для отображения имени пользователя
  const getUserDisplayName = (user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  }): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.firstName || user.lastName || user.email;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Заголовок с селектором проекта */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                Добро пожаловать, {userName}!
              </h1>

              <div className="flex items-center gap-4 mt-2">
                {/* Селектор проекта */}
                <div className="relative">
                  <select
                    value={activeProjectId}
                    onChange={(e) => {
                      const newProjectId = Number(e.target.value);
                      handleProjectChange(newProjectId);
                      preloadNextProject(newProjectId);
                    }}
                    disabled={isLoading}
                    className={`
                      px-3 py-2 border rounded-lg bg-white min-w-[200px]
                      transition-all duration-200 ease-in-out
                      ${
                        isLoading
                          ? 'border-gray-300 text-gray-400 cursor-not-allowed opacity-70'
                          : 'border-gray-300 hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer'
                      }
                      ${error ? 'border-red-300 ring-2 ring-red-100' : ''}
                    `}>
                    {userProjects.map((project: Project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                        {dataCacheRef.current.has(project.id) && ' ⚡'}
                      </option>
                    ))}
                  </select>

                  {isLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                    </div>
                  )}
                </div>

                {/* Информация о проекте */}
                <div className="flex items-center gap-3">
                  <span className="text-text-secondary">
                    Проект:{' '}
                    <span className="font-semibold text-primary">
                      {userProjects.find((p: Project) => p.id === activeProjectId)?.name}
                    </span>
                  </span>

                  {isLoading && (
                    <span className="flex items-center gap-1 text-sm text-blue-600 animate-pulse">
                      <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
                      загрузка...
                    </span>
                  )}

                  {!isLoading && dataCacheRef.current.has(activeProjectId) && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      ⚡ из кэша
                    </span>
                  )}
                </div>
              </div>

              {/* Отображение ошибок */}
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">⚠️</span>
                      <span>{error}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRetry}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm">
                        Повторить
                      </button>
                      <button
                        onClick={() => setError(null)}
                        className="text-red-500 hover:text-red-700 text-lg font-bold">
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Кнопка очистки кэша (только для разработки) */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={clearCache}
                className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                title="Очистить кэш данных">
                🧹
                <span className="hidden sm:inline">Очистить кэш</span>
              </button>
            )}
          </div>
        </div>

        {/* Демо тосты для тестирования (только для разработки) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Тест toast-уведомлений:</h4>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() =>
                  addToast({
                    type: 'success',
                    title: 'Успех!',
                    description: 'Операция выполнена успешно',
                  })
                }
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">
                ✅ Успех
              </button>
              <button
                onClick={() =>
                  addToast({
                    type: 'error',
                    title: 'Ошибка!',
                    description: 'Что-то пошло не так',
                  })
                }
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                ❌ Ошибка
              </button>
              <button
                onClick={() =>
                  addToast({
                    type: 'warning',
                    title: 'Предупреждение',
                    description: 'Будьте внимательны',
                  })
                }
                className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600">
                ⚠️ Предупреждение
              </button>
              <button
                onClick={() =>
                  addToast({
                    type: 'info',
                    title: 'Информация',
                    description: 'Это информационное сообщение',
                  })
                }
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                ℹ️ Информация
              </button>
            </div>
          </div>
        )}

        {/* Основной контент дашборда */}
        <div
          className={`
          transition-all duration-300 ease-in-out
          ${isLoading ? 'opacity-60 pointer-events-none' : 'opacity-100'}
        `}>
          {/* Карточки статистики */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-text-primary">Всего задач</h3>
                <span className="text-2xl">📋</span>
              </div>
              <p className="text-3xl font-bold text-primary">
                {dashboardDataState.taskStats.reduce(
                  (total: number, stat: TaskStat) => total + stat.count,
                  0,
                )}
              </p>
              <p className="text-sm text-text-secondary mt-1">в проекте</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-text-primary">Участники</h3>
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-3xl font-bold text-primary">{dashboardDataState.userCount}</p>
              <p className="text-sm text-text-secondary mt-1">пользователей</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-text-primary">Группы</h3>
                <span className="text-2xl">👪</span>
              </div>
              <p className="text-3xl font-bold text-primary">{dashboardDataState.groupCount}</p>
              <p className="text-sm text-text-secondary mt-1">рабочих групп</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-text-primary">Выполнено</h3>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-3xl font-bold text-primary">
                {dashboardDataState.taskStats.find((stat: TaskStat) => stat.status === 'DONE')
                  ?.count || 0}
              </p>
              <p className="text-sm text-text-secondary mt-1">завершённых задач</p>
            </div>
          </div>

          {/* Последние задачи */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-text-primary">Последние задачи</h3>
              <span className="text-sm text-text-secondary">
                {dashboardDataState.recentTasks.length} из{' '}
                {dashboardDataState.taskStats.reduce(
                  (total: number, stat: TaskStat) => total + stat.count,
                  0,
                )}
              </span>
            </div>
            <div className="space-y-3">
              {dashboardDataState.recentTasks.map((task: Task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-primary/30 hover:shadow-sm transition-all duration-200">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-text-primary truncate">{task.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-text-secondary">
                        {getUserDisplayName(task.creator)}
                      </p>
                      {task.group && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-text-secondary">{task.group.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span
                    className={`
                    px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-4
                    ${task.status === 'DONE' ? 'bg-green-100 text-green-800' : ''}
                    ${task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : ''}
                    ${task.status === 'TODO' ? 'bg-gray-100 text-gray-800' : ''}
                  `}>
                    {task.status === 'DONE' && '✅ '}
                    {task.status === 'IN_PROGRESS' && '🔄 '}
                    {task.status === 'TODO' && '📝 '}
                    {task.status}
                  </span>
                </div>
              ))}

              {dashboardDataState.recentTasks.length === 0 && (
                <div className="text-center py-8 text-text-secondary">
                  <div className="text-4xl mb-2">📝</div>
                  <p>В этом проекте пока нет задач</p>
                  <p className="text-sm mt-1">Создайте первую задачу чтобы начать работу</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
