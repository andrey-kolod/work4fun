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
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    const group = await prisma.group.findUnique({
      where: { id: parseInt(id) },
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
        groupId: parseInt(id),
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

    // Логируем действие
    await audit.create(
      parseInt(session.user.id),
      'Group',
      group.id,
      {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        action: 'USER_ADDED_TO_GROUP',
      },
      request
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

// GET /api/groups/[id]/users - Получить пользователей группы
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const users = await prisma.userGroup.findMany({
      where: {
        groupId: parseInt(id),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching group users:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении пользователей группы' },
      { status: 500 }
    );
  }
}
