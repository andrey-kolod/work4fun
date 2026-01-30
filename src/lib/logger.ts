// src/lib/logger.ts
// использовать только английский язык

import pino from 'pino';
import fs from 'fs';
import path from 'path';
import os from 'os';
import cron from 'node-cron';
import { env, IS_DEV, IS_PROD } from '@/utils/env';

const NODE_ENV = env.NODE_ENV;
const isDocker = env.DOCKER;
const LOG_LEVEL = env.LOG_LEVEL;
const SERVICE_NAME = env.SERVICE_NAME;
const LOG_DIR = path.join(process.cwd(), 'monitoring', 'logs');
const ENABLE_CONSOLE_LOG = env.ENABLE_CONSOLE_LOG;
const LOG_ROTATION_CONFIG = {
  maxFiles: 30,
  maxAgeDays: 90,
  maxSizeMB: 1024,
};

let currentLogFile: string = '';
let loggerInstance: ReturnType<typeof pino>;

function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    try {
      fs.mkdirSync(LOG_DIR, { recursive: true });
      if (IS_DEV) {
        console.log(`[logger] Created logs directory: ${LOG_DIR}`);
      }
    } catch (error) {
      console.error(`[logger] Failed to create logs directory ${LOG_DIR}:`, error);
    }
  }
}

function getTodayLogFile(): string {
  // const baseName = SERVICE_NAME || 'app';
  const baseName = 'app';
  const today = new Date().toISOString().split('T')[0];
  return path.join(LOG_DIR, `${baseName}-${today}.log`);
}

function cleanupOldLogs(): void {
  try {
    if (!fs.existsSync(LOG_DIR)) return;

    const files = fs
      .readdirSync(LOG_DIR)
      .filter((file) => file.endsWith('.log'))
      .map((file) => {
        const filePath = path.join(LOG_DIR, file);
        const stats = fs.statSync(filePath);

        return {
          name: file,
          path: filePath,
          size: stats.size,
          mtime: stats.mtime.getTime(),
          age: Date.now() - stats.mtime.getTime(),
        };
      })
      .sort((a, b) => b.mtime - a.mtime);

    const maxSizeBytes = LOG_ROTATION_CONFIG.maxSizeMB * 1024 * 1024;
    let totalSize = files.reduce((sum, file) => sum + file.size, 0);

    const filesToDeleteByAge = files.filter(
      (file) => file.age > LOG_ROTATION_CONFIG.maxAgeDays * 24 * 60 * 60 * 1000
    );

    const filesToDeleteByCount =
      files.length > LOG_ROTATION_CONFIG.maxFiles ? files.slice(LOG_ROTATION_CONFIG.maxFiles) : [];

    const filesToDeleteBySize: typeof files = [];
    if (totalSize > maxSizeBytes) {
      for (let i = files.length - 1; i >= 0; i--) {
        if (totalSize <= maxSizeBytes) break;
        filesToDeleteBySize.push(files[i]);
        totalSize -= files[i].size;
      }
    }

    const allFilesToDelete = [
      ...filesToDeleteBySize,
      ...filesToDeleteByAge,
      ...filesToDeleteByCount,
    ];

    const uniqueFilesToDelete = Array.from(new Set(allFilesToDelete.map((file) => file.path))).map(
      (filePath) => files.find((file) => file.path === filePath)!
    );

    uniqueFilesToDelete.forEach((file) => {
      try {
        fs.unlinkSync(file.path);

        if (IS_DEV) {
          const ageDays = Math.floor(file.age / (24 * 60 * 60 * 1000));
          const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
          console.log(
            `[logger] Deleted rotated log file ${file.name} (${ageDays} days, ${sizeMB} MB)`
          );
        }
      } catch (error) {
        console.error(`[logger] Failed to delete log file ${file.name}:`, error);
      }
    });

    if (IS_DEV) {
      console.log(`[logger] Cleanup completed: deleted ${uniqueFilesToDelete.length} files`);
    }
  } catch (error) {
    console.error('[logger] Log cleanup error:', error);
  }
}

function createLogger(logFilePath: string): ReturnType<typeof pino> {
  const streams: Array<{ stream: any; level: string }> = [];

  const fileStream = pino.destination({
    dest: logFilePath,
    sync: false,
    mkdir: true,
  });
  streams.push({ stream: fileStream, level: LOG_LEVEL });

  if (ENABLE_CONSOLE_LOG) {
    if (IS_DEV && !isDocker) {
      streams.push({
        stream: pino.transport({
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:HH:MM:ss',
            messageFormat: '{msg}',
            singleLine: false,
            levelFirst: true,
            customColors: {
              debug: 'cyan',
              info: 'green',
              warn: 'yellow',
              error: 'red',
              fatal: 'magneta',
            },
          },
        }),
        level: 'debug',
      });
    } else {
      streams.push({ stream: process.stdout, level: LOG_LEVEL });
    }
  }

  return pino(
    {
      level: LOG_LEVEL,
      base: {
        pid: process.pid,
        hostname: os.hostname(),
        env: NODE_ENV,
        service: SERVICE_NAME,
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label: string) => ({ level: label.toUpperCase() }),
      },
      serializers: { err: pino.stdSerializers.err },
      redact: {
        paths: [
          'password',
          'newPassword',
          'confirmPassword',
          'token',
          'accessToken',
          'refreshToken',
          'apiKey',
          'secret',
          'authorization',
          'req.headers.authorization',
          'req.headers.cookie',
          '*.password',
          '*.token',
          '*.secret',
          'cardNumber',
          'cvv',
          'expiration',
          'iban',
        ],
        censor: '[REDACTED]',
        remove: false,
      },
      mixin: () => {
        const result: any = {};
        if (NODE_ENV !== 'production') result.env = NODE_ENV;
        if (IS_DEV) result.deployment = isDocker ? 'docker' : 'local';
        return result;
      },
    },
    pino.multistream(streams)
  );
}

function rotateLogFile(): void {
  try {
    const newLogFile = getTodayLogFile();

    if (newLogFile !== currentLogFile) {
      loggerInstance = createLogger(newLogFile);
      currentLogFile = newLogFile;

      if (IS_DEV) {
        console.log(`[logger] Rotated to new log file: ${newLogFile}`);
      }
    }
  } catch (error) {
    console.error('[logger] Log rotation error:', error);
  }
}

ensureLogDir();
currentLogFile = getTodayLogFile();
loggerInstance = createLogger(currentLogFile);
cleanupOldLogs();

const dailyCleanupTask = cron.schedule(
  '1 0 * * *',
  () => {
    if (IS_DEV) {
      console.log('[logger] Starting daily rotation and cleanup at 00:01...');
    }
    cleanupOldLogs();
    rotateLogFile();
  },
  {
    timezone: 'Europe/Moscow',
  }
);

const dateCheckTask = cron.schedule(
  '0 0,4,8,12,16,20 * * *',
  () => {
    rotateLogFile();
  },
  {
    timezone: 'Europe/Moscow',
  }
);

export function logError(error: unknown, context?: string, meta?: Record<string, any>): void {
  if (error instanceof Error) {
    loggerInstance.error({ ...meta, context, err: error, errorName: error.name }, error.message);
  } else {
    loggerInstance.error({ ...meta, context, error: String(error) }, 'Unknown error');
  }
}

export const log = {
  debug: (message: string, meta?: Record<string, any>) => loggerInstance.debug(meta || {}, message),
  info: (message: string, meta?: Record<string, any>) => loggerInstance.info(meta || {}, message),
  warn: (message: string, meta?: Record<string, any>) => loggerInstance.warn(meta || {}, message),
  error: (message: string, meta?: Record<string, any>) => loggerInstance.error(meta || {}, message),
  fatal: (message: string, meta?: Record<string, any>) => loggerInstance.fatal(meta || {}, message),
  errorWithContext: logError,
  getLogDir: () => LOG_DIR,
  getTodayLogFile: () => getTodayLogFile(),
  getConfig: () => ({
    level: LOG_LEVEL,
    service: SERVICE_NAME,
    env: NODE_ENV,
    isDevelopment: IS_DEV,
    isProduction: IS_PROD,
    isDocker,
  }),
};

loggerInstance.info(
  {
    logDir: LOG_DIR,
    logFile: currentLogFile,
    service: SERVICE_NAME,
    version: process.env.npm_package_version || '0.1.0',
  },
  'Logger successfully initialized with DAILY rotation and cleanup'
);

export default log;
