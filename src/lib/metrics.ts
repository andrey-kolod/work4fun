// src/lib/metrics.ts

import fs from 'fs/promises';
import path from 'path';

const METRICS_FILE = path.join(process.cwd(), 'data', 'metrics.json');

interface MetricsData {
  testCounter: number;
  httpRequests: Record<string, number>;
  timestamp: number;
}

const isDev = process.env.NODE_ENV === 'development';

let memoryCache: MetricsData = {
  testCounter: 0,
  httpRequests: {},
  timestamp: Date.now(),
};

/** Загружаем данные из файла при старте и перед каждой отдачей в dev */
async function loadFromFile() {
  try {
    const data = await fs.readFile(METRICS_FILE, 'utf-8');
    const parsed = JSON.parse(data) as MetricsData;
    memoryCache = {
      ...parsed,
      httpRequests: parsed.httpRequests || {},
      timestamp: parsed.timestamp || Date.now(),
    };
    if (isDev) {
      console.log(
        `[Metrics LOAD] Успешно загружено из диска → testCounter=${memoryCache.testCounter}, ` +
          `httpRequests keys=${Object.keys(memoryCache.httpRequests).length}, PID=${process.pid}`
      );
    }
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      console.error('[Metrics LOAD] Ошибка чтения файла:', err.message);
    }
    // Если файла нет — просто оставляем пустой кэш
  }
}

loadFromFile().catch(console.error);

/** Сохраняем на диск после каждого изменения (в dev — сразу, в prod — можно реже) */
async function flushToFile() {
  try {
    await fs.mkdir(path.dirname(METRICS_FILE), { recursive: true });
    const dataToSave = {
      ...memoryCache,
      timestamp: Date.now(),
    };
    await fs.writeFile(METRICS_FILE, JSON.stringify(dataToSave, null, 2) + '\n');
    if (isDev) {
      console.log(
        `[Metrics FLUSH] Сохранено на диск → testCounter=${memoryCache.testCounter}, ` +
          `keys=${Object.keys(memoryCache.httpRequests).length}`
      );
    }
  } catch (err) {
    console.error('[Metrics FLUSH] Ошибка записи:', err);
  }
}

export async function incTestCounter() {
  memoryCache.testCounter += 1;
  console.log(`[Metrics INC] testCounter → ${memoryCache.testCounter} (PID: ${process.pid})`);
  if (isDev) await flushToFile();
}

export async function incHttpRequest(method: string, endpoint: string) {
  const key = `${method}_${endpoint}`;
  memoryCache.httpRequests[key] = (memoryCache.httpRequests[key] || 0) + 1;
  console.log(`[Metrics INC] ${key} → ${memoryCache.httpRequests[key]} (PID: ${process.pid})`);
  if (isDev) await flushToFile();
}

export async function getMetrics() {
  if (isDev) {
    await loadFromFile(); // всегда свежие данные в dev
  }

  console.log(
    `[Metrics GET] Отдаём → testCounter=${memoryCache.testCounter}, ` +
      `requests=${Object.keys(memoryCache.httpRequests).length}, PID=${process.pid}`
  );

  const lines = [
    `# HELP app_test_counter Test counter`,
    `# TYPE app_test_counter counter`,
    `app_test_counter ${memoryCache.testCounter || 0}`,
    ``,
    `# HELP app_http_requests_total HTTP requests`,
    `# TYPE app_http_requests_total counter`,
  ];

  Object.entries(memoryCache.httpRequests).forEach(([key, count]) => {
    const [method, ...rest] = key.split('_');
    const endpoint = rest.join('_');
    lines.push(`app_http_requests_total{method="${method}",endpoint="${endpoint}"} ${count}`);
  });

  // Добавляем завершающий перевод строки — важно для OpenMetrics
  lines.push('');

  return lines.join('\n');
}

// В продакшене — периодический сброс (если нужно)
if (!isDev) {
  setInterval(flushToFile, 10000); // каждые 10 секунд
}
