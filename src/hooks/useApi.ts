// hooks/useApi.ts

import { useState, useCallback } from 'react';

interface UseApiReturn {
  loading: boolean;
  error: string | null;
  callApi: <T>(apiCall: () => Promise<T>) => Promise<T | void>;
  clearError: () => void;
}

export function useApi(): UseApiReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callApi = useCallback(async <T>(apiCall: () => Promise<T>): Promise<T | void> => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Произошла неизвестная ошибка';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    loading,
    error,
    callApi,
    clearError,
  };
}
