// src/app/admin/users/create/page.tsx
// ПОЛНОСТЬЮ ИСПРАВЛЕННЫЙ ФАЙЛ
// Почему исправлен (объяснение как новичку):
// 1. Маршрут /api/projects/select — удалён (как рекомендовал ранее), он был опасен (возвращал все проекты без фильтрации по роли).
//    Вместо него используем основной /api/projects (GET) — он безопасно фильтрует проекты по роли пользователя (SUPER_ADMIN видит все).
//    Это лучшая практика продакшена: один канонический API для списка проектов (без дубликатов и утечек данных).
// 2. localStorage для currentProject — временное решение, ненадёжно (очищается, не синхронизируется).
//    Заменено на запрос к /api/projects (без параметров — вернёт доступные проекты для текущего пользователя).
//    Для SUPER_ADMIN — все проекты, выбираем первый (или можно добавить селект для выбора проекта).
//    Если проектов нет — показываем ошибку (по PRD SUPER_ADMIN может создавать проекты).
// 3. Добавлены dev-логи (process.env.NODE_ENV === 'development') — для отладки, в проде не засоряют консоль.
// 4. Улучшена обработка ошибок и loading.
// 5. Если проектов несколько — пока берём первый (можно доработать селект позже).
// 6. Нет зависимости от localStorage — безопасно и надёжно.

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserForm } from '@/components/forms/UserForm';
import { UserFormDataWithGroups } from '@/schemas/user';

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState<{ id: string; name: string } | null>(null);

  // Загружаем доступные проекты через безопасный API /api/projects (фильтрует по роли)
  useEffect(() => {
    async function fetchProjects() {
      try {
        setProjectsLoading(true);

        const response = await fetch('/api/projects'); // Без параметров — вернёт доступные проекты (для SUPER_ADMIN — все)

        if (!response.ok) {
          throw new Error('Не удалось загрузить проекты');
        }

        const data = await response.json();

        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 [CreateUserPage] Получены проекты из /api/projects:', data.projects);
        }

        if (data.projects && data.projects.length > 0) {
          // Берём первый проект (для SUPER_ADMIN — первый из всех)
          // Позже можно добавить <select> для выбора проекта
          const project = data.projects[0];
          setCurrentProject({
            id: project.id.toString(),
            name: project.name,
          });
        } else {
          // Нет проектов — SUPER_ADMIN может создать, но для создания пользователя нужен проект
          setError('Нет доступных проектов. Сначала создайте проект в /admin/projects/create');
        }
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки проектов');
        if (process.env.NODE_ENV === 'development') {
          console.error('💥 [CreateUserPage] Ошибка загрузки проектов:', err);
        }
      } finally {
        setProjectsLoading(false);
      }
    }

    fetchProjects();
  }, []);

  const handleSubmit = async (data: UserFormDataWithGroups) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== [CreateUserPage] HANDLE SUBMIT ВЫЗВАН ===');
      console.log('Данные формы:', data);
      console.log('Выбранный проект:', currentProject);
    }

    try {
      setLoading(true);
      setError(null);

      if (!currentProject) {
        throw new Error('Проект не выбран. Сначала создайте или выберите проект.');
      }

      const userData = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || undefined,
        phone: data.phone || undefined,
        avatar: data.avatar || undefined,
        role: data.role,
        projectId: parseInt(currentProject.id),
        scope: data.scope,
        visibleGroups: data.visibleGroups?.map((id) => parseInt(id)) || [],
        isActive: data.isActive,
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('📤 [CreateUserPage] Данные для API /api/users:', userData);
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('📨 [CreateUserPage] Ответ сервера:', response.status, response.statusText);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка создания пользователя');
      }

      const result = await response.json();

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [CreateUserPage] Пользователь создан:', result);
      }

      alert('Пользователь успешно создан и добавлен в проект!');

      router.push('/admin/users');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Неизвестная ошибка');
      if (process.env.NODE_ENV === 'development') {
        console.error('💥 [CreateUserPage] Ошибка создания пользователя:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 mb-4"
          >
            ← Назад к списку пользователей
          </button>

          <h1 className="text-3xl font-bold text-gray-900">Создание пользователя</h1>
          <p className="mt-2 text-sm text-gray-600">
            Заполните форму для создания пользователя
            {currentProject && ` (будет добавлен в проект: ${currentProject.name})`}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            <strong>Ошибка:</strong> {error}
            <button onClick={() => setError(null)} className="mt-2 ml-4 text-sm underline">
              Скрыть
            </button>
          </div>
        )}

        {projectsLoading ? (
          <div className="text-center py-12">Загрузка проектов...</div>
        ) : !currentProject ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 text-yellow-800">
            <strong>Внимание:</strong> Нет доступных проектов. Создайте проект в разделе "Проекты"
            перед созданием пользователя.
          </div>
        ) : (
          <UserForm
            onSubmit={handleSubmit}
            loading={loading}
            currentProjectId={currentProject.id}
            currentProjectName={currentProject.name}
          />
        )}
      </div>
    </div>
  );
}
