// src/lib/audit.ts
// ПОЛНОСТЬЮ ИСПРАВЛЕННЫЙ ФАЙЛ
// Почему была ошибка (объяснение как новичку):
// 1. PrismaClient генерирует методы (prisma.user, prisma.project и т.д.) строго по моделям в schema.prisma.
//    В твоей текущей схеме модели AuditLog НЕТ → Prisma не знает prisma.auditLog → ошибка "Свойство "auditLog" не существует".
//    Это критично для типобезопасности: TS не позволит использовать несуществующую модель.
// 2. Для чего этот файл: Логирование всех действий пользователей (аудит) — по PRD "Полное логирование действий (ActivityLog)", SUPER_ADMIN видит все логи.
//    Записывает кто (userId), что сделал (action), над какой сущностью (entityType/entityId), детали (JSON), IP, userAgent.
//    Это важно для безопасности и аудита (кто добавил/удалил пользователя, изменил проект и т.д.).
// 3. Лучшая практика продакшена:
//    - Добавь модель AuditLog в schema.prisma (обязательно для типобезопасности и работы).
//    - Никогда не используй raw SQL для аудита — Prisma типобезопасен и автоматически валидирует.
//    - Аудит асинхронный и в try/catch — не ломает основной запрос при ошибке БД.
//    - Логи только в dev-режиме (process.env.NODE_ENV === 'development') — в проде тихо, не засоряет сервер.
//    - Default export — избегает циклов импорта и ошибок "циклическое определение" (как было раньше).
//    - IP/userAgent — из заголовков (x-forwarded-for и т.д.) — правильно для продакшена за прокси (Vercel, Cloudflare).
// 4. Что делать:
//    - Добавь модель AuditLog в schema.prisma (см. ниже).
//    - Запусти миграцию: npx prisma migrate dev --name add_audit_log
//    - Запусти npx prisma generate — обновит типы (prisma.auditLog появится).
//    - Импорт везде: import audit from '@/lib/audit'; (без {} — default export).

import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const audit = {
  /**
   * Создаёт запись аудита
   * @param userId — string (cuid из User.id)
   * @param entityType — тип сущности ('Project', 'Task', 'User' и т.д.)
   * @param entityId — string (ID сущности)
   * @param details — объект с деталями (action, userId и т.д.)
   * @param request — NextRequest для IP и userAgent
   */
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

      // Получаем IP (поддержка прокси: Vercel, Cloudflare, Nginx)
      const ipAddress =
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        'unknown';

      const userAgent = request.headers.get('user-agent') || 'unknown';

      // ИСПРАВЛЕНО: prisma.auditLog.create — после добавления модели в schema.prisma
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

      // Логи только в dev-режиме — безопасно для продакшена (не засоряет сервер)
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `✅ [AUDIT] Действие: ${userId} → ${entityType}:${entityId} | ${details.action || 'UNKNOWN'}`
        );
      }
    } catch (error) {
      // Не бросаем ошибку — аудит не должен ломать основной запрос (продакшн: устойчивость)
      console.error('💥 [AUDIT] Ошибка записи лога аудита:', error);
    }
  },
};

// Default export — лучшая практика для сервисов (избегает циклов импорта и ошибок named export)
export default audit;
