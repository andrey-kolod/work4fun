// src/lib/logger.ts
// использовать только английский язык

import pino from 'pino';
import fs from 'fs';
import path from 'path';

const NODE_ENV = process.env.NODE_ENV || 'development';
const isDevelopment = NODE_ENV === 'development';
const isProduction = NODE_ENV === 'production';
const isDocker = process.env.DOCKER === 'true';
const LOG_LEVEL = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');
const SERVICE_NAME = process.env.SERVICE_NAME || 'app';
const LOG_DIR = path.join(process.cwd(), 'monitoring', 'logs');
const ENABLE_CONSOLE_LOG = process.env.ENABLE_CONSOLE_LOG !== 'false';
const LOG_ROTATION_CONFIG = {
  maxFiles: 30,
  maxAgeDays: 90,
  maxSizeMB: 1024,
};

function rotateLogs(): void {
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

    let totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxSizeBytes = LOG_ROTATION_CONFIG.maxSizeMB * 1024 * 1024;

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
      (path) => files.find((file) => file.path === path)!
    );

    uniqueFilesToDelete.forEach((file) => {
      try {
        fs.unlinkSync(file.path);

        if (isDevelopment) {
          const ageDays = Math.floor(file.age / (24 * 60 * 60 * 1000));
          const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
          console.log(`📝 Log was deleted ${file.name} (${ageDays} days, ${sizeMB} MB)`);
        }
      } catch (error) {
        if (isDevelopment) {
          console.error(`❌ Error deleting log ${file.name}:`, error);
        }
      }
    });
  } catch (error) {
    console.error('❌ Log rotation error:', error);
  }
}

function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    try {
      fs.mkdirSync(LOG_DIR, { recursive: true });
      if (isDevelopment) {
        console.log(`📁 Created logs directory: ${LOG_DIR}`);
      }
    } catch (error) {
      console.error(`❌ Error creating directory ${LOG_DIR}:`, error);
    }
  } else {
    rotateLogs();
  }
}

ensureLogDir();

function getLogFileName(): string {
  const date = new Date().toISOString().split('T')[0];
  return path.join(LOG_DIR, `app-${date}.log`);
}

const streams: Array<{ stream: any; level: string }> = [];

try {
  const fileStream = pino.destination({
    dest: getLogFileName(),
    sync: false,
    mkdir: true,
  });

  streams.push({
    stream: fileStream,
    level: LOG_LEVEL,
  });

  if (isDevelopment) {
    console.log(`📝 Logs will be saved to: ${getLogFileName()}`);
  }
} catch (error) {
  console.error(`❌ Error creating log file:`, error);
}

if (ENABLE_CONSOLE_LOG && isDevelopment && !isDocker) {
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
} else if (!ENABLE_CONSOLE_LOG) {
} else {
  streams.push({
    stream: process.stdout,
    level: LOG_LEVEL,
  });
}

export const logger = pino(
  {
    level: LOG_LEVEL,
    base: {
      pid: process.pid,
      hostname: require('os').hostname(),
      env: NODE_ENV,
      service: SERVICE_NAME,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label: string) => ({
        level: label.toUpperCase(),
      }),
    },
    serializers: {
      err: pino.stdSerializers.err,
    },
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

      if (NODE_ENV !== 'production') {
        result.env = NODE_ENV;
      }

      if (isDevelopment) {
        result.deployment = isDocker ? 'docker' : 'local';
      }

      return result;
    },
  },
  pino.multistream(streams)
);

export function logError(error: unknown, context?: string, meta?: Record<string, any>): void {
  if (error instanceof Error) {
    logger.error(
      {
        ...meta,
        context,
        err: error,
        errorName: error.name,
      },
      error.message
    );
  } else {
    logger.error(
      {
        ...meta,
        context,
        error: String(error),
      },
      'Unknown error'
    );
  }
}

export const log = {
  debug: (message: string, meta?: Record<string, any>) => logger.debug(meta || {}, message),
  info: (message: string, meta?: Record<string, any>) => logger.info(meta || {}, message),
  warn: (message: string, meta?: Record<string, any>) => logger.warn(meta || {}, message),
  error: (message: string, meta?: Record<string, any>) => logger.error(meta || {}, message),
  fatal: (message: string, meta?: Record<string, any>) => logger.fatal(meta || {}, message),
  errorWithContext: logError,
  getLogDir: () => LOG_DIR,
  getLogFile: () => getLogFileName(),
  getConfig: () => ({
    level: LOG_LEVEL,
    service: SERVICE_NAME,
    env: NODE_ENV,
    isDevelopment,
    isProduction,
    isDocker,
  }),
};

logger.info(
  {
    logDir: LOG_DIR,
    logFile: getLogFileName(),
    service: SERVICE_NAME,
    version: process.env.npm_package_version || '0.1.0',
  },
  'Logger successfully initialized'
);

export default log;
