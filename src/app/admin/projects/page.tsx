// src/app/admin/projects/page.tsx

'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { useAdminProjects } from '@/hooks/useAdminProjects';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 500); // Debounce 500ms — запросы не спамят сервер

  const { projects, pagination, isLoading, isError, error } = useAdminProjects(page, 10, search);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8 text-red-600">
        Ошибка: {error?.message || 'Неизвестная ошибка'}
      </div>
    );
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(
      `🎨 [AdminProjectsPage] Рендер: ${projects.length} проектов (всего ${pagination.total}), страница ${page}, поиск "${search}"`
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Проекты</h1>
          <p className="text-gray-600 mt-1">Всего проектов: {pagination.total}</p>{' '}
          {/* ИСПРАВЛЕНИЕ: total вместо totalItems */}
        </div>
        <Link
          href="/admin/projects/create"
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          Создать проект
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPage(1); // Сброс страницы при новом поиске (без эффекта — нет ошибки cascading renders)
            if (process.env.NODE_ENV === 'development') {
              console.log(
                `🔍 [AdminProjectsPage] Поиск: "${e.target.value}" → сброс страницы на 1`
              );
            }
          }}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label="Поиск проектов по названию"
        />
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {search ? 'Ничего не найдено по запросу' : 'Нет проектов. Создайте первый!'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          {' '}
          {/* Горизонтальный скролл на мобильном — таблица не ломается */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Название
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Описание
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Владелец
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Задачи
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Участники
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="hover:text-purple-600 transition-colors"
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="line-clamp-2">
                        {' '}
                        {/* Обрезка по строкам (2 строки) — текст ровный */}
                        {project.description || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {' '}
                      {/* Выравнивание по верху для многострочного владельца */}
                      <div className="text-sm text-gray-900">
                        {[project.owner.firstName || '', project.owner.lastName || '']
                          .join(' ')
                          .trim() || 'Нет имени'}
                      </div>
                      <div className="text-sm text-gray-500">{project.owner.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          project.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {project.status === 'ACTIVE' ? 'Активен' : 'Архивирован'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project._count.tasks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project._count.members}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="text-purple-600 hover:text-purple-800 transition-colors"
                      >
                        Редактировать
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Предыдущая страница"
          >
            Назад
          </button>
          <span className="flex items-center">
            Страница {page} из {pagination.totalPages} (всего {pagination.total} проектов)
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Следующая страница"
          >
            Вперед
          </button>
        </div>
      )}
    </div>
  );
}
