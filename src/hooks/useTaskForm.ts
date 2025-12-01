// src/hooks/useTaskForm.ts
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseTaskFormProps {
  initialData?: any;
  projects?: any[];
  groups?: any[];
  users?: any[];
}

// Тип для данных формы (все поля как строки)
interface TaskFormData {
  title: string;
  description?: string;
  projectId: string;
  groupId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  dueDate?: string | null;
  estimatedHours?: string | null;
  assigneeIds: string[];
  tags?: string[];
}

// Тип для данных API (числа вместо строк)
interface TaskAPIData {
  title: string;
  description?: string;
  projectId: number;
  groupId: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  dueDate?: string | null;
  estimatedHours?: number | null;
  assigneeIds: number[];
  tags?: string[];
}

export function useTaskForm({
  initialData,
  projects = [],
  groups = [],
  users = [],
}: UseTaskFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filteredGroups, setFilteredGroups] = useState<any[]>([]);
  const [availableAssignees, setAvailableAssignees] = useState<any[]>([]);

  // Фильтруем группы по выбранному проекту
  const filterGroupsByProject = useCallback(
    (projectId: string) => {
      if (!projectId) {
        setFilteredGroups([]);
        return;
      }
      const filtered = groups.filter((group: any) => group?.projectId === parseInt(projectId));
      setFilteredGroups(filtered);
    },
    [groups]
  );

  // Фильтруем доступных исполнителей
  const filterAssignees = useCallback(
    (projectId?: string, groupId?: string) => {
      if (!projectId) {
        setAvailableAssignees([]);
        return;
      }

      // Показываем всех пользователей (можно добавить фильтрацию по группе)
      setAvailableAssignees(users);
    },
    [users]
  );

  // Функция преобразования данных формы в данные API
  const transformFormToAPI = (formData: TaskFormData): TaskAPIData => {
    return {
      title: formData.title,
      description: formData.description,
      projectId: parseInt(formData.projectId, 10),
      groupId: parseInt(formData.groupId, 10),
      priority: formData.priority,
      status: formData.status,
      dueDate: formData.dueDate || null,
      estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
      assigneeIds: formData.assigneeIds.map((id) => parseInt(id, 10)),
      tags: formData.tags,
    };
  };

  // Функция отправки формы
  const onSubmit = useCallback(
    async (formData: TaskFormData, mode: 'create' | 'edit') => {
      setLoading(true);
      setError(null);

      try {
        // Преобразуем данные формы в формат API
        const apiData = transformFormToAPI(formData);

        console.log('📤 Sending task data:', apiData);

        const url = mode === 'create' ? '/api/tasks' : `/api/tasks/${initialData?.id}`;
        const method = mode === 'create' ? 'POST' : 'PUT';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Ошибка: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Task saved:', result);

        // Перенаправляем
        if (mode === 'create') {
          router.push(`/tasks/${result.id}`);
        } else {
          router.push(`/tasks/${initialData?.id}`);
        }
        router.refresh();

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Произошла ошибка';
        setError(message);
        console.error('❌ Error saving task:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [initialData?.id, router]
  );

  // Инициализация
  useEffect(() => {
    if (initialData?.projectId) {
      filterGroupsByProject(initialData.projectId.toString());
      filterAssignees(initialData.projectId.toString(), initialData.groupId?.toString());
    }
  }, [initialData, filterGroupsByProject, filterAssignees]);

  return {
    loading,
    error,
    filteredGroups,
    availableAssignees,
    filterGroupsByProject,
    filterAssignees,
    onSubmit,
  };
}
