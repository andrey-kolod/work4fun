// src/app/admin/projects/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
  owner: {
    firstName: string;
    lastName: string;
    email: string;
  };
  _count: {
    tasks: number;
    userProjects: number;
  };
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [pagination.page]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(
        `/api/projects?page=${pagination.page}&pageSize=${pagination.pageSize}`
      );
      const data = await response.json();

      // ⬇️ ИСПРАВЛЕНИЕ: Проверяем наличие данных
      if (data.projects) {
        setProjects(data.projects);
      }

      // ⬇️ ИСПРАВЛЕНИЕ: Проверяем наличие pagination
      if (data.pagination) {
        setPagination(data.pagination);
      } else {
        // Если pagination нет, создаем дефолтные значения
        setPagination((prev) => ({
          ...prev,
          total: data.projects?.length || 0,
          totalPages: 1,
        }));
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Проекты</h1>
        <Link
          href="/admin/projects/create"
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          Создать проект
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{project.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 truncate max-w-xs">
                    {project.description || '—'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {project.owner.firstName} {project.owner.lastName}
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
                  {project._count.userProjects}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
