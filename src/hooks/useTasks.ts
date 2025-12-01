// src/app/hooks/useTasks.ts

'use client';

import useSWR from 'swr';
import { Task, TaskStatus } from '@/types/task';

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  });

export function useTasks(projectId?: number, groupId?: number) {
  const queryParams = new URLSearchParams();
  if (projectId) queryParams.append('projectId', projectId.toString());
  if (groupId) queryParams.append('groupId', groupId.toString());

  // Увеличиваем лимит для Kanban
  queryParams.append('limit', '100');

  const { data, error, mutate } = useSWR(`/api/tasks?${queryParams.toString()}`, fetcher, {
    refreshInterval: 0, // Отключаем автообновление чтобы не мешало drag&drop
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: true,
    errorRetryCount: 3,
  });

  return {
    tasks: data?.tasks || [],
    totalPages: data?.totalPages || 0,
    currentPage: data?.currentPage || 1,
    total: data?.total || 0,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useTaskUpdate() {
  const updateTaskStatus = async (taskId: number, status: TaskStatus) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update task status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  };

  return { updateTaskStatus };
}
