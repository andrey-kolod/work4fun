// app/api/groups/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';

// GET /api/groups - Получение списка групп
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Получаем группы, доступные пользователю
    const groups = await prisma.group.findMany({
      where: {
        users: { some: { userId: parseInt(session.user.id) } },
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ groups }, { status: 200 });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Ошибка при получении групп' }, { status: 500 });
  }
}

// POST /api/groups - Создание группы
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, projectId } = body;

    // Валидация
    if (!name || !projectId) {
      return NextResponse.json(
        { error: 'Название группы и ID проекта обязательны' },
        { status: 400 }
      );
    }

    // Проверяем существование проекта
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Создаем группу с привязкой к проекту
    const group = await prisma.group.create({
      data: {
        name,
        description: description || null,
        project: {
          connect: { id: parseInt(projectId) },
        },
      },
    });

    // Логируем действие
    await audit.create(
      parseInt(session.user.id),
      'Group',
      group.id,
      { name, description, projectId },
      request
    );

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Ошибка при создании группы' }, { status: 500 });
  }
}
