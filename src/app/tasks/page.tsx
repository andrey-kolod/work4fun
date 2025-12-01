// src/app/tasks/page.tsx

'use client';

import { useState, useEffect } from 'react';
import KanbanBoard from '@/components/tasks/KanbanBoard';

interface Project {
  id: number;
  name: string;
}

interface Group {
  id: number;
  name: string;
  project?: {
    id: number;
    name: string;
  };
}

export default function TasksPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number>();
  const [selectedGroupId, setSelectedGroupId] = useState<number>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Загружаем проекты
        const projectsRes = await fetch('/api/projects');
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || []);

        // Загружаем группы
        const groupsRes = await fetch('/api/groups');
        const groupsData = await groupsRes.json();
        setGroups(groupsData.groups || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Фильтруем группы по выбранному проекту
  const filteredGroups = selectedProjectId
    ? groups.filter((group) => group.project?.id === selectedProjectId)
    : groups;

  // Правильное вычисление disabled для select
  const isGroupsSelectDisabled = Boolean(selectedProjectId && filteredGroups.length === 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Kanban Доска</h1>

      {/* Фильтры */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Проект</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              value={selectedProjectId || ''}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedProjectId(value ? Number(value) : undefined);
                setSelectedGroupId(undefined); // Сбрасываем выбор группы
              }}
            >
              <option value="">Все проекты</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Группа</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
              value={selectedGroupId || ''}
              onChange={(e) =>
                setSelectedGroupId(e.target.value ? Number(e.target.value) : undefined)
              }
              disabled={isGroupsSelectDisabled}
            >
              <option value="">Все группы</option>
              {filteredGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            {selectedProjectId && filteredGroups.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">Нет групп в выбранном проекте</p>
            )}
          </div>
        </div>
      </div>

      {/* Kanban доска */}
      <KanbanBoard projectId={selectedProjectId} groupId={selectedGroupId} />
    </div>
  );
}
