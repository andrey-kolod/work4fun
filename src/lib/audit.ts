// src/lib/audit.ts

import { prisma } from '@/lib/prisma';

import { NextRequest } from 'next/server';

const audit = {
  async create(
    userId: string,
    entityType: string,
    entityId: string,
    details: Record<string, any>,
    request: NextRequest
  ) {
    try {
      if (!userId || !entityType || !entityId) {
        throw new Error('userId, entityType и entityId обязательны для аудита');
      }

      const ipAddress =
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        'unknown';

      const userAgent = request.headers.get('user-agent') || 'unknown';

      await prisma.auditLog.create({
        data: {
          userId,
          entityType,
          entityId,
          action: details.action || 'UNKNOWN',
          details: JSON.stringify(details),
          ipAddress,
          userAgent,
        },
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `✅ [AUDIT] Действие: ${userId} → ${entityType}:${entityId} | ${details.action || 'UNKNOWN'}`
        );
      }
    } catch (error) {
      console.error('💥 [AUDIT] Ошибка записи лога аудита:', error);
    }
  },
};

export default audit;
