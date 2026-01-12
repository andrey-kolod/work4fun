// src/lib/logger.ts

import pino from 'pino';

const logLevel =
  process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info');

export const logger = pino({
  level: logLevel,
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard',
            messageFormat: '{msg}',
            singleLine: true,
          },
        }
      : undefined,
  base: {
    pid: process.pid,
    env: process.env.NODE_ENV,
  },
});
