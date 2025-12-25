// src/lib/api-client.ts
// Создаём отдельную утилитарную функцию для API-запросов

export async function fetchApi(url: string, options?: RequestInit): Promise<Response> {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
  });

  return response;
}
