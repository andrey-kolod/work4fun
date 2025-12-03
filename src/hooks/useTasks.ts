// src/hooks/useTasks.ts

import useSWR, { SWRConfiguration } from 'swr';
import { Task, TaskStatus } from '@/types/task';

const fetcher = async (url: string) => {
  console.log(`[SWR] Fetching tasks from: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || `HTTP error! status: ${res.status}`);
  }
  const data = await res.json();
  console.log(`[SWR] Fetched ${data.tasks?.length || 0} tasks`);
  return data.tasks || [];
};

export function useTasks(projectId?: number, groupId?: number) {
  let url = '/api/tasks';
  const params = new URLSearchParams();

  if (projectId) params.append('projectId', projectId.toString());
  if (groupId) params.append('groupId', groupId.toString());

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  console.log(`[useTasks] Hook called for URL: ${url}`);

  const swrConfig: SWRConfiguration<Task[], Error> = {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    refreshInterval: 0,
    revalidateIfStale: true,
    revalidateOnMount: true,
    shouldRetryOnError: true,
    errorRetryInterval: 2000,
    errorRetryCount: 3,
  };

  const { data, error, isLoading, mutate } = useSWR<Task[], Error>(url, fetcher, swrConfig);

  return {
    tasks: data || [],
    isLoading: isLoading && !data, // Показываем загрузку только если нет данных
    isError: error,
    mutate,
  };
}

export function useTaskUpdate() {
  const updateTaskStatus = async (taskId: number, status: TaskStatus) => {
    console.log(`[TASK UPDATE] Обновление задачи ${taskId} на статус ${status}`);

    const response = await fetch(`/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    const responseText = await response.text();
    console.log(`[TASK UPDATE] Ответ: ${response.status} ${responseText}`);

    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      } catch {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    return JSON.parse(responseText);
  };

  return { updateTaskStatus };
}
