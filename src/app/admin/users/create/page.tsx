// src/app/admin/users/create/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserForm } from '@/components/forms/UserForm';
import { UserFormDataWithGroups } from '@/schemas/user';

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<{ id: string; name: string } | null>(null);

  // Получаем текущий проект админа
  useEffect(() => {
    fetchCurrentProject();
  }, []);

  const fetchCurrentProject = async () => {
    try {
      // Получаем текущий выбранный проект админа
      const storedProject = localStorage.getItem('currentProject');

      if (storedProject) {
        const project = JSON.parse(storedProject);
        setCurrentProject({
          id: project.id.toString(),
          name: project.name,
        });
      } else {
        // Если нет в localStorage, получаем первый доступный проект
        const response = await fetch('/api/projects/select');
        if (response.ok) {
          const data = await response.json();
          if (data.projects && data.projects.length > 0) {
            const project = data.projects[0];
            setCurrentProject({
              id: project.id.toString(),
              name: project.name,
            });
            localStorage.setItem('currentProject', JSON.stringify(project));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching current project:', error);
    }
  };

  const handleSubmit = async (data: UserFormDataWithGroups) => {
    console.log('=== HANDLE SUBMIT ВЫЗВАН ===');
    console.log('Данные из формы:', data);
    console.log('Текущий проект:', currentProject);

    try {
      setLoading(true);
      setError(null);

      if (!currentProject) {
        throw new Error('Не удалось определить текущий проект');
      }

      // Подготовка данных для API - ПРАВИЛЬНЫЙ ФОРМАТ
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

      console.log('Данные для отправки в API:', userData);

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('Ответ сервера:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Ошибка сервера:', errorData);
        throw new Error(errorData.error || 'Ошибка при создании пользователя');
      }

      const result = await response.json();
      console.log('Успешный ответ от сервера:', result);

      alert('Пользователь успешно создан и добавлен в проект!');

      // Возвращаемся на страницу пользователей
      router.push('/admin/users');
      router.refresh();
    } catch (error) {
      console.error('Error creating user:', error);
      setError((error as Error).message || 'Произошла неизвестная ошибка');
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
            Заполните форму ниже чтобы создать нового пользователя в системе
            {currentProject && ` (будет добавлен в проект: ${currentProject.name})`}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-700">
              <strong>Ошибка:</strong> {error}
            </div>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Скрыть
            </button>
          </div>
        )}

        {!currentProject ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Не выбран проект</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Для создания пользователя необходимо сначала выбрать проект. Перейдите в нужный
                    проект и создавайте пользователя оттуда.
                  </p>
                </div>
              </div>
            </div>
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
