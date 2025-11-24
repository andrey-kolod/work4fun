// src/hooks/useToasts.ts
import { useToast } from '@/components/ui/toast';
import { useCallback } from 'react';

export function useToasts() {
  const { addToast } = useToast();

  const toastSuccess = useCallback(
    (title: string, description?: string) => {
      addToast({
        type: 'success',
        title,
        description,
        duration: 4000,
      });
    },
    [addToast],
  );

  const toastError = useCallback(
    (title: string, description?: string) => {
      addToast({
        type: 'error',
        title,
        description,
        duration: 6000,
      });
    },
    [addToast],
  );

  const toastWarning = useCallback(
    (title: string, description?: string) => {
      addToast({
        type: 'warning',
        title,
        description,
        duration: 5000,
      });
    },
    [addToast],
  );

  const toastInfo = useCallback(
    (title: string, description?: string) => {
      addToast({
        type: 'info',
        title,
        description,
        duration: 4000,
      });
    },
    [addToast],
  );

  return {
    toastSuccess,
    toastError,
    toastWarning,
    toastInfo,
  };
}
