//src/hooks/useGroups.ts

'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useGroups() {
  const { data, error } = useSWR('/api/groups', fetcher);

  return {
    groups: data?.groups || [],
    isLoading: !error && !data,
    isError: error,
  };
}
