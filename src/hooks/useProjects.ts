// src/hooks/useProjects.ts

'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useProjects() {
  const { data, error } = useSWR('/api/projects', fetcher);

  return {
    projects: data?.projects || [],
    isLoading: !error && !data,
    isError: error,
  };
}
