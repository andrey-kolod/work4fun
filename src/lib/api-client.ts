// src/lib/api-client.ts

export async function fetchApi(url: string, options: RequestInit = {}): Promise<Response> {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🌐 [fetchApi] Запрос: ${options.method || 'GET'} ${url}`);
    if (options.body) {
      console.log(`📤 [fetchApi] Тело запроса:`, options.body);
    }
  }

  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  let response: Response;

  try {
    response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`📥 [fetchApi] Ответ: ${response.status} ${response.statusText} для ${url}`);
    }

    if (!response.ok) {
      if (process.env.NODE_ENV === 'development') {
        const errorText = await response.text().catch(() => 'Не удалось прочитать тело ошибки');
        console.error(`🚨 [fetchApi] Ошибка API ${response.status}:`, errorText);
      }
    }

    return response;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`🌐 [fetchApi] Сетевая ошибка при запросе ${url}:`, error);
    }

    return new Response(JSON.stringify({ message: 'Network error' }), {
      status: 0,
      statusText: 'Network Error',
    });
  }
}

export async function fetchJson<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const response = await fetchApi(url, options);

  let data: T | null = null;
  let error: string | null = null;

  try {
    if (response.ok) {
      data = (await response.json()) as T;
    } else {
      const errorBody = await response.text();
      error = errorBody || response.statusText;
    }
  } catch (parseError) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`📦 [fetchJson] Не удалось распарсить JSON от ${url}:`, parseError);
    }
    error = 'Invalid JSON response';
  }

  return {
    data,
    error,
    status: response.status,
  };
}
