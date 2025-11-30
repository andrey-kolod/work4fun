// src/app/api/users/[id]/activate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';

// Функция для получения IP адреса из запроса
function getClientIP(request: Request): string {
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

// PATCH /api/users/[id]/activate - Активация/деактивация пользователя
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const body = await request.json();
    const { isActive, reason } = body;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Сохраняем историю статусов с правильным получением IP
    await prisma.userStatusHistory.create({
      data: {
        userId: user.id,
        oldStatus: user.isActive,
        newStatus: isActive,
        changedBy: parseInt(session.user.id),
        reason: reason || '',
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Обновляем статус пользователя
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(params.id) },
      data: { isActive },
    });

    // Логируем действие с правильным получением IP
    if (isActive) {
      await audit.activateUser(
        parseInt(session.user.id),
        user.id,
        reason,
        request,
        request.headers.get('user-agent') || 'unknown'
      );
    } else {
      await audit.deactivateUser(
        parseInt(session.user.id),
        user.id,
        reason,
        request,
        request.headers.get('user-agent') || 'unknown'
      );
    }

    // Возвращаем пользователя без пароля
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      user: userWithoutPassword,
      message: isActive ? 'Пользователь активирован' : 'Пользователь деактивирован',
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении статуса пользователя' },
      { status: 500 }
    );
  }
}
