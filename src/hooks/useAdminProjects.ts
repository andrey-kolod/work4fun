// src/hooks/useAdminProjects.ts

'use client';

import useSWR, { useSWRConfig } from 'swr';
import { useCallback } from 'react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  owner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  _count: {
    tasks: number;
    members: number;
  };
}

interface ProjectsResponse {
  projects: Project[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const fetcher = async (url: string): Promise<ProjectsResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Ошибка ${res.status}`);
  }
  return res.json();
};

export function useAdminProjects(page: number = 1, pageSize: number = 10, search: string = '') {
  const { mutate } = useSWRConfig();

  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('pageSize', pageSize.toString());
  if (search.trim()) params.set('search', search.trim());

  const url = `/api/projects?${params.toString()}`;

  const { data, error, isLoading, isValidating } = useSWR<ProjectsResponse, Error>(url, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const mutateProjects = useCallback(() => {
    mutate(url);
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [useAdminProjects] Обновление списка проектов');
    }
  }, [url, mutate]);

  if (process.env.NODE_ENV === 'development') {
    if (error) console.error('💥 [useAdminProjects] Ошибка:', error);
    if (isLoading) console.log('⏳ [useAdminProjects] Загрузка...');
  }

  return {
    projects: data?.projects || [],
    pagination: data?.pagination || { page, pageSize, total: 0, totalPages: 0 },
    isLoading,
    isValidating,
    isError: !!error,
    error,
    mutate: mutateProjects,
  };
}
