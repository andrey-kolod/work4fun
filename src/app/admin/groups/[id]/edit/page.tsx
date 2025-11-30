// src/app/admin/groups/[id]/edit/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Project {
  id: number;
  name: string;
}

interface GroupData {
  name: string;
  description: string;
  projectId: string;
}

export default function EditGroupPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [loading, setLoading] = useState(true); // Начинаем с загрузки
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<GroupData>({
    name: '',
    description: '',
    projectId: '',
  });

  // Загружаем данные группы и проектов
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Параллельно загружаем проекты и данные группы
        const [projectsResponse, groupResponse] = await Promise.all([
          fetch('/api/projects'),
          fetch(`/api/groups/${groupId}`),
        ]);

        // Обрабатываем проекты
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData.projects || []);
        } else {
          console.error('Failed to fetch projects');
        }

        // Обрабатываем данные группы
        if (groupResponse.ok) {
          const groupData = await groupResponse.json();
          setFormData({
            name: groupData.group.name,
            description: groupData.group.description || '',
            projectId: groupData.group.projectId.toString(),
          });
        } else {
          throw new Error('Группа не найдена');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Ошибка при загрузке данных группы');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.projectId) {
      setError('Название группы и проект обязательны для заполнения');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при обновлении группы');
      }

      // Успешно обновлено - переходим к списку групп
      router.push('/admin/groups');
    } catch (error) {
      console.error('Error updating group:', error);
      setError((error as Error).message || 'Произошла неизвестная ошибка');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Если данные еще загружаются, показываем индикатор
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 mb-4"
            >
              ← Назад к списку групп
            </button>

            <h1 className="text-3xl font-bold text-gray-900">Редактирование группы</h1>
          </div>

          <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Загрузка данных группы...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 mb-4"
          >
            ← Назад к списку групп
          </button>

          <h1 className="text-3xl font-bold text-gray-900">Редактирование группы</h1>
          <p className="mt-2 text-sm text-gray-600">Измените данные группы</p>
        </div>

        {/* Сообщение об ошибке */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Ошибка</h3>
                <div className="mt-1 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Форма редактирования группы */}
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Поле названия группы */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Название группы *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите название группы"
              />
            </div>

            {/* Поле описания */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Описание группы (необязательно)"
              />
            </div>

            {/* Выбор проекта (только чтение) */}
            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-1">
                Проект
              </label>
              <select
                id="projectId"
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
              >
                <option value="">Выберите проект</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Проект нельзя изменить после создания группы
              </p>
            </div>

            {/* Кнопки действий */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Сохранение...
                  </span>
                ) : (
                  'Сохранить изменения'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
