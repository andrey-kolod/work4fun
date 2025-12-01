// src/app/tasks/[id]/edit/TaskEditClient.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TaskForm } from '@/components/forms/TaskForm';

interface TaskEditClientProps {
  taskId: string;
  userId: string;
  userRole: string;
}

export function TaskEditClient({ taskId, userId, userRole }: TaskEditClientProps) {
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [taskRes, projectsRes, groupsRes, usersRes] = await Promise.all([
        fetch(`/api/tasks/${taskId}`),
        fetch(`/api/projects?userId=${userId}`),
        fetch(`/api/groups?userId=${userId}`),
        fetch('/api/users'),
      ]);

      if (!taskRes.ok) throw new Error('Задача не найдена');
      if (!projectsRes.ok) throw new Error('Ошибка загрузки проектов');
      if (!groupsRes.ok) throw new Error('Ошибка загрузки групп');
      if (!usersRes.ok) throw new Error('Ошибка загрузки пользователей');

      const [taskData, projectsData, groupsData, usersData] = await Promise.all([
        taskRes.json(),
        projectsRes.json(),
        groupsRes.json(),
        usersRes.json(),
      ]);

      // Проверяем права доступа
      const isCreator = taskData.creatorId === parseInt(userId);
      const isSuperAdmin = userRole === 'SUPER_ADMIN';
      const project = projectsData.find((p: any) => p.id === taskData.projectId);
      const isProjectAdmin = project?.members?.some(
        (m: any) => m.userId === parseInt(userId) && m.role === 'ADMIN'
      );

      if (!isCreator && !isSuperAdmin && !isProjectAdmin) {
        throw new Error('Нет прав на редактирование');
      }

      setTask(taskData);
      setProjects(projectsData);
      setGroups(groupsData);
      setUsers(usersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
        <p className="text-center text-gray-500 mt-4">Загрузка данных...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Ошибка</p>
          <p>{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-gray-600">Задача не найдена</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Назад
        </button>
      </div>
    );
  }

  return (
    <TaskForm initialData={task} projects={projects} groups={groups} users={users} mode="edit" />
  );
}
