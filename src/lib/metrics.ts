// src/lib/metrics.ts

import { Registry, Counter, Gauge, Histogram, collectDefaultMetrics } from 'prom-client';
import { log } from '@/lib/logger';
import { MetricsConfig, CustomMetrics } from '@/types/metrics';

const config: MetricsConfig = {
  activeUserWindowMs: parseInt(process.env.METRICS_ACTIVE_USER_WINDOW_MINUTES || '30') * 60 * 1000,
  cleanupIntervalMs: parseInt(process.env.METRICS_CLEANUP_INTERVAL_MINUTES || '5') * 60 * 1000,
  flushIntervalMs: 0,
};

const isDev = process.env.NODE_ENV === 'development';
const logLevel = process.env.METRICS_LOG_LEVEL || (isDev ? 'debug' : 'warn');

function metricLog(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  const currentLevel = levels[logLevel as keyof typeof levels] ?? 2;

  if (levels[level] >= currentLevel) {
    log[level](`[METRICS] ${message}`, data);
  }
}

type GlobalMetrics = {
  register: Registry;
  testCounter: Counter;
  httpRequestTotal: Counter<string>;
  httpRequestDuration: Histogram<string>;
  activeUserGauge: Gauge;
  cleanupCounter: Counter;
  activeUsersMap: Map<string, number>;
  cleanupTimer: NodeJS.Timeout;
  isInitialized: boolean;
  lastCleanupTime: number;
};

const globalAny = globalThis as unknown as {
  __MY_APP_METRICS__?: GlobalMetrics;
};

function initializeOrGetMetrics(): GlobalMetrics {
  if (globalAny.__MY_APP_METRICS__?.isInitialized) {
    return globalAny.__MY_APP_METRICS__;
  }

  if (globalAny.__MY_APP_METRICS__ && !globalAny.__MY_APP_METRICS__.isInitialized) {
    metricLog('warn', 'Global instance exists but not initialized, attempting recovery');

    try {
      if (globalAny.__MY_APP_METRICS__.cleanupTimer) {
        clearInterval(globalAny.__MY_APP_METRICS__.cleanupTimer);
      }
      return initializeMetricsInstance();
    } catch (error) {
      metricLog('error', 'Recovery failed, creating fresh instance', { error });
      return initializeMetricsInstance();
    }
  }

  return initializeMetricsInstance();
}

function initializeMetricsInstance(): GlobalMetrics {
  try {
    metricLog('info', 'Initializing new global metrics instance');

    const register = new Registry();

    collectDefaultMetrics({
      register,
      prefix: 'app_',
    });

    const metricsDesc: CustomMetrics = {
      testCounter: {
        name: 'app_test_counter',
        help: 'Test counter to verify metrics collection is working',
      },
      httpRequestsTotal: {
        name: 'app_http_requests_total',
        help: 'Total number of HTTP requests by method, endpoint and status',
        labelNames: ['method', 'endpoint', 'status'] as const,
      },
      httpRequestDurationSeconds: {
        name: 'app_http_request_duration_seconds',
        help: 'HTTP request duration in seconds (histogram)',
        labelNames: ['method', 'endpoint', 'status'] as const,
        buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      },
      activeUsers: {
        name: 'app_active_users',
        help: 'Number of unique active users in the last 30 minutes (gauge)',
      },
    };

    const testCounter = new Counter({
      name: metricsDesc.testCounter.name,
      help: metricsDesc.testCounter.help,
      registers: [register],
    });

    const httpRequestTotal = new Counter({
      name: metricsDesc.httpRequestsTotal.name,
      help: metricsDesc.httpRequestsTotal.help,
      labelNames: metricsDesc.httpRequestsTotal.labelNames,
      registers: [register],
    });

    const httpRequestDuration = new Histogram({
      name: metricsDesc.httpRequestDurationSeconds.name,
      help: metricsDesc.httpRequestDurationSeconds.help,
      labelNames: metricsDesc.httpRequestDurationSeconds.labelNames,
      buckets: metricsDesc.httpRequestDurationSeconds.buckets,
      registers: [register],
    });

    const activeUserGauge = new Gauge({
      name: metricsDesc.activeUsers.name,
      help: metricsDesc.activeUsers.help,
      registers: [register],
    });

    const cleanupCounter = new Counter({
      name: 'app_users_cleanup_total',
      help: 'Total number of users cleaned up from active users map',
      registers: [register],
    });

    const activeUsersMap = new Map<string, number>();

    function cleanupActiveUsers(): void {
      const now = Date.now();
      const timeoutMs = config.activeUserWindowMs;
      let deletedCount = 0;

      for (const [userId, lastSeen] of activeUsersMap.entries()) {
        if (now - lastSeen > timeoutMs) {
          activeUsersMap.delete(userId);
          deletedCount++;
        }
      }

      activeUserGauge.set(activeUsersMap.size);

      if (deletedCount > 0) {
        cleanupCounter.inc({ deleted: deletedCount.toString() });
      }

      if (deletedCount > 0) {
        metricLog('debug', 'Periodic cleanup executed', {
          deletedUsers: deletedCount,
          remainingActive: activeUsersMap.size,
        });
      }
    }

    const cleanupTimer = setInterval(cleanupActiveUsers, config.cleanupIntervalMs);

    if (typeof process !== 'undefined') {
      process.on('SIGTERM', () => {
        metricLog('info', 'SIGTERM received, cleaning up interval');
        clearInterval(cleanupTimer);
      });

      process.on('SIGINT', () => {
        metricLog('info', 'SIGINT received, cleaning up interval');
        clearInterval(cleanupTimer);
      });
    }

    const metricsInstance: GlobalMetrics = {
      register,
      testCounter,
      httpRequestTotal,
      httpRequestDuration,
      activeUserGauge,
      cleanupCounter,
      activeUsersMap,
      cleanupTimer,
      isInitialized: true,
      lastCleanupTime: Date.now(),
    };

    globalAny.__MY_APP_METRICS__ = metricsInstance;

    metricLog('info', 'Global metrics singleton initialized successfully', {
      activeWindowMinutes: config.activeUserWindowMs / 60000,
      cleanupIntervalMinutes: config.cleanupIntervalMs / 60000,
      nodeEnv: process.env.NODE_ENV,
    });

    return metricsInstance;
  } catch (error) {
    metricLog('error', 'CRITICAL: Failed to initialize metrics', {
      error: error instanceof Error ? error.message : String(error),
    });

    const fallbackInstance: GlobalMetrics = {
      register: new Registry(),
      testCounter: {
        inc: () => {},
        get: async () => ({ values: [] }),
      } as unknown as Counter,
      httpRequestTotal: {
        inc: () => {},
        get: async () => ({ values: [] }),
      } as unknown as Counter<string>,
      httpRequestDuration: {
        startTimer: () => () => 0,
        observe: () => {},
      } as unknown as Histogram<string>,
      activeUserGauge: {
        set: () => {},
      } as unknown as Gauge,
      cleanupCounter: {
        inc: () => {},
      } as unknown as Counter,
      activeUsersMap: new Map(),
      cleanupTimer: setInterval(() => {}, 60000),
      isInitialized: false,
      lastCleanupTime: Date.now(),
    };

    globalAny.__MY_APP_METRICS__ = fallbackInstance;

    return fallbackInstance;
  }
}

const METRICS = initializeOrGetMetrics();

export async function incTestCounter(): Promise<void> {
  if (process.env.METRICS_DISABLE_COLLECTION === 'true') return;

  try {
    METRICS.testCounter.inc();

    if (logLevel === 'debug') {
      const metricData = await METRICS.testCounter.get();
      const currentValue = metricData.values[0]?.value ?? 0;

      metricLog('debug', 'testCounter increased', {
        currentValue,
        metricName: 'app_test_counter',
      });
    }
  } catch (error) {
    metricLog('warn', 'Failed to increment test counter', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export function startHttpRequestTimer(method: string, endpoint: string): () => number {
  if (process.env.METRICS_DISABLE_COLLECTION === 'true') {
    return () => 0;
  }

  try {
    return METRICS.httpRequestDuration.startTimer({
      method: method.toUpperCase(),
      endpoint: normalizeEndpoint(endpoint),
      status: 'pending',
    });
  } catch (error) {
    metricLog('warn', 'Failed to start HTTP request timer', {
      method,
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return () => 0;
  }
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint
    .replace(/\/[0-9a-fA-F-]{36}/g, '/:uuid') // UUID
    .replace(/\/\d+/g, '/:id'); // Числовые ID
}

export function observeHttpRequest(
  method: string,
  endpoint: string,
  status: number | string,
  durationSeconds?: number
): void {
  if (process.env.METRICS_DISABLE_COLLECTION === 'true') return;

  try {
    const labels = {
      method: method.toUpperCase(),
      endpoint: normalizeEndpoint(endpoint),
      status: String(status),
    };

    METRICS.httpRequestTotal.inc(labels);

    if (typeof durationSeconds === 'number' && durationSeconds >= 0) {
      METRICS.httpRequestDuration.observe(labels, durationSeconds);
    }

    if (logLevel === 'debug') {
      metricLog('debug', 'HTTP request observed', {
        ...labels,
        durationSeconds: durationSeconds?.toFixed(3) ?? 'N/A',
      });
    }
  } catch (error) {
    metricLog('warn', 'Failed to observe HTTP request', {
      method,
      endpoint,
      status,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export function trackUserActivity(userId: string | undefined | null): void {
  if (process.env.METRICS_DISABLE_COLLECTION === 'true') return;

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    if (logLevel === 'debug') {
      metricLog('debug', 'Skipping user activity tracking - invalid userId', {
        userId,
        type: typeof userId,
      });
    }
    return;
  }

  try {
    const now = Date.now();
    const timeoutMs = config.activeUserWindowMs;

    for (const [existingId, lastSeen] of METRICS.activeUsersMap.entries()) {
      if (now - lastSeen > timeoutMs) {
        METRICS.activeUsersMap.delete(existingId);
      }
    }

    METRICS.activeUsersMap.set(userId, now);
    METRICS.activeUserGauge.set(METRICS.activeUsersMap.size);

    if (logLevel === 'debug') {
      metricLog('debug', 'User activity tracked', {
        userId: anonymizeUserId(userId),
        activeUsers: METRICS.activeUsersMap.size,
      });
    }
  } catch (error) {
    metricLog('warn', 'Failed to track user activity', {
      userId: anonymizeUserId(userId),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export function anonymizeUserId(userId: string | undefined | null): string {
  if (!userId) return 'anonymous';
  if (userId.length <= 4) return '***';
  const prefix = userId.substring(0, 3);
  const suffix = userId.substring(userId.length - 1);
  return `${prefix}***${suffix}`;
}

export async function getMetrics(): Promise<string> {
  try {
    if (logLevel === 'debug') {
      metricLog('debug', 'Generating Prometheus metrics output');
    }

    const now = Date.now();
    const timeoutMs = config.activeUserWindowMs;
    let cleanedCount = 0;

    if (METRICS.activeUsersMap) {
      for (const [userId, lastSeen] of METRICS.activeUsersMap.entries()) {
        if (now - lastSeen > timeoutMs) {
          METRICS.activeUsersMap.delete(userId);
          cleanedCount++;
        }
      }

      METRICS.activeUserGauge.set(METRICS.activeUsersMap.size);

      if (cleanedCount > 0 && logLevel === 'debug') {
        metricLog('debug', 'Final cleanup before metrics export', {
          cleanedUsers: cleanedCount,
          remainingActive: METRICS.activeUsersMap.size,
        });
      }
    }

    const metricsOutput = await METRICS.register.metrics();

    const enhancedOutput = `
# HELP app_health Application health status (1=healthy, 0=unhealthy)
# TYPE app_health gauge
app_health{service="metrics"} ${METRICS.isInitialized ? 1 : 0}

${metricsOutput}`.trim();

    return enhancedOutput;
  } catch (error) {
    metricLog('error', 'Failed to generate metrics output', {
      error: error instanceof Error ? error.message : String(error),
    });

    return `# ERROR: Metrics registry temporarily unavailable
# Check application logs for details
# Timestamp: ${new Date().toISOString()}
app_error{component="metrics_registry"} 1
`;
  }
}

export function cleanupMetrics(): void {
  try {
    if (globalAny.__MY_APP_METRICS__?.cleanupTimer) {
      clearInterval(globalAny.__MY_APP_METRICS__.cleanupTimer);
    }

    if (globalAny.__MY_APP_METRICS__?.activeUsersMap) {
      globalAny.__MY_APP_METRICS__.activeUsersMap.clear();
    }

    delete globalAny.__MY_APP_METRICS__;

    metricLog('info', 'Cleaned up all metrics resources');
  } catch (error) {
    metricLog('warn', 'Error during cleanup', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function getMetricsHealth(): Promise<{
  healthy: boolean;
  activeUsers: number;
  lastCleanupAgo: string;
}> {
  const now = Date.now();
  const lastCleanupTime = METRICS.lastCleanupTime || now;
  const minutesAgo = Math.round((now - lastCleanupTime) / 60000);

  return {
    healthy: METRICS.isInitialized,
    activeUsers: METRICS.activeUsersMap?.size || 0,
    lastCleanupAgo: `${minutesAgo} minutes ago`,
  };
}

export const __TEST_ONLY__ = isDev
  ? {
      getInternalState: () => ({
        activeUsersCount: METRICS.activeUsersMap.size,
        isInitialized: METRICS.isInitialized,
        config,
      }),
      reset: () => {
        cleanupMetrics();
        initializeOrGetMetrics();
      },
    }
  : null;

if (isDev) {
  setTimeout(() => {
    metricLog('info', 'Module loaded and ready', {
      singleton: !!globalAny.__MY_APP_METRICS__,
      initialized: METRICS.isInitialized,
      activeUsers: METRICS.activeUsersMap.size,
    });
  }, 1000);
}
