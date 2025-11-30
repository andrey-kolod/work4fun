// src/app/api/projects/[id]/users/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';

// POST /api/projects/[id]/users - Добавить пользователя в проект
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id);
    const body = await request.json();
    const { userId } = body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Проверяем права - только владелец, админы или супер-админы
    if (session.user.role === 'USER' && project.ownerId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Проверяем, что пользователь существует
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Проверяем, что пользователь еще не в проекте
    const existingUserProject = await prisma.userProject.findFirst({
      where: {
        userId: parseInt(userId),
        projectId,
      },
    });

    if (existingUserProject) {
      return NextResponse.json({ error: 'Пользователь уже в проекте' }, { status: 400 });
    }

    // Добавляем пользователя в проект
    const userProject = await prisma.userProject.create({
      data: {
        userId: parseInt(userId),
        projectId,
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
      'ProjectUser',
      userProject.id,
      {
        projectId,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
      },
      request,
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({ userProject }, { status: 201 });
  } catch (error) {
    console.error('Error adding user to project:', error);
    return NextResponse.json(
      { error: 'Ошибка при добавлении пользователя в проект' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/users/[userId] - Удалить пользователя из проекта
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id, userId } = await params;
    const projectId = parseInt(id);
    const targetUserId = parseInt(userId);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Проверяем права - только владелец, админы или супер-админы
    if (session.user.role === 'USER' && project.ownerId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Нельзя удалить владельца проекта
    if (targetUserId === project.ownerId) {
      return NextResponse.json({ error: 'Нельзя удалить владельца проекта' }, { status: 400 });
    }

    const userProject = await prisma.userProject.findFirst({
      where: {
        projectId,
        userId: targetUserId,
      },
      include: {
        user: true,
      },
    });

    if (!userProject) {
      return NextResponse.json({ error: 'Пользователь не найден в проекте' }, { status: 404 });
    }

    await prisma.userProject.delete({
      where: {
        id: userProject.id,
      },
    });

    // Логируем действие
    await audit.delete(
      parseInt(session.user.id),
      'ProjectUser',
      userProject.id,
      {
        projectId,
        userId: userProject.user.id,
        userName: `${userProject.user.firstName} ${userProject.user.lastName}`,
      },
      request,
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({ message: 'Пользователь удален из проекта' });
  } catch (error) {
    console.error('Error removing user from project:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении пользователя из проекта' },
      { status: 500 }
    );
  }
}
