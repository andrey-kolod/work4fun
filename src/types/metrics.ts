// src/types/metrics.ts

export interface MetricsConfig {
  activeUserWindowMs: number;
  cleanupIntervalMs: number;
  flushIntervalMs: number;
}
export interface CustomMetrics {
  testCounter: {
    name: string;
    help: string;
  };
  httpRequestsTotal: {
    name: string;
    help: string;
    labelNames: string[];
  };
  httpRequestDurationSeconds: {
    name: string;
    help: string;
    labelNames: string[];
    buckets: number[];
  };
  activeUsers: {
    name: string;
    help: string;
  };
}
