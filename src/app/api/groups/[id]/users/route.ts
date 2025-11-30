// src/app/api/groups/[id]/users/route.ts
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

// POST /api/groups/[id]/users - Добавить пользователя в группу
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ИСПРАВЛЕНО: добавляем Promise
) {
  try {
    const { id } = await params; // ИСПРАВЛЕНО: используем await
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    const group = await prisma.group.findUnique({
      where: { id: parseInt(id) }, // ИСПРАВЛЕНО: используем id из params
      include: {
        project: true,
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Группа не найдена' }, { status: 404 });
    }

    // Проверяем, что пользователь существует
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Проверяем, что пользователь уже в проекте
    const userInProject = await prisma.userProject.findFirst({
      where: {
        userId: parseInt(userId),
        projectId: group.projectId,
      },
    });

    if (!userInProject) {
      return NextResponse.json(
        { error: 'Пользователь не состоит в проекте этой группы' },
        { status: 400 }
      );
    }

    // Добавляем пользователя в группу
    const userGroup = await prisma.userGroup.create({
      data: {
        userId: parseInt(userId),
        groupId: parseInt(id), // ИСПРАВЛЕНО: используем id из params
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Логируем действие с правильным типом userId
    await audit.create(
      parseInt(session.user.id),
      'Group',
      group.id,
      {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        action: 'USER_ADDED_TO_GROUP',
      },
      request,
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({ userGroup }, { status: 201 });
  } catch (error) {
    console.error('Error adding user to group:', error);
    return NextResponse.json(
      { error: 'Ошибка при добавлении пользователя в группу' },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id]/users/[userId] - Удалить пользователя из группы
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> } // ИСПРАВЛЕНО: добавляем Promise
) {
  try {
    const { id, userId } = await params; // ИСПРАВЛЕНО: используем await
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const userGroup = await prisma.userGroup.findFirst({
      where: {
        groupId: parseInt(id), // ИСПРАВЛЕНО: используем id из params
        userId: parseInt(userId), // ИСПРАВЛЕНО: используем userId из params
      },
      include: {
        user: true,
        group: true,
      },
    });

    if (!userGroup) {
      return NextResponse.json({ error: 'Пользователь не найден в группе' }, { status: 404 });
    }

    await prisma.userGroup.delete({
      where: {
        id: userGroup.id,
      },
    });

    // Логируем действие с правильным типом userId
    await audit.delete(
      parseInt(session.user.id),
      'Group',
      userGroup.groupId,
      {
        userId: userGroup.user.id,
        userName: `${userGroup.user.firstName} ${userGroup.user.lastName}`,
        action: 'USER_REMOVED_FROM_GROUP',
      },
      request,
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({ message: 'Пользователь удален из группы' });
  } catch (error) {
    console.error('Error removing user from group:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении пользователя из группы' },
      { status: 500 }
    );
  }
}
