// src/utils/env.ts

import { z } from 'zod';
import { envSchema } from '@/schemas/env';
import { log } from '@/lib/logger';

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = z.treeifyError(parsed.error);
  log.fatal('[ENV] Invalid environment variables', { errors });
  process.exit(1);
}

export const env = parsed.data;

export const IS_DEV = env.NODE_ENV === 'development';
export const IS_PROD = env.NODE_ENV === 'production';
export const IS_TEST = env.NODE_ENV === 'test';
