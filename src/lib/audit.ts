// src/lib/audit.ts

import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const audit = {
  async create(
    userId: string,
    entityType: string,
    entityId: string | number,
    details: Record<string, any>,
    request?: NextRequest
  ) {
    try {
      if (!userId || !entityType || !entityId) {
        console.warn('[AUDIT] Пропущены обязательные параметры:', { userId, entityType, entityId });
        return;
      }

      let ipAddress = 'unknown';
      let userAgent = 'unknown';

      if (request) {
        ipAddress =
          request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
          request.headers.get('x-real-ip') ||
          request.headers.get('cf-connecting-ip') ||
          request.headers.get('x-client-ip') ||
          'unknown';

        userAgent = request.headers.get('user-agent') || 'unknown';
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[AUDIT] Запись действия: ${userId} → ${entityType}:${entityId} | ${details.action || 'UNKNOWN'} | IP: ${ipAddress}`
        );
      }

      await prisma.auditLog.create({
        data: {
          userId,
          entityType,
          entityId: String(entityId),
          action: details.action || 'UNKNOWN',
          details: JSON.stringify(details),
          ipAddress,
          userAgent,
        },
      });
      //       INSERT INTO "AuditLog" ("userId", "entityType", "entityId", "action", "details", "ipAddress", "userAgent", "createdAt")
      // -- VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      // -- Параметры:
      // -- $1 = userId (string)
      // -- $2 = entityType (string, e.g. 'Project')
      // -- $3 = entityId (string, после String(entityId))
      // -- $4 = action (string, e.g. 'CREATE' или 'UNKNOWN')
      // -- $5 = details (JSONB, строка после JSON.stringify(details))
      // -- $6 = ipAddress (string, e.g. '192.168.0.1' или 'unknown')
      // -- $7 = userAgent (string, e.g. 'Mozilla/5.0...' или 'unknown')

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ [AUDIT] Успешно записано действие для ${entityType}:${entityId}`);
      }
    } catch (error: any) {
      console.error('💥 [AUDIT] Ошибка записи в audit_log:', error.message || error);
    }
  },
};

export default audit;
