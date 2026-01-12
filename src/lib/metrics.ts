// src/lib/metrics.ts

import { collectDefaultMetrics, register, Counter, Histogram, Gauge } from 'prom-client';
import { logger } from './logger';

collectDefaultMetrics({
  prefix: 'work4fun_',
});

// Счетчик HTTP запросов
export const httpRequestCounter = new Counter({
  name: 'work4fun_http_requests_total',
  help: 'Общее количество HTTP запросов',
  labelNames: ['method', 'route', 'status_code'] as const,
});

// Время выполнения HTTP запросов
export const httpRequestDuration = new Histogram({
  name: 'work4fun_http_request_duration_ms',
  help: 'Время выполнения HTTP запросов в миллисекундах',
  labelNames: ['method', 'route', 'status_code'] as const,
});

// Счетчик запросов к БД
export const prismaQueryCounter = new Counter({
  name: 'work4fun_prisma_queries_total',
  help: 'Общее количество запросов к БД через Prisma',
  labelNames: ['model', 'operation'] as const,
});

// Время выполнения запросов к БД
export const prismaQueryDuration = new Histogram({
  name: 'work4fun_prisma_query_duration_ms',
  help: 'Время выполнения запросов к БД через Prisma в миллисекундах',
  labelNames: ['model', 'operation'] as const,
  buckets: [1, 5, 10, 50, 100, 500, 1000],
});

// Счетчик активных задач
export const activeTasksGauge = new Gauge({
  name: 'work4fun_active_tasks_total',
  help: 'Текущее количество активных задач в системе',
});

// Счетчик регистраций пользователей
export const userRegistrationsCounter = new Counter({
  name: 'work4fun_user_registrations_total',
  help: 'Общее количество успешных регистраций пользователей',
});

// Метрики ошибок
export const errorCounter = new Counter({
  name: 'work4fun_errors_total',
  help: 'Общее количество ошибок в приложении',
  labelNames: ['type', 'route'] as const,
  // type: 'API_ERROR', 'AUTH_ERROR', 'VALIDATION_ERROR', 'DB_ERROR'
  // route: '/api/tasks', '/api/projects', '/login'
});

// Получение всех метрик
export async function getMetrics() {
  return await register.metrics();
}

// Сброс всех метрик
export function resetMetrics() {
  register.clear();
}

// Тестовая метрика для проверки
export const testCounter = new Counter({
  name: 'work4fun_test_counter',
  help: 'Тестовый счетчик для проверки работы метрик',
});

// Функция для тестирования
export function incrementTestCounter() {
  testCounter.inc();
  logger.debug('✅ Тестовая метрика инкрементирована');
}
