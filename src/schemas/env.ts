// src/schemas/env.ts

import { z } from 'zod';

export const envSchema = z.object({
  // Окружение
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SERVICE_NAME: z.string().default('my_app'),
  DOCKER: z.coerce.boolean().default(false),

  // Логи и отладка
  ENABLE_CONSOLE_LOG: z.coerce.boolean().default(true),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Мониторинг и безопасность
  METRICS_PROMETHEUS_TOKEN: z.string().min(10, {
    message: 'Prometheus token must be at least 10 characters',
  }),

  // Метрики
  ENABLE_METRICS: z.coerce.boolean().default(true),
  METRICS_ACTIVE_USER_WINDOW_MINUTES: z.coerce.number().default(30),
  METRICS_CLEANUP_INTERVAL_MINUTES: z.coerce.number().default(5),
  METRICS_DISABLE_COLLECTION: z.coerce.boolean().default(false),
  METRICS_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('debug'),
});

export type Env = z.infer<typeof envSchema>;
