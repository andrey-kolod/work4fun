// lib/services/activityLogService.ts
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

export class ActivityLogService {
  async logUserAction(
    userId: number,
    actionType: string,
    entityType: string,
    entityId: number,
    request?: NextRequest,
    newValues?: any,
    oldValues?: any
  ) {
    let ipAddress = 'unknown';
    let userAgent = 'unknown';

    if (request) {
      ipAddress =
        request.headers.get('x-real-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        'unknown';

      userAgent = request.headers.get('user-agent') || 'unknown';
    }

    return await prisma.activityLog.create({
      data: {
        userId: userId,
        actionType: actionType,
        entityType: entityType,
        entityId: entityId,
        oldValues: oldValues,
        newValues: newValues,
        ipAddress: ipAddress,
        userAgent: userAgent,
      },
    });
  }
}
