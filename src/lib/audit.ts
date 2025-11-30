// src/lib/audit.ts

import { prisma } from './prisma';

interface ActivityLogData {
  userId: number;
  actionType: string;
  entityType: string;
  entityId: number;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

//  * Функция для получения IP адреса из запроса
function getClientIP(request: Request): string {
  // Пытаемся получить IP из различных заголовков
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'unknown';
}

//  * Основная функция для логирования действий в системе
//  * Создает запись в таблице ActivityLog
export async function logActivity(activity: ActivityLogData) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: activity.userId,
        actionType: activity.actionType,
        entityType: activity.entityType,
        entityId: activity.entityId,
        oldValues: activity.oldValues || {},
        newValues: activity.newValues || {},
        ipAddress: activity.ipAddress || 'unknown',
        userAgent: activity.userAgent || 'unknown',
      },
    });

    // Логируем в консоль для отладки
    console.log(
      `Activity logged: ${activity.actionType} for ${activity.entityType} ${activity.entityId}`
    );
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

//  * Вспомогательный объект для удобного логирования
//  * Предоставляет готовые методы для common действий
export const audit = {
  //  * Логирование создания сущности
  create: (
    userId: number,
    entityType: string,
    entityId: number,
    newValues: any,
    request?: Request,
    userAgent?: string
  ) =>
    logActivity({
      userId,
      actionType: `${entityType.toUpperCase()}_CREATED`,
      entityType,
      entityId,
      newValues,
      ipAddress: request ? getClientIP(request) : 'unknown',
      userAgent: userAgent || 'unknown',
    }),

  //  * Логирование обновления сущности
  update: (
    userId: number,
    entityType: string,
    entityId: number,
    oldValues: any,
    newValues: any,
    request?: Request,
    userAgent?: string
  ) =>
    logActivity({
      userId,
      actionType: `${entityType.toUpperCase()}_UPDATED`,
      entityType,
      entityId,
      oldValues,
      newValues,
      ipAddress: request ? getClientIP(request) : 'unknown',
      userAgent: userAgent || 'unknown',
    }),

  //  * Логирование удаления сущности
  delete: (
    userId: number,
    entityType: string,
    entityId: number,
    oldValues: any,
    request?: Request,
    userAgent?: string
  ) =>
    logActivity({
      userId,
      actionType: `${entityType.toUpperCase()}_DELETED`,
      entityType,
      entityId,
      oldValues,
      ipAddress: request ? getClientIP(request) : 'unknown',
      userAgent: userAgent || 'unknown',
    }),

  //  * Логирование активации пользователя
  activateUser: (
    userId: number,
    targetUserId: number,
    reason?: string,
    request?: Request,
    userAgent?: string
  ) =>
    logActivity({
      userId,
      actionType: 'USER_ACTIVATED',
      entityType: 'User',
      entityId: targetUserId,
      newValues: { isActive: true, reason },
      ipAddress: request ? getClientIP(request) : 'unknown',
      userAgent: userAgent || 'unknown',
    }),

  //  * Логирование деактивации пользователя
  deactivateUser: (
    userId: number,
    targetUserId: number,
    reason?: string,
    request?: Request,
    userAgent?: string
  ) =>
    logActivity({
      userId,
      actionType: 'USER_DEACTIVATED',
      entityType: 'User',
      entityId: targetUserId,
      newValues: { isActive: false, reason },
      ipAddress: request ? getClientIP(request) : 'unknown',
      userAgent: userAgent || 'unknown',
    }),
};
